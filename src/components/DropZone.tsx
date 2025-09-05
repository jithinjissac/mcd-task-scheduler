'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Employee } from '@/types';
import { X } from 'lucide-react';
import EmployeeSelectionModal from './EmployeeSelectionModal';
import TinyRemoveButton from './TinyRemoveButton';

interface DropZoneProps {
  tableId: string;
  columnName: string;
  employees: string[];
  allEmployees: Employee[];
  onDrop: (employee: Employee, tableId: string, columnName: string) => void;
  onRemove: (employeeName: string, tableId: string, columnName: string) => void;
  onMove?: (employeeName: string, fromTableId: string, fromColumn: string, toTableId: string, toColumn: string) => void;
  stationName?: string;
  assignments?: Record<string, Record<string, string[]>>;
}

const DropZone: React.FC<DropZoneProps> = ({
  tableId,
  columnName,
  employees,
  allEmployees,
  onDrop,
  onRemove,
  onMove,
  stationName = tableId,
  assignments = {}
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [pendingAssignment, setPendingAssignment] = useState<{
    employee: Employee;
    currentAssignments: Array<{stationId: string, taskName: string}>;
    isBreakAssignment?: boolean;
  } | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Mount state for portal
  useEffect(() => { 
    setMounted(true); 
    return () => setMounted(false); 
  }, []);

  // Manage body scroll when confirmation modal is open
  useEffect(() => {
    if (showConfirmDialog) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showConfirmDialog]);
  
  // Touch state for drag and drop
  const [touchDragData, setTouchDragData] = useState<{
    employee: Employee | null;
    startPosition: { x: number; y: number } | null;
    currentPosition: { x: number; y: number } | null;
    isDragging: boolean;
    dragElement: HTMLElement | null;
  }>({
    employee: null,
    startPosition: null,
    currentPosition: null,
    isDragging: false,
    dragElement: null
  });

  // Helper function to find all assignments for an employee
  const findAllEmployeeAssignments = (employeeName: string) => {
    const allAssignments: Array<{stationId: string, taskName: string}> = [];
    for (const stationId of Object.keys(assignments)) {
      for (const taskName of Object.keys(assignments[stationId] || {})) {
        const assignedEmployees = assignments[stationId][taskName] || [];
        if (assignedEmployees.includes(employeeName)) {
          allAssignments.push({ stationId, taskName });
        }
      }
    }
    return allAssignments;
  };

  // Helper function to find where an employee is currently assigned (first one for backward compatibility)
  const findEmployeeAssignment = (employeeName: string) => {
    const allAssignments = findAllEmployeeAssignments(employeeName);
    return allAssignments.length > 0 ? allAssignments[0] : null;
  };

  // Handle assignment with conflict checking
  const handleAssignmentWithConfirmation = (employee: Employee) => {
    const allAssignments = findAllEmployeeAssignments(employee.name);
    
    // If employee is already assigned to this exact location, do nothing
    const isAlreadyAssignedHere = allAssignments.some(
      assignment => assignment.stationId === tableId && assignment.taskName === columnName
    );
    if (isAlreadyAssignedHere) {
      return;
    }
    
    // Special handling for breaks - simple confirmation and remove all other assignments
    const isBreakAssignment = columnName.toLowerCase() === 'breaks' || tableId.toLowerCase() === 'breaks';
    
    if (isBreakAssignment && allAssignments.length > 0) {
      // Going on break - simple confirmation
      setPendingAssignment({
        employee,
        currentAssignments: allAssignments,
        isBreakAssignment: true
      });
      setShowConfirmDialog(true);
    } else if (allAssignments.length > 0) {
      // Regular assignment with existing assignments
      setPendingAssignment({
        employee,
        currentAssignments: allAssignments,
        isBreakAssignment: false
      });
      setShowConfirmDialog(true);
    } else {
      // Employee is not assigned anywhere, proceed with assignment
      onDrop(employee, tableId, columnName);
    }
  };

  // Confirm the assignment move (remove from all current locations)
  const confirmAssignment = () => {
    if (pendingAssignment) {
      // Remove from all current assignments and add to new location
      pendingAssignment.currentAssignments.forEach(assignment => {
        onRemove(pendingAssignment.employee.name, assignment.stationId, assignment.taskName);
      });
      onDrop(pendingAssignment.employee, tableId, columnName);
    }
    setShowConfirmDialog(false);
    setPendingAssignment(null);
  };

  // Add to both stations (keep existing + add new) - not available for breaks
  const assignToBoth = () => {
    if (pendingAssignment && !pendingAssignment.isBreakAssignment) {
      // Just add to new location without removing from current
      onDrop(pendingAssignment.employee, tableId, columnName);
    }
    setShowConfirmDialog(false);
    setPendingAssignment(null);
  };

  // Cancel the assignment
  const cancelAssignment = () => {
    setShowConfirmDialog(false);
    setPendingAssignment(null);
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Close modal if clicking on the overlay (not on the modal content)
    if (e.target === e.currentTarget) {
      cancelAssignment();
    }
  };

  // Touch handlers for drag and drop
  const handleTouchStart = (e: React.TouchEvent, employeeName: string) => {
    const touch = e.touches[0];
    const employee = allEmployees.find(emp => emp.name === employeeName);
    
    if (!employee) return;
    
    const startPosition = { x: touch.clientX, y: touch.clientY };
    
    setTouchDragData({
      employee,
      startPosition,
      currentPosition: startPosition,
      isDragging: false,
      dragElement: e.currentTarget as HTMLElement
    });
    
    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.transform = 'scale(1.05)';
      e.currentTarget.style.transition = 'transform 0.2s ease';
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchDragData.employee || !touchDragData.startPosition) return;
    
    const touch = e.touches[0];
    const currentPosition = { x: touch.clientX, y: touch.clientY };
    
    // Calculate distance moved
    const deltaX = currentPosition.x - touchDragData.startPosition.x;
    const deltaY = currentPosition.y - touchDragData.startPosition.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Start dragging if moved more than 10px
    if (distance > 10 && !touchDragData.isDragging) {
      setTouchDragData(prev => ({ ...prev, isDragging: true }));
      
      // Add dragging visual feedback
      if (touchDragData.dragElement) {
        touchDragData.dragElement.style.opacity = '0.7';
        touchDragData.dragElement.style.transform = 'scale(1.1) rotate(5deg)';
        touchDragData.dragElement.style.zIndex = '1000';
        touchDragData.dragElement.style.position = 'fixed';
        touchDragData.dragElement.style.left = `${currentPosition.x - 50}px`;
        touchDragData.dragElement.style.top = `${currentPosition.y - 25}px`;
        touchDragData.dragElement.style.pointerEvents = 'none';
      }
    }
    
    if (touchDragData.isDragging && touchDragData.dragElement) {
      // Update drag element position
      touchDragData.dragElement.style.left = `${currentPosition.x - 50}px`;
      touchDragData.dragElement.style.top = `${currentPosition.y - 25}px`;
      
      // Check if over a drop zone
      const elementBelow = document.elementFromPoint(currentPosition.x, currentPosition.y);
      const dropZone = elementBelow?.closest('[data-drop-zone]');
      
      if (dropZone && dropZone !== e.currentTarget.closest('[data-drop-zone]')) {
        setIsDragOver(false);
        // Highlight the target drop zone
        dropZone.classList.add('touch-drag-over');
      } else {
        // Remove highlight from all drop zones
        document.querySelectorAll('.touch-drag-over').forEach(el => {
          el.classList.remove('touch-drag-over');
        });
      }
    }
    
    setTouchDragData(prev => ({ ...prev, currentPosition }));
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchDragData.employee) return;
    
    if (touchDragData.isDragging && touchDragData.currentPosition) {
      // Find drop target
      const elementBelow = document.elementFromPoint(
        touchDragData.currentPosition.x, 
        touchDragData.currentPosition.y
      );
      const dropZone = elementBelow?.closest('[data-drop-zone]');
      
      if (dropZone && dropZone !== e.currentTarget.closest('[data-drop-zone]')) {
        // Get drop zone info from data attributes
        const targetTableId = dropZone.getAttribute('data-table-id');
        const targetColumnName = dropZone.getAttribute('data-column-name');
        
        if (targetTableId && targetColumnName) {
          // Simulate drop by calling the assignment handler directly
          handleAssignmentWithConfirmation(touchDragData.employee);
        }
      }
    } else {
      // Single tap - open employee selection
      handleEmployeeClick(touchDragData.employee.name);
    }
    
    // Reset visual feedback
    if (touchDragData.dragElement) {
      touchDragData.dragElement.style.transform = '';
      touchDragData.dragElement.style.opacity = '';
      touchDragData.dragElement.style.zIndex = '';
      touchDragData.dragElement.style.position = '';
      touchDragData.dragElement.style.left = '';
      touchDragData.dragElement.style.top = '';
      touchDragData.dragElement.style.pointerEvents = '';
      touchDragData.dragElement.style.transition = '';
    }
    
    // Remove all drag over highlights
    document.querySelectorAll('.touch-drag-over').forEach(el => {
      el.classList.remove('touch-drag-over');
    });
    
    // Reset touch drag state
    setTouchDragData({
      employee: null,
      startPosition: null,
      currentPosition: null,
      isDragging: false,
      dragElement: null
    });
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Set the correct drop effect to show accept cursor
    const dataTypes = e.dataTransfer.types;
    if (dataTypes.includes('application/json')) {
      e.dataTransfer.dropEffect = 'move';
      setIsDragOver(true);
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set drag over to false if we're leaving the drop zone entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    try {
      // Try to get data from different formats
      let data = e.dataTransfer.getData('application/json');
      
      if (!data) {
        data = e.dataTransfer.getData('text/plain');
        if (data) {
          // If we only have text data, try to find the employee
          const employee = allEmployees.find(emp => emp.name === data);
          if (employee) {
            console.log('Processing text-based drop:', employee.name);
            handleAssignmentWithConfirmation(employee);
            return;
          }
        }
      }
      
      console.log('Drop data received:', data); // Debug log
      
      if (!data) {
        console.error('No data in drop event');
        return;
      }

      const employeeData = JSON.parse(data);
      console.log('Parsed employee data:', employeeData); // Debug log
      
      // Check if this is an internal move (station-to-station) or external drop (from pool)
      if (employeeData.fromTableId && employeeData.fromColumn && onMove) {
        console.log('Processing internal move:', {
          from: `${employeeData.fromTableId}-${employeeData.fromColumn}`,
          to: `${tableId}-${columnName}`
        }); // Debug log
        
        // Internal move between stations - only move if different location
        if (employeeData.fromTableId !== tableId || employeeData.fromColumn !== columnName) {
          onMove(employeeData.name, employeeData.fromTableId, employeeData.fromColumn, tableId, columnName);
        }
      } else {
        console.log('Processing external drop from pool'); // Debug log
        // External drop from employee pool - check for conflicts
        handleAssignmentWithConfirmation(employeeData);
      }
    } catch (error) {
      console.error('Error parsing dropped data:', error);
    }
  };

  const handleEmployeeDragStart = (e: React.DragEvent, employeeName: string) => {
    e.stopPropagation();
    
    const employee = allEmployees.find(emp => emp.name === employeeName);
    if (!employee) {
      console.error('Employee not found:', employeeName);
      return;
    }

    // Include source location for internal moves
    const dragData = {
      ...employee,
      fromTableId: tableId,
      fromColumn: columnName
    };

    console.log('Starting drag for employee:', dragData); // Debug log

    // Set data with correct MIME type
    const dragDataString = JSON.stringify(dragData);
    e.dataTransfer.setData('application/json', dragDataString);
    e.dataTransfer.setData('text/plain', employeeName); // Fallback
    e.dataTransfer.effectAllowed = 'move';
    
    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleEmployeeDragEnd = (e: React.DragEvent) => {
    // Reset visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  };

  const getEmployeeInfo = (employeeName: string) => {
    return allEmployees.find(emp => emp.name === employeeName);
  };

  const handleEmployeeDoubleClick = (employeeName: string) => {
    const employeeInfo = getEmployeeInfo(employeeName);
    if (employeeInfo) {
      setSelectedEmployee(employeeInfo);
      setShowModal(true);
    }
  };

  const handleModalEmployeeSelect = (newEmployee: Employee, action: 'replace' | 'add') => {
    if (action === 'replace' && selectedEmployee) {
      // Remove the current employee and add the new one
      onRemove(selectedEmployee.name, tableId, columnName);
      handleAssignmentWithConfirmation(newEmployee);
    } else if (action === 'add') {
      // Check for conflicts before adding
      handleAssignmentWithConfirmation(newEmployee);
    }
    setShowModal(false);
    setSelectedEmployee(null);
  };

  const handleEmployeeClick = (employeeName: string) => {
    const employee = allEmployees.find(emp => emp.name === employeeName);
    if (employee) {
      setSelectedEmployee(employee);
      setShowModal(true);
    }
  };

  const handleDropZoneClick = () => {
    // Open modal for adding new employee to empty spot
    setSelectedEmployee(null);
    setShowModal(true);
  };

  return (
    <>
      <div
        className={`
          drop-zone
          ${isDragOver ? 'drag-over' : ''}
        `}
        style={{ 
          cursor: employees.length === 0 ? 'pointer' : 'default',
          minHeight: '30px',
          height: 'fit-content',
          maxHeight: 'none',
          overflow: 'visible',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.125rem',
          boxSizing: 'border-box'
        }}
        data-drop-zone="true"
        data-table-id={tableId}
        data-column-name={columnName}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={employees.length === 0 ? handleDropZoneClick : undefined}
      >
        {employees.length === 0 ? (
          <div className="text-gray-400 text-sm text-center py-4">
            Drop employee here or click to select
          </div>
        ) : (
          <div 
            className="employee-assignments-container"
            style={{
              height: 'fit-content',
              maxHeight: 'none',
              overflow: 'visible',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.125rem'
            }}
          >
            {employees.map((employeeName, index) => {
              const employeeInfo = getEmployeeInfo(employeeName);
              return (
                <div
                  key={`${employeeName}-${index}`}
                  className={`
                    employee-card
                    ${employeeInfo?.minor ? 'minor-employee' : ''}
                    in-drop-zone
                  `}
                  draggable
                  onDragStart={(e) => handleEmployeeDragStart(e, employeeName)}
                  onDragEnd={handleEmployeeDragEnd}
                  onTouchStart={(e) => handleTouchStart(e, employeeName)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onClick={() => handleEmployeeClick(employeeName)}
                  style={{ 
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                    userSelect: 'none'
                  }}
                >
                  {employeeInfo?.minor && <div className="minor-badge">M</div>}
                  
                  <div className="flex items-center justify-between">
                    <div className="employee-info flex items-center gap-2 flex-1 min-w-0">
                      <div className="employee-name text-sm truncate">
                        {employeeName}
                      </div>
                      {employeeInfo && (
                        <div className="employee-role text-xs text-gray-600 whitespace-nowrap">
                          {employeeInfo.shiftStart} - {employeeInfo.shiftEnd}
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
                      variant="dot"
                      className="opacity-70 hover:opacity-100 transition-opacity"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <EmployeeSelectionModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedEmployee(null);
        }}
        employees={allEmployees}
        currentEmployee={selectedEmployee || undefined}
        stationName={stationName}
        taskName={columnName}
        onEmployeeSelect={handleModalEmployeeSelect}
        assignments={assignments}
        currentDayPart="current"
      />

      {/* Assignment Conflict Confirmation Dialog */}
      {showConfirmDialog && pendingAssignment && mounted && createPortal(
        <div className="modal-overlay" onClick={handleOverlayClick}>
          <div className="modal-container">
            <div className="p-6">
              {pendingAssignment.isBreakAssignment ? (
                // Simple break confirmation
                <>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Assign to Break
                  </h3>
                  <p className="text-gray-600 mb-4">
                    <strong>{pendingAssignment.employee.name}</strong> is currently working at {pendingAssignment.currentAssignments.length} station(s).
                  </p>
                  <p className="text-gray-600 mb-6">
                    Assigning to break will remove them from all current assignments. Are you sure?
                  </p>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={cancelAssignment}
                      className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmAssignment}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      Yes, Send to Break
                    </button>
                  </div>
                </>
              ) : (
                // Regular assignment conflict
                <>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Employee Already Assigned
                  </h3>
                  <p className="text-gray-600 mb-4">
                    <strong>{pendingAssignment.employee.name}</strong> is currently assigned to:
                  </p>
                  <div className="bg-gray-50 rounded-lg p-3 mb-6">
                    {pendingAssignment.currentAssignments.map((assignment, index) => (
                      <div key={index} className="flex justify-between items-center py-1">
                        <span className="font-medium text-gray-800">
                          {assignment.stationId} - {assignment.taskName}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-gray-600 mb-6">
                    What would you like to do with the assignment to{' '}
                    <strong>{stationName} - {columnName}</strong>?
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-end">
                    <button
                      onClick={cancelAssignment}
                      className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors order-3 sm:order-1"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={assignToBoth}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors order-1 sm:order-2"
                    >
                      Add to Current ({pendingAssignment.currentAssignments.length + 1} total)
                    </button>
                    <button
                      onClick={confirmAssignment}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors order-2 sm:order-3"
                    >
                      Move Only
                    </button>
                  </div>
                  <div className="mt-3 text-sm text-gray-500">
                    <p><strong>Add to Current:</strong> Keep all current assignments and add this new one</p>
                    <p><strong>Move Only:</strong> Remove from all current stations and assign only to new one</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default DropZone;
