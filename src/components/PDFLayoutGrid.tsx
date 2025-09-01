'use client';

import React from 'react';
import { Layout, Assignment, Employee } from '@/types';
import DropZone from './DropZone';

interface PDFLayoutGridProps {
  layout: Layout;
  assignments: Assignment[string];
  dayPart: string;
  employees: Employee[];
  onDrop: (employee: Employee, tableId: string, columnName: string) => void;
  onRemove: (employeeName: string, tableId: string, columnName: string) => void;
  onMove?: (employeeName: string, fromTableId: string, fromColumn: string, toTableId: string, toColumn: string) => void;
}

const PDFLayoutGrid: React.FC<PDFLayoutGridProps> = ({
  layout,
  assignments,
  dayPart,
  employees,
  onDrop,
  onRemove,
  onMove
}) => {
  // Group stations based on 6-column layout with row-wise arrangement
  const getStationGroups = () => {
    if (dayPart === 'Breakfast') {
      // Row 1: Shift Manager, Handheld, Window 1, Window 2, Front Hand Wash, Customer Care
      // Row 2: Order Assembly, Kitchen Leader, Beverage Cell, Line 1, Line 2, Breaks
      // Row 3: Batch, Oven, Dive, Backroom, Hash Browns, DFS Discards
      return {
        column1: [
          'shift_manager', 'order_assembly', 'batch'
        ],
        column2: [
          'handheld', 'kitchen_leader', 'oven'
        ],
        column3: [
          'window1', 'beverage_cell', 'dive'
        ],
        column4: [
          'window2', 'line1', 'backroom'
        ],
        column5: [
          'front_hand_wash', 'line2', 'hash_browns'
        ],
        column6: [
          'customer_care', 'breaks', 'dfs_discards'
        ]
      };
    } else {
      // Lunch layout - Row-wise arrangement
      // Row 1: Shift Manager, Handheld, Window 1, Window 2, Front Hand Wash, Customer Care
      // Row 2: Order Assembly, Kitchen Leader, Beverage Cell, Line 1, Line 2, Breaks
      // Row 3: Batch Grill, Batch Chicken, Dive, Backroom, Fries, Delivery
      return {
        column1: [
          'shift_manager', 'order_assembly', 'batch_grill'
        ],
        column2: [
          'handheld', 'kitchen_leader', 'batch_chicken'
        ],
        column3: [
          'window1', 'beverage_cell', 'dive'
        ],
        column4: [
          'window2', 'line1', 'backroom'
        ],
        column5: [
          'front_hand_wash', 'line2', 'fries'
        ],
        column6: [
          'customer_care', 'breaks', 'delivery'
        ]
      };
    }
  };

  const stationGroups = getStationGroups();

  const renderStationGroup = (stationIds: string[], groupClass: string) => {
    // Handle undefined or empty arrays gracefully
    if (!stationIds || !Array.isArray(stationIds)) {
      return <div className={`station-group ${groupClass}`}></div>;
    }
    
    return (
      <div className={`station-group ${groupClass}`}>
        {stationIds.map(stationId => {
          const table = layout.tables.find(t => t.id === stationId);
          if (!table) return null;

          return (
            <div key={table.id} className={`station-card-compact ${table.id === 'shift_manager' ? 'shift-manager-card' : ''}`} data-station-id={table.id}>
              {/* Station Header */}
              <div className="station-header-compact">
                <h3 className="station-title-compact">{table.name}</h3>
              </div>
              
              {/* Station Columns/Tasks */}
              <div className="station-content-compact">
                {table.id === "dfs_discards" ? (
                  // Special handling for DFS table - no drag and drop, just informational
                  <div className="dfs-info-compact">
                    <div className="dfs-items-compact">
                      <div className="dfs-item-compact">
                        <span className="dfs-task-compact">milk discard</span>
                        <span className="dfs-day-compact">Mon</span>
                      </div>
                      <div className="dfs-item-compact">
                        <span className="dfs-task-compact">Shakes discard</span>
                        <span className="dfs-day-compact">Tue</span>
                      </div>
                      <div className="dfs-item-compact">
                        <span className="dfs-task-compact">Oil temps</span>
                        <span className="dfs-day-compact">Wed</span>
                      </div>
                      <div className="dfs-item-compact">
                        <span className="dfs-task-compact">Toaster cal.</span>
                        <span className="dfs-day-compact">Fri</span>
                      </div>
                      <div className="dfs-item-compact">
                        <span className="dfs-task-compact">Egg cal.</span>
                        <span className="dfs-day-compact">Sun</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Regular drag and drop functionality for other tables
                  table.columns.map((column) => (
                    <div key={column} className="task-column-compact">
                      <div className="task-header-compact">
                        <span className="task-name-compact">{column}</span>
                      </div>
                      <div className="task-assignments-compact">
                        <DropZone
                          tableId={table.id}
                          columnName={column}
                          employees={assignments?.[table.id]?.[column] || []}
                          allEmployees={employees}
                          onDrop={onDrop}
                          onRemove={onRemove}
                          onMove={onMove}
                          stationName={table.name}
                          assignments={assignments}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="assignment-section">
      <h2 className="text-lg font-bold text-gray-800 mb-3">{dayPart} Assignment Grid</h2>
      
      <div className="grid-container-compact">
        <div className="assignment-grid-compact">
          {/* Six column layout for maximum visibility */}
          <div className="six-column-layout">
            {renderStationGroup(stationGroups.column1, 'column1')}
            {renderStationGroup(stationGroups.column2, 'column2')}
            {renderStationGroup(stationGroups.column3, 'column3')}
            {renderStationGroup(stationGroups.column4, 'column4')}
            {renderStationGroup(stationGroups.column5, 'column5')}
            {renderStationGroup(stationGroups.column6, 'column6')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFLayoutGrid;
