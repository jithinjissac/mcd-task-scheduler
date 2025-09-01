'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Employee, Assignment } from '@/types';
import EmployeeCard from './EmployeeCard';
import { Users, Search, Upload, Plus, X, Check } from 'lucide-react';

interface HorizontalEmployeePoolProps {
  employees: Employee[];
  assignments: Assignment;
  currentDayPart: string;
  onDragStart: (employee: Employee) => void;
  onFileUpload?: () => void;
  onEmployeeClick?: (employee: Employee) => void;
  onAddEmployee?: (employee: Employee) => void;
}

const HorizontalEmployeePool: React.FC<HorizontalEmployeePoolProps> = ({
  employees,
  assignments,
  currentDayPart,
  onDragStart,
  onFileUpload,
  onEmployeeClick,
  onAddEmployee
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    shiftStart: '',
    shiftEnd: '',
    minor: false,
    task: ''
  });

  // Manage body scroll when modal is open
  useEffect(() => {
    if (showAddForm) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showAddForm]);

  // Check if an employee is assigned in the current day part
  const isEmployeeAssigned = useCallback((employeeName: string): boolean => {
    const dayPartAssignments = assignments[currentDayPart];
    if (!dayPartAssignments) return false;

    return Object.values(dayPartAssignments).some(tableAssignments =>
      Object.values(tableAssignments).some(columnAssignments =>
        columnAssignments.includes(employeeName)
      )
    );
  }, [assignments, currentDayPart]);

  // Filter employees based on search term and assignment status
  const filteredEmployees = useMemo(() => {
    const availableEmployees = employees.filter(emp => !isEmployeeAssigned(emp.name));
    
    if (!searchTerm.trim()) {
      return availableEmployees;
    }
    
    return availableEmployees.filter(employee =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.shiftStart.includes(searchTerm) ||
      employee.shiftEnd.includes(searchTerm) ||
      (employee.task && employee.task.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [employees, searchTerm, isEmployeeAssigned]);

  // Handle form submission for adding new employee
  const handleAddEmployee = useCallback(async () => {
    setFormErrors({});
    setIsSubmitting(true);

    // Validation
    const errors: {[key: string]: string} = {};

    if (!newEmployee.name.trim()) {
      errors.name = 'Employee name is required';
    }

    if (!newEmployee.shiftStart) {
      errors.shiftStart = 'Shift start time is required';
    }

    if (!newEmployee.shiftEnd) {
      errors.shiftEnd = 'Shift end time is required';
    }

    // Check if employee name already exists
    if (newEmployee.name.trim() && employees.some(emp => emp.name.toLowerCase() === newEmployee.name.toLowerCase())) {
      errors.name = 'An employee with this name already exists';
    }

    // Validate time format (basic check)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (newEmployee.shiftStart && !timeRegex.test(newEmployee.shiftStart)) {
      errors.shiftStart = 'Please use valid time format (HH:MM)';
    }

    if (newEmployee.shiftEnd && !timeRegex.test(newEmployee.shiftEnd)) {
      errors.shiftEnd = 'Please use valid time format (HH:MM)';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setIsSubmitting(false);
      return;
    }

    try {
      const employeeToAdd: Employee = {
        name: newEmployee.name.trim(),
        shiftStart: newEmployee.shiftStart,
        shiftEnd: newEmployee.shiftEnd,
        minor: newEmployee.minor,
        task: newEmployee.task.trim() || undefined
      };

      if (onAddEmployee) {
        await onAddEmployee(employeeToAdd);
      }

      // Reset form with success animation
      setNewEmployee({
        name: '',
        shiftStart: '',
        shiftEnd: '',
        minor: false,
        task: ''
      });
      setFormErrors({});
      setShowAddForm(false);

      // Add success class to button briefly
      const saveButton = document.querySelector('.btn-save');
      if (saveButton) {
        saveButton.classList.add('success');
        setTimeout(() => saveButton.classList.remove('success'), 600);
      }
    } catch (error) {
      console.error('Error adding employee:', error);
      setFormErrors({ general: 'Failed to add employee. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  }, [newEmployee, employees, onAddEmployee]);

  const handleCancelAdd = useCallback(() => {
    setNewEmployee({
      name: '',
      shiftStart: '',
      shiftEnd: '',
      minor: false,
      task: ''
    });
    setFormErrors({});
    setIsSubmitting(false);
    setShowAddForm(false);
  }, []);

  const assignedEmployees = employees.filter(emp => isEmployeeAssigned(emp.name));
  const totalEmployees = employees.length;
  const assignedCount = assignedEmployees.length;
  const availableCount = employees.length - assignedCount;

  return (
    <div className="employee-pool-horizontal-container">
      <div className="employee-pool-header-horizontal">
        <div className="employee-pool-title-horizontal">
          <Users className="w-5 h-5" />
          <h2 className="text-lg font-bold">Staff Pool</h2>
        </div>
        
        <div className="employee-stats-horizontal">
          <span className="stat-item">Total: {totalEmployees}</span>
          <span className="stat-item available">Available: {availableCount}</span>
          <span className="stat-item assigned">Assigned: {assignedCount}</span>
        </div>

        {/* Search Box */}
        <div className="employee-search-horizontal">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input-horizontal"
            />
          </div>
        </div>

        {/* Import Schedule Button */}
        <button
          onClick={onFileUpload}
          className="add-staff-button bg-red-600 hover:bg-red-700"
          title="Import schedule from CSV/Excel file"
        >
          <Upload className="w-4 h-4" />
          <span>Import Schedule</span>
        </button>

        {/* Add Employee Button */}
        <button
          onClick={() => setShowAddForm(true)}
          className="add-staff-button"
          title="Add new employee manually"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff</span>
        </button>
      </div>
      
      {/* Available Employees - Horizontal Scroll */}
      <div className="available-employees-horizontal">
        <div className="employees-list-horizontal">
          {filteredEmployees.length === 0 ? (
            <div className="no-employees-horizontal">
              {searchTerm ? 'No employees match your search' : 'No available employees'}
            </div>
          ) : (
            filteredEmployees.map((employee) => (
              <div key={employee.name} className="employee-card-horizontal-wrapper">
                <div onClick={() => onEmployeeClick && onEmployeeClick(employee)}>
                  <EmployeeCard
                    employee={employee}
                    isAssigned={false}
                    onDragStart={onDragStart}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Assigned Employees - Collapsible */}
      {assignedCount > 0 && (
        <details className="assigned-employees-section">
          <summary className="assigned-employees-header">
            <span>Assigned Employees ({assignedCount})</span>
          </summary>
          <div className="assigned-employees-list">
            {assignedEmployees.map((employee) => (
              <div key={employee.name} className="assigned-employee-card">
                <span className="employee-name">{employee.name}</span>
                <span className="employee-time">{employee.shiftStart}-{employee.shiftEnd}</span>
                {employee.minor && <span className="minor-badge-small">M</span>}
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Add Employee Form Modal */}
      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <div className="modal-title">
                <Plus className="w-5 h-5" />
                <h2>Add New Employee</h2>
              </div>
              <button 
                onClick={handleCancelAdd}
                className="modal-close-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="add-employee-form">
              {/* Employee Name */}
              <div className="form-group">
                <label className="form-label required">Employee Name</label>
                <input
                  type="text"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee(prev => ({ ...prev, name: e.target.value }))}
                  className={`form-input ${formErrors.name ? 'error' : ''}`}
                  placeholder="Enter employee name"
                  required
                />
                {formErrors.name && <div className="form-error">{formErrors.name}</div>}
              </div>

              {/* Shift Times */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">Shift Start</label>
                  <input
                    type="time"
                    value={newEmployee.shiftStart}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, shiftStart: e.target.value }))}
                    className={`form-input ${formErrors.shiftStart ? 'error' : ''}`}
                    required
                  />
                  <div className="form-help" title="Enter the time when the employee's shift begins (24-hour format)">Use 24-hour format (e.g., 09:00)</div>
                  {formErrors.shiftStart && <div className="form-error">{formErrors.shiftStart}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label required">Shift End</label>
                  <input
                    type="time"
                    value={newEmployee.shiftEnd}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, shiftEnd: e.target.value }))}
                    className={`form-input ${formErrors.shiftEnd ? 'error' : ''}`}
                    required
                  />
                  <div className="form-help" title="Enter the time when the employee's shift ends (24-hour format)">Use 24-hour format (e.g., 17:00)</div>
                  {formErrors.shiftEnd && <div className="form-error">{formErrors.shiftEnd}</div>}
                </div>
              </div>

              {/* Task (Optional) */}
              <div className="form-group">
                <label className="form-label">Task (Optional)</label>
                <input
                  type="text"
                  value={newEmployee.task}
                  onChange={(e) => setNewEmployee(prev => ({ ...prev, task: e.target.value }))}
                  className="form-input"
                  placeholder="Enter task or role (e.g., Manager, Crew)"
                />
                <div className="form-help" title="Optional field to specify the employee's role or primary task">Leave blank if not applicable</div>
              </div>

              {/* Minor Status */}
              <div className="form-checkbox-group">
                <input
                  type="checkbox"
                  id="minor-checkbox"
                  checked={newEmployee.minor}
                  onChange={(e) => setNewEmployee(prev => ({ ...prev, minor: e.target.checked }))}
                  className="form-checkbox"
                />
                <label htmlFor="minor-checkbox" className="checkbox-label">
                  Minor (under 18 years old)
                </label>
              </div>

              {/* General Error */}
              {formErrors.general && (
                <div className="form-error general-error">{formErrors.general}</div>
              )}

              {/* Form Actions */}
              <div className="form-buttons">
                <button
                  onClick={handleCancelAdd}
                  className="btn-cancel"
                  type="button"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddEmployee}
                  className={`btn-save ${isSubmitting ? 'loading' : ''}`}
                  type="submit"
                  disabled={isSubmitting}
                >
                  <Check className="w-4 h-4" />
                  {isSubmitting ? 'Adding...' : 'Add Employee'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HorizontalEmployeePool;
