'use client';

import React, { useState, useMemo } from 'react';
import { Employee, Assignment } from '@/types';
import EmployeeCard from './EmployeeCard';
import { Users, Search, Upload } from 'lucide-react';

interface EmployeePoolProps {
  employees: Employee[];
  assignments: Assignment;
  currentDayPart: string;
  onDragStart: (employee: Employee) => void;
  onFileUpload?: () => void;
}

const EmployeePool: React.FC<EmployeePoolProps> = ({
  employees,
  assignments,
  currentDayPart,
  onDragStart,
  onFileUpload
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Check if an employee is assigned in the current day part
  const isEmployeeAssigned = (employeeName: string): boolean => {
    const dayPartAssignments = assignments[currentDayPart];
    if (!dayPartAssignments) return false;

    return Object.values(dayPartAssignments).some(tableAssignments =>
      Object.values(tableAssignments).some(columnAssignments =>
        columnAssignments.includes(employeeName)
      )
    );
  };

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
  }, [employees, assignments, currentDayPart, searchTerm]);

  const assignedEmployees = employees.filter(emp => isEmployeeAssigned(emp.name));
  const totalEmployees = employees.length;
  const assignedCount = assignedEmployees.length;
  const availableCount = employees.length - assignedCount;

  return (
    <div className="employee-pool">
      <h2>Staff Management</h2>
      
      {/* Search Box */}
      <div className="employee-search">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search employees by name, shift time..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      <h3 className="text-lg font-semibold text-gray-800 mb-4 mt-6">Available Staff</h3>
      
      {/* Stats */}
      <div className="bg-white rounded-lg p-4 mb-6 border border-gray-100 shadow-sm">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-mcdonalds-red">{totalEmployees}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{assignedCount}</div>
            <div className="text-sm text-gray-600">Assigned</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-mcdonalds-yellow">{availableCount}</div>
            <div className="text-sm text-gray-600">Available</div>
          </div>
        </div>
      </div>

      {/* Available Employees */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Available for Assignment ({filteredEmployees.length})
          {searchTerm && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              - filtered from {availableCount}
            </span>
          )}
        </h3>
        {filteredEmployees.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            {totalEmployees === 0 ? (
              <div>
                <p className="text-lg mb-4">No schedule imported yet</p>
                <button
                  onClick={onFileUpload}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-mcdonalds-yellow hover:bg-mcdonalds-yellow-dark text-mcdonalds-dark font-semibold rounded-lg transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <Upload className="w-5 h-5" />
                  <span>Import Schedule</span>
                </button>
              </div>
            ) : searchTerm ? (
              <p className="text-lg">No employees found matching "{searchTerm}"</p>
            ) : (
              <p className="text-lg">All employees are assigned</p>
            )}
          </div>
        ) : (
          <div className="employee-grid">
            {filteredEmployees.map((employee: Employee) => (
              <EmployeeCard
                key={employee.name}
                employee={employee}
                isAssigned={false}
                onDragStart={onDragStart}
              />
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
        <h4 className="text-lg font-semibold text-blue-800 mb-3">💡 Quick Tips</h4>
        <ul className="text-sm text-blue-700 space-y-2">
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Drag employees to assign them to tasks
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            Yellow cards indicate minor employees
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            Click X to remove assignments
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Employees can work multiple positions
          </li>
        </ul>
      </div>
    </div>
  );
};

export default EmployeePool;
