'use client';

import React, { useState } from 'react';
import { Employee } from '@/types';
import { X, Move, Clock } from 'lucide-react';
import TinyRemoveButton from './TinyRemoveButton';

interface EnhancedDropZoneProps {
  tableId: string;
  columnName: string;
  employees: string[];
  allEmployees: Employee[];
  onDrop: (employee: Employee, tableId: string, columnName: string) => void;
  onRemove: (employeeName: string, tableId: string, columnName: string) => void;
  onInternalDragStart: (employee: Employee, fromTableId: string, fromColumn: string) => void;
  onInternalDrop: (employee: Employee, toTableId: string, toColumn: string) => void;
  onDragEnd: () => void;
  compact?: boolean;
}

const EnhancedDropZone: React.FC<EnhancedDropZoneProps> = ({
  tableId,
  columnName,
  employees,
  allEmployees,
  onDrop,
  onRemove,
  onInternalDragStart,
  onInternalDrop,
  onDragEnd,
  compact = false
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    try {
      const data = e.dataTransfer.getData('application/json');
      const employeeData = JSON.parse(data);
      
      // Check if this is an internal move or external drop
      if (employeeData.fromTableId && employeeData.fromColumn) {
        // Internal move between stations
        onInternalDrop(employeeData, tableId, columnName);
      } else {
        // External drop from employee pool
        onDrop(employeeData, tableId, columnName);
      }
    } catch (error) {
      console.error('Error parsing dropped data:', error);
    }
  };

  const handleEmployeeDragStart = (e: React.DragEvent, employeeName: string) => {
    const employee = allEmployees.find(emp => emp.name === employeeName);
    if (!employee) return;

    const dragData = {
      ...employee,
      fromTableId: tableId,
      fromColumn: columnName
    };

    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';
    
    onInternalDragStart(employee, tableId, columnName);
  };

  const handleEmployeeDragEnd = () => {
    onDragEnd();
  };

  const getEmployeeInfo = (employeeName: string) => {
    return allEmployees.find(emp => emp.name === employeeName);
  };

  const formatShiftTime = (start: string, end: string) => {
    return `${start}-${end}`;
  };

  return (
    <div
      className={`min-h-16 border-2 border-dashed border-gray-300 rounded-lg p-2 transition-all duration-200 ${
        isDragOver ? 'border-mcdonalds-yellow bg-yellow-50 scale-105' : ''
      } ${compact ? 'min-h-12 p-1' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {employees.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-4">
          <div className="mb-2 opacity-50">
            <Move className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-xs text-gray-400">
            {compact ? 'Drop here' : 'Drag employee here'}
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          {employees.map((employeeName) => {
            const employee = getEmployeeInfo(employeeName);
            if (!employee) return null;

            return (
              <div
                key={employeeName}
                className="bg-white border border-gray-200 rounded-lg p-2 cursor-move transition-all duration-200 hover:shadow-md hover:border-mcdonalds-yellow hover:transform hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
                draggable
                onDragStart={(e) => handleEmployeeDragStart(e, employeeName)}
                onDragEnd={handleEmployeeDragEnd}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="employee-info flex items-center gap-2">
                      <span className="font-semibold text-gray-800 text-sm truncate flex-1">{employee.name}</span>
                      <div className="flex items-center gap-1 text-xs text-gray-600 whitespace-nowrap">
                        <Clock className="w-3 h-3" />
                        <span>{formatShiftTime(employee.shiftStart, employee.shiftEnd)}</span>
                      </div>
                    </div>
                    {!compact && employee.task && (
                      <div className="mt-1">
                        <div className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded inline-block">{employee.task}</div>
                      </div>
                    )}
                  </div>
                  <TinyRemoveButton
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onRemove(employeeName, tableId, columnName);
                    }}
                    size="micro"
                    variant="minimal"
                    className="opacity-60 hover:opacity-100 transition-opacity"
                  />
                </div>
                {compact && (
                  <div className="mt-1">
                    <span className="text-xs text-gray-500">
                      {formatShiftTime(employee.shiftStart, employee.shiftEnd)}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EnhancedDropZone;
