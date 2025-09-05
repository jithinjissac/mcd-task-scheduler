 'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Employee, Assignment } from '@/types';
import { X, Search, Users, Clock, MapPin } from 'lucide-react';

interface EmployeeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  currentEmployee?: Employee;
  stationName: string;
  taskName: string;
  onEmployeeSelect: (employee: Employee, action: 'replace' | 'add') => void;
  assignments?: Assignment[string]; // Current day part assignments
  currentDayPart?: string;
}

const EmployeeSelectionModal: React.FC<EmployeeSelectionModalProps> = ({
  isOpen,
  onClose,
  employees,
  currentEmployee,
  stationName,
  taskName,
  onEmployeeSelect,
  assignments = {},
  currentDayPart = 'Breakfast'
}) => {
  // Manage body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setSelectedEmployee(null);
      setShowConfirmation(false);
    }
  }, [isOpen]);

  // Mount guard to ensure document is available (server-safe)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;

  // Helper function to find where an employee is currently assigned
  const findEmployeeAssignments = (employeeName: string) => {
    const employeeAssignments: Array<{ stationId: string; taskName: string }> = [];
    
    if (!assignments) return employeeAssignments;

    // assignments is the current day part assignments: Record<string, Record<string, string[]>>
    // Structure: assignments[stationId][taskName] = [employeeNames]
    for (const stationId of Object.keys(assignments)) {
      const stationAssignments = assignments[stationId] || {};
      for (const taskName of Object.keys(stationAssignments)) {
        const assignedEmployees = stationAssignments[taskName] || [];
        if (assignedEmployees.includes(employeeName)) {
          employeeAssignments.push({ stationId, taskName });
        }
      }
    }
    return employeeAssignments;
  };

  const availableEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEmployeeClick = (employee: Employee) => {
    if (currentEmployee) {
      setSelectedEmployee(employee);
      setShowConfirmation(true);
    } else {
      onEmployeeSelect(employee, 'add');
      onClose();
    }
  };

  const handleConfirmAction = (action: 'replace' | 'add') => {
    if (selectedEmployee) {
      onEmployeeSelect(selectedEmployee, action);
      onClose();
    }
  };

  const getEmployeeStats = () => {
    const total = employees.length;
    const assigned = employees.filter(emp => {
      const employeeAssignments = findEmployeeAssignments(emp.name);
      return employeeAssignments.length > 0;
    }).length;
    const available = total - assigned;
    return { total, available, assigned };
  };

  const stats = getEmployeeStats();

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Close modal if clicking on the overlay (not on the modal content)
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirmationOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Close confirmation dialog if clicking on the overlay (not on the dialog content)
    if (e.target === e.currentTarget) {
      setShowConfirmation(false);
    }
  };

  const modalContent = (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={handleOverlayClick}>
      <div className="modal-container">
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title">
            <Users className="modal-icon" />
            <div>
              <h2>Select Employee</h2>
              <p>{stationName} - {taskName}</p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={20} />
          </button>
        </div>

        {/* Current Assignment */}
        {currentEmployee && (
          <div className="current-assignment">
            <h3>Currently Assigned:</h3>
            <div className="current-employee-card">
              <span className="employee-name">{currentEmployee.name}</span>
              <span className="employee-time">
                <Clock size={12} />
                {currentEmployee.shiftStart} - {currentEmployee.shiftEnd}
              </span>
            </div>
          </div>
        )}

        {/* Employee Stats */}
        <div className="employee-stats-modal">
          <div className="stat-item-modal total">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-item-modal available">
            <span className="stat-number">{stats.available}</span>
            <span className="stat-label">Available</span>
          </div>
          <div className="stat-item-modal assigned">
            <span className="stat-number">{stats.assigned}</span>
            <span className="stat-label">Assigned</span>
          </div>
        </div>

        {/* Search */}
        <div className="search-container-modal">
          <Search className="search-icon-modal" size={16} />
          <input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input-modal"
          />
        </div>

        {/* Employee List */}
        <div className="employee-list-modal">
          {availableEmployees.map((employee) => {
            const employeeAssignments = findEmployeeAssignments(employee.name);
            const isAssigned = employeeAssignments.length > 0;
            
            return (
              <div
                key={employee.name}
                onClick={() => handleEmployeeClick(employee)}
                className={`employee-card-modal ${employee.minor ? 'minor' : ''} ${isAssigned ? 'assigned' : ''}`}>
                <div className="employee-info-modal">
                  <div className="employee-main-info">
                    <span className="employee-name-modal">{employee.name}</span>
                    <span className="employee-time-modal">
                      <Clock size={12} />
                      {employee.shiftStart} - {employee.shiftEnd}
                    </span>
                  </div>
                  {/* Show current assignments if any */}
                  {isAssigned && (
                    <div className="current-assignments-indicator">
                      <MapPin size={12} />
                      <span className="assignments-text">
                        Currently at: {employeeAssignments.map(a => `${a.stationId}-${a.taskName}`).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
                <div className="employee-badges-modal">
                  {employee.minor && (
                    <span className="minor-badge-modal">Minor</span>
                  )}
                  {isAssigned && (
                    <span className="assigned-badge-modal">Assigned ({employeeAssignments.length})</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {availableEmployees.length === 0 && (
          <div className="no-employees-modal">
            <p>No available employees found</p>
          </div>
        )}

        {/* Confirmation Dialog */}
        {showConfirmation && selectedEmployee && (
          <div className="confirmation-overlay" onClick={handleConfirmationOverlayClick}>
            <div className="confirmation-dialog">
              <h3>Employee Assignment</h3>
              <p>
                You selected <strong>{selectedEmployee.name}</strong> for{' '}
                <strong>{stationName} - {taskName}</strong>
              </p>
              <p>What would you like to do?</p>

              <div className="confirmation-buttons">
                <button
                  onClick={() => handleConfirmAction('replace')}
                  className="confirm-btn replace"
                >
                  Replace {currentEmployee?.name}
                </button>
                <button
                  onClick={() => handleConfirmAction('add')}
                  className="confirm-btn add"
                >
                  Add to Station
                </button>
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="confirm-btn cancel"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);

};

export default EmployeeSelectionModal;
