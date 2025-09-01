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
  // Create a 9x9 grid from the available tables
  const createGridLayout = () => {
    const gridSize = 9;
    const grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null));
    
    // Place tables in the grid in a logical arrangement
    const tables = layout.tables;
    let tableIndex = 0;
    
    for (let row = 0; row < gridSize && tableIndex < tables.length; row++) {
      for (let col = 0; col < gridSize && tableIndex < tables.length; col++) {
        grid[row][col] = tables[tableIndex];
        tableIndex++;
      }
    }
    
    return grid;
  };

  const gridLayout = createGridLayout();

  return (
    <div className="assignment-section">
      <h2 className="text-xl font-bold text-gray-800 mb-4">{dayPart} Assignment Grid (9x9)</h2>
      
      <div className="grid-container-9x9">
        <div className="assignment-grid-9x9">
          {gridLayout.map((row, rowIndex) => (
            <div key={rowIndex} className="grid-row">
              {row.map((table, colIndex) => (
                <div key={`${rowIndex}-${colIndex}`} className="grid-cell">
                  {table ? (
                    <div className="station-card-9x9" data-station-id={table.id}>
                      {/* Station Header */}
                      <div className="station-header-9x9">
                        <h3 className="station-title-9x9">{table.name}</h3>
                      </div>
                      
                      {/* Station Columns/Tasks */}
                      <div className="station-content-9x9">
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
                          table.columns.map((column: string) => (
                            <div key={column} className="task-column-9x9">
                              <div className="task-header-9x9">
                                <span className="task-name-9x9">{column}</span>
                              </div>
                              <div className="task-assignments-9x9">
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
                          ))
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="empty-cell">
                      {/* Empty grid cell */}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AssignmentGrid;
