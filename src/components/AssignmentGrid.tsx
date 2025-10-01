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
  onMove?: (employeeName: string, fromTableId: string, fromColumn: string, toTableId: string, toColumn: string) => void;
}

const AssignmentGrid: React.FC<AssignmentGridProps> = ({
  layout,
  assignments,
  dayPart,
  employees,
  onDrop,
  onRemove,
  onMove
}) => {
  return (
    <div className="assignment-section">
      <h2 className="text-xl font-bold text-gray-800 mb-4">{dayPart} Assignment Grid</h2>
      
      <div className="grid-container-responsive">
        <div className="assignment-grid-responsive">
          {layout.tables.map((table) => (
            <div key={table.id} className="station-card-responsive" data-station-id={table.id}>
              {/* Station Header */}
              <div className="station-header-responsive">
                <h3 className="station-title-responsive">{table.name}</h3>
              </div>
              
              {/* Station Columns/Tasks */}
              <div className="station-content-responsive">
                {table.columns.map((column: string) => (
                  <div key={column} className="task-column-responsive">
                    <div className="task-header-responsive">
                      <span className="task-name-responsive">{column}</span>
                    </div>
                    <div className="task-assignments-responsive">
                      <DropZone
                        tableId={table.id}
                        columnName={column}
                        employees={assignments?.[table.id]?.[column] || []}
                        allEmployees={employees}
                        onDrop={onDrop}
                        onRemove={onRemove}
                        onMove={onMove}
                        assignments={assignments}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AssignmentGrid;
