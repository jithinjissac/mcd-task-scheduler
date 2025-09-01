// Core employee data structure
export interface Employee {
  minor: boolean;
  name: string;
  shiftStart: string;
  shiftEnd: string;
  task?: string;
}

// Assignment structure - maps employees to specific table/column combinations
export interface Assignment {
  [dayPart: string]: {
    [tableId: string]: {
      [columnName: string]: string[]; // Array of employee names
    };
  };
}

// Layout configuration for different day parts
export interface TableColumn {
  name: string;
}

export interface Table {
  id: string;
  name: string;
  columns: string[];
}

export interface Layout {
  tables: Table[];
}

// Different layouts for different day parts
export interface Layouts {
  breakfast: Layout;
  dayPart: Layout;
}

// Day part enumeration
export type DayPart = 'Breakfast' | 'Lunch';

// File upload types
export interface FileUploadResult {
  success: boolean;
  employees?: Employee[];
  error?: string;
}

// Export data structure
export interface ExportData {
  minor: boolean;
  employeeName: string;
  shiftStartTime: string;
  shiftEndTime: string;
  task: string;
  dayPart: string;
  table: string;
  column: string;
}

// Component props interfaces
export interface EmployeeCardProps {
  employee: Employee;
  isAssigned: boolean;
  onDragStart: (employee: Employee) => void;
}

export interface DropZoneProps {
  tableId: string;
  columnName: string;
  employees: string[];
  onDrop: (employee: Employee, tableId: string, columnName: string) => void;
  onRemove: (employeeName: string, tableId: string, columnName: string) => void;
}

export interface AssignmentGridProps {
  layout: Layout;
  assignments: Assignment[string];
  dayPart: string;
  employees: Employee[];
  onDrop: (employee: Employee, tableId: string, columnName: string) => void;
  onRemove: (employeeName: string, tableId: string, columnName: string) => void;
}

export interface EmployeePoolProps {
  employees: Employee[];
  assignments: Assignment;
  currentDayPart: string;
  onDragStart: (employee: Employee) => void;
}

// Drag and drop event types
export interface DragStartEvent extends DragEvent {
  dataTransfer: DataTransfer;
}

export interface DropEvent extends DragEvent {
  dataTransfer: DataTransfer;
  currentTarget: HTMLElement;
}

// Application state interface
export interface AppState {
  employees: Employee[];
  assignments: Assignment;
  layouts: Layouts;
  currentDayPart: DayPart;
  selectedDate: Date;
  draggedEmployee: Employee | null;
}

// CSV/XLSX parsing result
export interface ParseResult {
  data: any[];
  errors: any[];
  meta: {
    fields?: string[];
    delimiter?: string;
    linebreak?: string;
    aborted?: boolean;
    truncated?: boolean;
  };
}
