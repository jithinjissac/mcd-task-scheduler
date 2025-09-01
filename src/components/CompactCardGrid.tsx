'use client';

import React from 'react';
import { Layout, Assignment, Employee } from '@/types';
import DropZone from './DropZone';

interface CompactCardGridProps {
  layout: Layout;
  assignments: Assignment[string];
  dayPart: string;
  employees: Employee[];
  onDrop: (employee: Employee, tableId: string, columnName: string) => void;
  onRemove: (employeeName: string, tableId: string, columnName: string) => void;
  onMove?: (employeeName: string, fromTableId: string, fromColumn: string, toTableId: string, toColumn: string) => void;
}

const CompactCardGrid: React.FC<CompactCardGridProps> = ({
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
      <h2 className="text-lg font-bold text-gray-800 mb-3">{dayPart} Assignment Grid</h2>
      
      <div className="compact-cards-container">
        <div className="compact-cards-grid">
          {layout.tables.map((table) => (
            <div key={table.id} className="station-card-compact" data-station-id={table.id}>
              {/* Station Header */}
              <div className="station-card-header">
                <h3 className="station-card-title">{table.name}</h3>
              </div>
              
              {/* Station Content */}
              <div className="station-card-content">
                {table.id === "dfs_discards" ? (
                  // Special handling for DFS table
                  <div className="dfs-compact-info">
                    <div className="dfs-tasks-compact">
                      <div className="dfs-task-item">Milk discard (Mon)</div>
                      <div className="dfs-task-item">Shakes discard (Tue)</div>
                      <div className="dfs-task-item">Oil temps (Wed)</div>
                      <div className="dfs-task-item">Muffin cal (Fri)</div>
                      <div className="dfs-task-item">Egg cal (Sun)</div>
                    </div>
                  </div>
                ) : table.columns.length === 1 ? (
                  // Single column station
                  <div className="single-column-area">
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
                  // Multiple columns station
                  <div className="multi-column-area">
                    {table.columns.map((column, index) => (
                      <div key={column} className="column-section">
                        <div className="column-label">{column.length > 8 ? column.substring(0, 6) + '..' : column}</div>
                        <div className="column-drop-area">
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
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompactCardGrid;
