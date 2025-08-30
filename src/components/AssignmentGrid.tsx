'use client';

import React from 'react';
import { Layout, Assignment, Employee } from '@/types';
import DropZone from './DropZone';

interface AssignmentGridProps {
  layout: Layout;
  assignments: Assignment[string];
  dayPart: string;
  employees: Employee[];
  onDrop: (employee: Employee, tableId: string, columnName: string) => void;
  onRemove: (employeeName: string, tableId: string, columnName: string) => void;
}

const AssignmentGrid: React.FC<AssignmentGridProps> = ({
  layout,
  assignments,
  dayPart,
  employees,
  onDrop,
  onRemove
}) => {
  return (
    <div className="assignment-section">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{dayPart} Assignment Grid</h2>
      
      <div className="assignment-grid grid grid-cols-3 gap-6">
        {layout.tables.map((table) => (
          <div key={table.id} className="station-card" data-station-id={table.id}>
            {/* Station Header */}
            <div className="station-header">
              <h3 className="station-title">{table.name}</h3>
            </div>
            
            {/* Station Columns/Tasks */}
            <div className="station-content">
              {table.id === "dfs_discards" ? (
                // Special handling for DFS table - no drag and drop, just informational
                <div className="dfs-info-table">
                  <div className="dfs-items">
                    <div className="dfs-item">
                      <span className="dfs-task">milk and hot chocolate discard</span>
                      <span className="dfs-day">Monday</span>
                    </div>
                    <div className="dfs-item">
                      <span className="dfs-task">Shakes, sunday and topping discard</span>
                      <span className="dfs-day">Tuesday</span>
                    </div>
                    <div className="dfs-item">
                      <span className="dfs-task">Oil drop temperatures recorded</span>
                      <span className="dfs-day">Wednesday</span>
                    </div>
                    <div className="dfs-item">
                      <span className="dfs-task">Muffin, Toaster calibration</span>
                      <span className="dfs-day">Friday</span>
                    </div>
                    <div className="dfs-item">
                      <span className="dfs-task">Egg cookers calibrations</span>
                      <span className="dfs-day">Sunday</span>
                    </div>
                  </div>
                </div>
              ) : (
                // Regular drag and drop functionality for other tables
                table.columns.map((column) => (
                  <div key={column} className="task-column">
                    <div className="task-header">
                      <span className="task-name">{column}</span>
                    </div>
                    <div className="task-assignments">
                      <DropZone
                        tableId={table.id}
                        columnName={column}
                        employees={assignments?.[table.id]?.[column] || []}
                        allEmployees={employees}
                        onDrop={onDrop}
                        onRemove={onRemove}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssignmentGrid;
