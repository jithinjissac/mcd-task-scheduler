import Papa from 'papaparse';
import { Employee, FileUploadResult, ExportData, Assignment } from '@/types';

// Parse CSV/XLSX file and convert to Employee objects
export const parseEmployeeFile = (file: File): Promise<FileUploadResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        
        Papa.parse(text, {
          header: false, // Parse without headers first
          skipEmptyLines: true,
          complete: (results) => {
            try {
              // Skip first row (day header) and use row 2 (index 1) as headers, skip row 3 (sub-headers)
              const rawData = results.data;
              if (rawData.length < 4) {
                resolve({
                  success: false,
                  error: 'CSV file must have at least 4 rows (headers + data)'
                });
                return;
              }

              // Skip row 0 (day header), use row 1 (index 0 after slice) as headers
              const dataAfterSkip = rawData.slice(1);
              const headers = dataAfterSkip[0] as string[]; // Row 1 becomes index 0
              // Skip row 2 (sub-headers, now index 1) and start data from row 3 (now index 2)
              const dataRows = dataAfterSkip.slice(2);

              const employees: Employee[] = dataRows.map((row: any) => {
                // Create object from headers and row data
                const rowObj: any = {};
                headers.forEach((header, index) => {
                  if (header && header.trim()) {
                    rowObj[header.trim()] = row[index] || '';
                  }
                });

                // Handle different possible column names
                const name = rowObj['Employee Name'] || rowObj['Name'] || rowObj['employee_name'] || rowObj['name'] || '';
                const minor = parseBoolean(rowObj['Minor'] || rowObj['minor'] || rowObj['Minor Employee'] || 'false');
                const shiftStart = rowObj['Shift Start Time'] || rowObj['Shift Start'] || rowObj['shift_start'] || '';
                const shiftEnd = rowObj['Shift End Time'] || rowObj['Shift End'] || rowObj['shift_end'] || '';
                const task = rowObj['Task'] || rowObj['task'] || '';

                // Validate required fields
                if (!name.trim()) {
                  throw new Error('Employee name is required');
                }
                if (!shiftStart.trim()) {
                  throw new Error('Shift start time is required');
                }
                if (!shiftEnd.trim()) {
                  throw new Error('Shift end time is required');
                }

                return {
                  name: name.trim(),
                  minor,
                  shiftStart: shiftStart.trim(),
                  shiftEnd: shiftEnd.trim(),
                  task: task.trim()
                };
              }).filter(employee => employee.name); // Filter out empty rows

              if (employees.length === 0) {
                resolve({
                  success: false,
                  error: 'No valid schedule data found in file'
                });
                return;
              }

              resolve({
                success: true,
                employees
              });
            } catch (error) {
              resolve({
                success: false,
                error: error instanceof Error ? error.message : 'Error parsing schedule data'
              });
            }
          },
          error: (error: any) => {
            resolve({
              success: false,
              error: `CSV parsing error: ${error.message}`
            });
          }
        });
      } catch (error) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Error reading file'
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        error: 'Error reading file'
      });
    };

    reader.readAsText(file);
  });
};

// Helper function to parse boolean values from CSV
const parseBoolean = (value: string): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    return lower === 'true' || lower === 'yes' || lower === '1';
  }
  return false;
};

// Convert assignments to export format
export const convertAssignmentsToExportData = (
  assignments: Assignment,
  employees: Employee[]
): ExportData[] => {
  const exportData: ExportData[] = [];
  
  // Create a map for quick employee lookup
  const employeeMap = new Map(employees.map(emp => [emp.name, emp]));

  Object.keys(assignments).forEach(dayPart => {
    const dayPartAssignments = assignments[dayPart];
    
    Object.keys(dayPartAssignments).forEach(tableId => {
      const tableAssignments = dayPartAssignments[tableId];
      
      Object.keys(tableAssignments).forEach(columnName => {
        const assignedEmployees = tableAssignments[columnName];
        
        assignedEmployees.forEach(employeeName => {
          const employee = employeeMap.get(employeeName);
          if (employee) {
            exportData.push({
              minor: employee.minor,
              employeeName: employee.name,
              shiftStartTime: employee.shiftStart,
              shiftEndTime: employee.shiftEnd,
              task: `${tableId}-${columnName}`,
              dayPart,
              table: tableId,
              column: columnName
            });
          }
        });
      });
    });
  });

  return exportData;
};

// Export data as CSV
export const exportToCSV = (data: ExportData[], filename: string = 'schedule-export.csv') => {
  const csv = Papa.unparse(data, {
    header: true,
    columns: ['minor', 'employeeName', 'shiftStartTime', 'shiftEndTime', 'task', 'dayPart', 'table', 'column']
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

// Generate and download CSV template
export const downloadTemplate = () => {
  const templateData = [
    {
      'Minor': 'No',
      'Employee Name': 'John Doe',
      'Shift Start Time': '6:00',
      'Shift End Time': '15:00',
      'Task': ''
    },
    {
      'Minor': 'Yes',
      'Employee Name': 'Jane Smith',
      'Shift Start Time': '7:00',
      'Shift End Time': '16:00',
      'Task': ''
    },
    {
      'Minor': 'No',
      'Employee Name': 'Bob Wilson',
      'Shift Start Time': '19:00',
      'Shift End Time': '23:00',
      'Task': ''
    }
  ];

  const csv = Papa.unparse(templateData, { header: true });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', 'employee-template.csv');
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

// Format time for display
export const formatTime = (time: string): string => {
  if (!time) return '';
  
  // Handle various time formats
  const timeStr = time.toString().trim();
  if (timeStr.includes(':')) {
    return timeStr;
  }
  
  // Convert from number format (e.g., 900 -> 9:00)
  const num = parseInt(timeStr);
  if (!isNaN(num)) {
    const hours = Math.floor(num / 100);
    const minutes = num % 100;
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  }
  
  return timeStr;
};

// Validate employee data
export const validateEmployee = (employee: Partial<Employee>): string[] => {
  const errors: string[] = [];
  
  if (!employee.name || !employee.name.trim()) {
    errors.push('Employee name is required');
  }
  
  if (!employee.shiftStart || !employee.shiftStart.trim()) {
    errors.push('Shift start time is required');
  }
  
  if (!employee.shiftEnd || !employee.shiftEnd.trim()) {
    errors.push('Shift end time is required');
  }
  
  return errors;
};
