'use client';

import React from 'react';
import { Layout, Assignment, Employee } from '@/types';
import DropZone from './DropZone';

interface TableAssignmentGridProps {
  layout: Layout;
  assignments: Assignment[string];
  dayPart: string;
  employees: Employee[];
  onDrop: (employee: Employee, tableId: string, columnName: string) => void;
  onRemove: (employeeName: string, tableId: string, columnName: string) => void;
  onMove?: (employeeName: string, fromTableId: string, fromColumn: string, toTableId: string, toColumn: string) => void;
}

const TableAssignmentGrid: React.FC<TableAssignmentGridProps> = ({
  layout,
  assignments,
  dayPart,
  employees,
  onDrop,
  onRemove,
  onMove
}) => {
  // Get all unique columns from all tables
  const getAllColumns = () => {
    const columnsSet = new Set<string>();
    layout.tables.forEach(table => {
      table.columns.forEach(column => columnsSet.add(column));
    });
    return Array.from(columnsSet).sort();
  };

  const allColumns = getAllColumns();

  return (
    <div className="assignment-section w-full">
      <h2 className="text-xl font-bold text-gray-800 mb-4">{dayPart} Assignment Grid</h2>
      
      <div className="table-container w-full overflow-x-auto">
        <table className="assignment-grid assignment-table w-full border-collapse">
          <thead>
            <tr>
              <th className="station-header-cell">Station</th>
              {allColumns.map((column) => (
                <th key={column} className="column-header-cell">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {layout.tables.map((table) => (
              <tr key={table.id} className="station-row">
                <td className="station-name-cell">
                  <div className="station-name">{table.name}</div>
                  {table.id === "dfs_discards" && (
                    <div className="dfs-info">
                      <div className="text-xs text-gray-600 mt-1">
                        <div>• Milk & hot chocolate discard (Mon)</div>
                        <div>• Shakes, sunday & topping discard (Tue)</div>
                        <div>• Oil drop temperatures (Wed)</div>
                        <div>• Muffin, Toaster calibration (Fri)</div>
                        <div>• Egg cookers calibrations (Sun)</div>
                      </div>
                    </div>
                  )}
                </td>
                {allColumns.map((column) => (
                  <td key={`${table.id}-${column}`} className="assignment-cell">
                    {table.columns.includes(column) && table.id !== "dfs_discards" ? (
                      <DropZone
                        tableId={table.id}
                        columnName={column}
                        employees={assignments?.[table.id]?.[column] || []}
                        allEmployees={employees}
                        onDrop={onDrop}
                        onRemove={onRemove}
                        onMove={onMove}
                      />
                    ) : (
                      <div className="empty-assignment-cell">
                        {table.id === "dfs_discards" ? "-" : ""}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableAssignmentGrid;
