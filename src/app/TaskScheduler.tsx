'use client';

import React, { useState, useEffect } from 'react';
import { Employee, Assignment, DayPart, Layout } from '@/types';
import { defaultLayouts } from '@/data/layouts';
import Header from '@/components/Header';
import DayPartTabs from '@/components/DayPartTabs';
import EmployeePool from '@/components/EmployeePool';
import AssignmentGrid from '@/components/AssignmentGrid';

const TaskScheduler: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignments, setAssignments] = useState<Assignment>({});
  const [currentDayPart, setCurrentDayPart] = useState<DayPart>('Breakfast');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [draggedEmployee, setDraggedEmployee] = useState<Employee | null>(null);

  // Initialize assignments structure when employees or layouts change
  useEffect(() => {
    initializeAssignments();
  }, [employees]);

  const initializeAssignments = () => {
    const newAssignments: Assignment = {};
    const dayParts: DayPart[] = ['Breakfast', 'Day Part 1', 'Day Part 2'];
    
    dayParts.forEach(dayPart => {
      newAssignments[dayPart] = {};
      const layout = dayPart === 'Breakfast' ? defaultLayouts.breakfast : defaultLayouts.dayPart;
      
      layout.tables.forEach(table => {
        newAssignments[dayPart][table.id] = {};
        table.columns.forEach(column => {
          newAssignments[dayPart][table.id][column] = [];
        });
      });
    });

    setAssignments(newAssignments);
  };

  const getCurrentLayout = (): Layout => {
    return currentDayPart === 'Breakfast' ? defaultLayouts.breakfast : defaultLayouts.dayPart;
  };

  const handleEmployeesUploaded = (newEmployees: Employee[]) => {
    setEmployees(newEmployees);
  };

  const handleDragStart = (employee: Employee) => {
    setDraggedEmployee(employee);
  };

  const handleDrop = (employee: Employee, tableId: string, columnName: string) => {
    setAssignments(prev => {
      const newAssignments = { ...prev };
      
      // Ensure the structure exists
      if (!newAssignments[currentDayPart]) {
        newAssignments[currentDayPart] = {};
      }
      if (!newAssignments[currentDayPart][tableId]) {
        newAssignments[currentDayPart][tableId] = {};
      }
      if (!newAssignments[currentDayPart][tableId][columnName]) {
        newAssignments[currentDayPart][tableId][columnName] = [];
      }

      // Check if employee is already assigned to this position
      const currentAssignments = newAssignments[currentDayPart][tableId][columnName];
      if (!currentAssignments.includes(employee.name)) {
        newAssignments[currentDayPart][tableId][columnName] = [
          ...currentAssignments,
          employee.name
        ];
      }

      return newAssignments;
    });

    setDraggedEmployee(null);
  };

  const handleRemove = (employeeName: string, tableId: string, columnName: string) => {
    setAssignments(prev => {
      const newAssignments = { ...prev };
      
      if (newAssignments[currentDayPart]?.[tableId]?.[columnName]) {
        newAssignments[currentDayPart][tableId][columnName] = 
          newAssignments[currentDayPart][tableId][columnName].filter(
            name => name !== employeeName
          );
      }

      return newAssignments;
    });
  };

  const handleDayPartChange = (dayPart: DayPart) => {
    setCurrentDayPart(dayPart);
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  // Get current day part assignments, ensuring structure exists
  const getCurrentAssignments = () => {
    return assignments[currentDayPart] || {};
  };

  return (
    <div className="app-container">
      <Header
        employees={employees}
        assignments={assignments}
        layouts={defaultLayouts}
        selectedDate={selectedDate}
        onEmployeesUploaded={handleEmployeesUploaded}
        onDateChange={handleDateChange}
      />
      
      <DayPartTabs
        currentDayPart={currentDayPart}
        onDayPartChange={handleDayPartChange}
      />
      
      <div className="main-content">
        <EmployeePool
          employees={employees}
          assignments={assignments}
          currentDayPart={currentDayPart}
          onDragStart={handleDragStart}
          onFileUpload={() => {
            // Trigger the file input in header
            const fileInput = document.getElementById('schedule-upload') as HTMLInputElement;
            if (fileInput) {
              fileInput.click();
            }
          }}
        />
        
        <AssignmentGrid
          layout={getCurrentLayout()}
          assignments={getCurrentAssignments()}
          dayPart={currentDayPart}
          employees={employees}
          onDrop={handleDrop}
          onRemove={handleRemove}
        />
      </div>
    </div>
  );
};

export default TaskScheduler;
