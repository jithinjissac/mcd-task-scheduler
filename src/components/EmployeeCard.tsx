'use client';

import React from 'react';
import { Employee } from '@/types';
import { Clock } from 'lucide-react';

interface EmployeeCardProps {
  employee: Employee;
  isAssigned: boolean;
  onDragStart: (employee: Employee) => void;
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({ 
  employee, 
  isAssigned, 
  onDragStart 
}) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify(employee));
    e.dataTransfer.effectAllowed = 'copy';
    onDragStart(employee);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={`
        employee-card
        ${isAssigned ? 'assigned' : ''}
        ${employee.minor ? 'minor-employee' : ''}
      `}
    >
      {employee.minor && <div className="minor-badge">Minor</div>}
      
      <div className="employee-name">
        {employee.name}
      </div>
      
      <div className="employee-role flex items-center gap-1">
        <Clock className="w-3 h-3" />
        {employee.shiftStart} - {employee.shiftEnd}
      </div>
      
      {employee.task && (
        <div className="text-xs text-gray-500 mt-2">
          Pre-assigned: {employee.task}
        </div>
      )}
      
      {isAssigned && (
        <div className="text-xs text-blue-600 font-medium mt-2">
          Currently Assigned
        </div>
      )}
    </div>
  );
};

export default EmployeeCard;
