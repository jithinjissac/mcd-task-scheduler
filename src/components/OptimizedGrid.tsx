'use client';

import React from 'react';
import { Layout, Assignment, Employee } from '@/types';
import DropZone from './DropZone';
import Header from './Header';
import DayPartTabs from './DayPartTabs';

interface OptimizedGridProps {
  layout: Layout;
  assignments: Assignment[string]; 
  dayPart: string;
  employees: Employee[];
  onDrop: (employee: Employee, tableId: string, columnName: string) => void;
  onRemove: (employeeName: string, tableId: string, columnName: string) => void;
  onMove: (employeeName: string, fromTableId: string, fromColumn: string, toTableId: string, toColumn: string) => void;
  onScheduleImport?: () => void;
}

const OptimizedGrid: React.FC<OptimizedGridProps> = ({
  layout,
  assignments,
  dayPart,
  employees,
  onDrop,
  onRemove,
  onMove,
  onScheduleImport
}) => {
  // Get available employees (not assigned to any station)
  const getAvailableEmployees = () => {
    const assignedEmployees = new Set<string>();
    Object.values(assignments).forEach(table => {
      Object.values(table).forEach(column => {
        column.forEach(emp => assignedEmployees.add(emp));
      });
    });
    return employees.filter(emp => !assignedEmployees.has(emp.name));
  };

  const availableEmployees = getAvailableEmployees();

  // Group stations by type for better organization
  const organizeStations = () => {
    const frontStations = layout.tables.filter(table => 
      ['window1', 'window2', 'front_hand_wash', 'order_assembly', 'customer_care', 'handheld'].includes(table.id)
    );
    
    const kitchenStations = layout.tables.filter(table => 
      ['line1', 'line2', 'batch', 'batch_grill', 'batch_chicken', 'oven', 'kitchen_leader', 'fries', 'hash_browns'].includes(table.id)
    );
    
    const supportStations = layout.tables.filter(table => 
      ['shift_manager', 'backroom', 'beverage_cell', 'breaks', 'dive', 'delivery'].includes(table.id)
    );
    
    const specialStations = layout.tables.filter(table => 
      table.id === 'dfs_discards'
    );

    return { frontStations, kitchenStations, supportStations, specialStations };
  };

  const { frontStations, kitchenStations, supportStations, specialStations } = organizeStations();

  return (
    <div className="optimized-layout">
      {/* Header */}
      <div className="layout-header">
        <h2 className="layout-title">{dayPart} - Station Assignments</h2>
        <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
          Total Assigned: {employees.length - availableEmployees.length} | Available: {availableEmployees.length}
        </div>
      </div>

      {/* Schedule Import */}
      {onScheduleImport && (
        <div className="import-section" style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          backgroundColor: '#fff8dc', 
          border: '2px solid #FFB81C',
          borderRadius: '8px'
        }}>
          <button 
            onClick={onScheduleImport}
            className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg flex items-center gap-2 font-semibold transition-colors"
            style={{ backgroundColor: '#FFB81C', borderColor: '#FFB81C', color: '#000' }}
          >
            📋 Import Morning Schedule
          </button>
          <p className="text-sm text-gray-600 mt-1">
            Import daily staff schedules and auto-assign initial positions
          </p>
        </div>
      )}

      {/* Employee Pool - Horizontal */}
      <div className="employee-pool-horizontal">
        <div className="pool-header">
          <h3 className="pool-title">Available Staff ({availableEmployees.length})</h3>
          <small style={{ color: '#666', fontSize: '12px' }}>Drag employees to stations below</small>
        </div>
        <div className="employee-cards-horizontal">
          {availableEmployees.map((employee) => (
            <div
              key={employee.name}
              className="employee-card-horizontal"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/json', JSON.stringify(employee));
                e.dataTransfer.effectAllowed = 'move';
              }}
            >
              <div className="employee-info">
                <span className="employee-name-h">{employee.name}</span>
                <span className="employee-shift-h">{employee.shiftStart}-{employee.shiftEnd}</span>
              </div>
              {employee.minor && <span className="minor-badge">Minor</span>}
            </div>
          ))}
          {availableEmployees.length === 0 && (
            <div className="no-employees">All staff assigned</div>
          )}
        </div>
      </div>

      {/* Stations Grid - Organized by Areas */}
      <div className="stations-viewport">
        
        {/* Front of House */}
        <div className="station-section">
          <div className="section-header front-header">Front of House</div>
          <div className="station-grid-mini">
            {frontStations.map((table) => (
              <div key={table.id} className="mini-station-card">
                <div className="mini-station-header">{table.name}</div>
                <div className="mini-station-content">
                  {table.columns.length === 1 ? (
                    <div className="mini-single-drop">
                      <DropZone
                        tableId={table.id}
                        columnName={table.columns[0]}
                        employees={assignments?.[table.id]?.[table.columns[0]] || []}
                        allEmployees={employees}
                        onDrop={onDrop}
                        onRemove={onRemove}
                        onMove={onMove}
                      />
                    </div>
                  ) : (
                    <div className="mini-multi-drops">
                      {table.columns.map((column) => (
                        <div key={column} className="mini-column">
                          <div className="mini-col-label">{column.substring(0, 4)}</div>
                          <DropZone
                            tableId={table.id}
                            columnName={column}
                            employees={assignments?.[table.id]?.[column] || []}
                            allEmployees={employees}
                            onDrop={onDrop}
                            onRemove={onRemove}
                            onMove={onMove}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Kitchen */}
        <div className="station-section">
          <div className="section-header kitchen-header">Kitchen</div>
          <div className="station-grid-mini">
            {kitchenStations.map((table) => (
              <div key={table.id} className="mini-station-card">
                <div className="mini-station-header">{table.name}</div>
                <div className="mini-station-content">
                  {table.columns.length === 1 ? (
                    <div className="mini-single-drop">
                      <DropZone
                        tableId={table.id}
                        columnName={table.columns[0]}
                        employees={assignments?.[table.id]?.[table.columns[0]] || []}
                        allEmployees={employees}
                        onDrop={onDrop}
                        onRemove={onRemove}
                        onMove={onMove}
                      />
                    </div>
                  ) : (
                    <div className="mini-multi-drops">
                      {table.columns.map((column) => (
                        <div key={column} className="mini-column">
                          <div className="mini-col-label">{column.substring(0, 4)}</div>
                          <DropZone
                            tableId={table.id}
                            columnName={column}
                            employees={assignments?.[table.id]?.[column] || []}
                            allEmployees={employees}
                            onDrop={onDrop}
                            onRemove={onRemove}
                            onMove={onMove}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Support & Management */}
        <div className="station-section">
          <div className="section-header support-header">Support & Management</div>
          <div className="station-grid-mini">
            {supportStations.map((table) => (
              <div key={table.id} className="mini-station-card">
                <div className="mini-station-header">{table.name}</div>
                <div className="mini-station-content">
                  {table.columns.length === 1 ? (
                    <div className="mini-single-drop">
                      <DropZone
                        tableId={table.id}
                        columnName={table.columns[0]}
                        employees={assignments?.[table.id]?.[table.columns[0]] || []}
                        allEmployees={employees}
                        onDrop={onDrop}
                        onRemove={onRemove}
                        onMove={onMove}
                      />
                    </div>
                  ) : (
                    <div className="mini-multi-drops">
                      {table.columns.map((column) => (
                        <div key={column} className="mini-column">
                          <div className="mini-col-label">{column.substring(0, 4)}</div>
                          <DropZone
                            tableId={table.id}
                            columnName={column}
                            employees={assignments?.[table.id]?.[column] || []}
                            allEmployees={employees}
                            onDrop={onDrop}
                            onRemove={onRemove}
                            onMove={onMove}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DFS Special Section */}
        {specialStations.length > 0 && (
          <div className="station-section dfs-section">
            <div className="section-header dfs-header">Daily Food Safety</div>
            <div className="dfs-special-card">
              <div className="dfs-tasks-grid">
                {specialStations[0].columns.map((day) => (
                  <div key={day} className="dfs-day-item">
                    <div className="dfs-day-name">{day}</div>
                    <div className="dfs-task-desc">
                      {day === 'Monday' && 'Milk & Hot Choc'}
                      {day === 'Tuesday' && 'Shakes & Toppings'}
                      {day === 'Wednesday' && 'Oil Temperatures'}
                      {day === 'Friday' && 'Muffin & Toaster'}
                      {day === 'Sunday' && 'Egg Cookers'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Break Management Area */}
      <div className="break-management" style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: '#fff3cd', 
        border: '2px dashed #ffc107',
        borderRadius: '8px',
        minHeight: '80px'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#856404', fontSize: '16px', fontWeight: 'bold' }}>
          📋 Break Management
        </h3>
        <div style={{ fontSize: '14px', color: '#856404', marginBottom: '10px' }}>
          Drag employees here to send them on break
        </div>
        <DropZone
          tableId="breaks"
          columnName="break"
          employees={assignments?.['breaks']?.['break'] || []}
          allEmployees={availableEmployees}
          onDrop={onDrop}
          onRemove={onRemove}
          onMove={onMove}
        />
      </div>
    </div>
  );
};

export default OptimizedGrid;
