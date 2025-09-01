'use client';

import React from 'react';
import { Employee } from '@/types';
import { Clock } from 'lucide-react';

interface EmployeeCardProps {
  employee: Employee;
  isAssigned: boolean;
  onDragStart: (employee: Employee) => void;
  onDoubleClick?: (employee: Employee) => void;
  inDropZone?: boolean;
  stationName?: string;
  taskName?: string;
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({ 
  employee, 
  isAssigned, 
  onDragStart,
  onDoubleClick,
  inDropZone = false,
  stationName,
  taskName
}) => {
  let clickTimeout: NodeJS.Timeout | null = null;
  
  // Touch state for drag and drop
  const [touchDragData, setTouchDragData] = React.useState<{
    startPosition: { x: number; y: number } | null;
    isDragging: boolean;
  }>({
    startPosition: null,
    isDragging: false
  });

  const handleClick = () => {
    if (clickTimeout) {
      clearTimeout(clickTimeout);
      clickTimeout = null;
      // Double click detected
      if (onDoubleClick) {
        onDoubleClick(employee);
      }
    } else {
      clickTimeout = setTimeout(() => {
        clickTimeout = null;
        // Single click - could add single click functionality here if needed
      }, 300);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchDragData({
      startPosition: { x: touch.clientX, y: touch.clientY },
      isDragging: false
    });
    
    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.transform = 'scale(1.05)';
      e.currentTarget.style.transition = 'transform 0.2s ease';
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchDragData.startPosition) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchDragData.startPosition.x;
    const deltaY = touch.clientY - touchDragData.startPosition.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Start dragging if moved more than 10px
    if (distance > 10 && !touchDragData.isDragging) {
      // Only prevent default when we start dragging
      try {
        e.preventDefault();
      } catch (error) {
        // Ignore passive event listener errors
      }
      setTouchDragData(prev => ({ ...prev, isDragging: true }));
      onDragStart(employee);
      
      // Add dragging visual feedback
      if (e.currentTarget instanceof HTMLElement) {
        e.currentTarget.style.opacity = '0.7';
        e.currentTarget.style.transform = 'scale(1.1) rotate(5deg)';
        e.currentTarget.style.zIndex = '1000';
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Reset visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.transform = '';
      e.currentTarget.style.opacity = '';
      e.currentTarget.style.zIndex = '';
      e.currentTarget.style.transition = '';
    }
    
    if (!touchDragData.isDragging) {
      // Single tap
      handleClick();
    }
    
    // Reset touch state
    setTouchDragData({
      startPosition: null,
      isDragging: false
    });
  };
  const handleDragStart = (e: React.DragEvent) => {
    console.log('Employee card drag start:', employee.name); // Debug log
    
    // Set data with correct MIME type
    const employeeData = JSON.stringify(employee);
    e.dataTransfer.setData('application/json', employeeData);
    e.dataTransfer.setData('text/plain', employee.name); // Fallback
    e.dataTransfer.effectAllowed = 'move';
    
    // Create drag image
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.transform = 'rotate(5deg)';
    dragImage.style.opacity = '0.8';
    e.dataTransfer.setDragImage(dragImage, 50, 25);
    
    onDragStart(employee);
    
    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    console.log('Employee card drag end:', employee.name); // Debug log
    // Reset visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
      className={`
        employee-card
        ${isAssigned ? 'assigned' : ''}
        ${employee.minor ? 'minor-employee' : ''}
        ${inDropZone ? 'in-drop-zone' : ''}
      `}
      style={{ 
        cursor: onDoubleClick ? 'pointer' : 'move',
        touchAction: 'manipulation',
        userSelect: 'none'
      }}
      title={inDropZone ? 'Tap to change assignment or drag to move' : 'Drag to assign or tap for options'}
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
