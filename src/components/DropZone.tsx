'use client';

import React, { useState } from 'react';
import { Employee } from '@/types';
import { X } from 'lucide-react';

interface DropZoneProps {
  tableId: string;
  columnName: string;
  employees: string[];
  allEmployees: Employee[];
  onDrop: (employee: Employee, tableId: string, columnName: string) => void;
  onRemove: (employeeName: string, tableId: string, columnName: string) => void;
}

const DropZone: React.FC<DropZoneProps> = ({
  tableId,
  columnName,
  employees,
  allEmployees,
  onDrop,
  onRemove
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
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
      const employeeData = JSON.parse(e.dataTransfer.getData('application/json'));
      onDrop(employeeData, tableId, columnName);
    } catch (error) {
      console.error('Error parsing dropped data:', error);
    }
  };

  const getEmployeeInfo = (employeeName: string) => {
    return allEmployees.find(emp => emp.name === employeeName);
  };

  return (
    <div
      className={`
        drop-zone
        ${isDragOver ? 'drag-over' : ''}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {employees.length === 0 ? (
        <div className="text-gray-400 text-sm text-center py-4">
          Drop employee here
        </div>
      ) : (
        <div className="space-y-2">
          {employees.map((employeeName, index) => {
            const employeeInfo = getEmployeeInfo(employeeName);
            return (
              <div
                key={`${employeeName}-${index}`}
                className={`
                  employee-card
                  ${employeeInfo?.minor ? 'minor-employee' : ''}
                `}
              >
                {employeeInfo?.minor && <div className="minor-badge">M</div>}
                
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="employee-name text-sm">
                      {employeeName}
                    </div>
                    {employeeInfo && (
                      <div className="employee-role text-xs">
                        {employeeInfo.shiftStart} - {employeeInfo.shiftEnd}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => onRemove(employeeName, tableId, columnName)}
                    className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors"
                    title="Remove assignment"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DropZone;
