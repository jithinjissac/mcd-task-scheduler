'use client';

import React, { useState, useCallback } from 'react';
import { Layout, Assignment, Employee } from '@/types';
import EnhancedDropZone from './EnhancedDropZone';
import { Move, RotateCcw } from 'lucide-react';

interface ResponsiveAssignmentGridProps {
  layout: Layout;
  assignments: Assignment[string];
  dayPart: string;
  employees: Employee[];
  onDrop: (employee: Employee, tableId: string, columnName: string) => void;
  onRemove: (employeeName: string, tableId: string, columnName: string) => void;
  onMove: (employeeName: string, fromTableId: string, fromColumn: string, toTableId: string, toColumn: string) => void;
}

const ResponsiveAssignmentGrid: React.FC<ResponsiveAssignmentGridProps> = ({
  layout,
  assignments,
  dayPart,
  employees,
  onDrop,
  onRemove,
  onMove
}) => {
  const [draggedEmployee, setDraggedEmployee] = useState<{
    employee: Employee;
    fromTableId: string;
    fromColumn: string;
  } | null>(null);

  const handleInternalDragStart = useCallback((employee: Employee, fromTableId: string, fromColumn: string) => {
    setDraggedEmployee({ employee, fromTableId, fromColumn });
  }, []);

  const handleInternalDrop = useCallback((employee: Employee, toTableId: string, toColumn: string) => {
    if (draggedEmployee && (
      draggedEmployee.fromTableId !== toTableId || 
      draggedEmployee.fromColumn !== toColumn
    )) {
      // Move employee from one station to another
      onMove(
        employee.name,
        draggedEmployee.fromTableId,
        draggedEmployee.fromColumn,
        toTableId,
        toColumn
      );
    }
    setDraggedEmployee(null);
  }, [draggedEmployee, onMove]);

  const handleDragEnd = useCallback(() => {
    setDraggedEmployee(null);
  }, []);

  // Group stations by area for better responsive layout - using actual station IDs
  const stationAreas = {
    management: layout.tables.filter(table => 
      ['shift_manager', 'handheld'].includes(table.id)
    ),
    frontService: layout.tables.filter(table => 
      ['window1', 'window2', 'front_hand_wash', 'customer_care'].includes(table.id)
    ),
    kitchen: layout.tables.filter(table => 
      ['order_assembly', 'kitchen_leader', 'line1', 'line2', 'batch', 'batch_grill', 'batch_chicken', 'oven', 'hash_browns', 'fries'].includes(table.id)
    ),
    beverageAndSupport: layout.tables.filter(table => 
      ['beverage_cell', 'backroom'].includes(table.id)
    ),
    scheduling: layout.tables.filter(table => 
      ['breaks', 'dive', 'delivery'].includes(table.id)
    )
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
            {dayPart} Station Assignments
          </h2>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Move className="w-4 h-4" />
            <span className="hidden sm:inline">Drag employees between stations</span>
            <span className="sm:hidden">Drag to reassign</span>
          </div>
        </div>
      </div>

      {/* Station Areas - Responsive Grid */}
      <div className="space-y-8">
        
        {/* Management Area */}
        <div className="relative">
          <h3 className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 py-2 border-b border-gray-100 text-lg font-semibold text-mcdonalds-red mb-4 flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
            Management & Supervision
          </h3>
          <div className="overflow-x-auto">
            <div className="grid grid-cols-4 lg:grid-cols-6 xl:grid-cols-4 gap-4 min-w-max">
              {stationAreas.management.map((table) => (
                <StationCard
                  key={table.id}
                  table={table}
                  assignments={assignments}
                  employees={employees}
                  onDrop={onDrop}
                  onRemove={onRemove}
                  onInternalDragStart={handleInternalDragStart}
                  onInternalDrop={handleInternalDrop}
                  onDragEnd={handleDragEnd}
                  isDragMode={!!draggedEmployee}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Front Service Area */}
        <div className="relative">
          <h3 className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 py-2 border-b border-gray-100 text-lg font-semibold text-mcdonalds-red mb-4 flex items-center gap-2">
            <div className="w-3 h-3 bg-mcdonalds-red rounded-full"></div>
            Front Service & Drive Thru
          </h3>
          <div className="overflow-x-auto">
            <div className="grid grid-cols-4 lg:grid-cols-6 xl:grid-cols-4 gap-4 min-w-max">
              {stationAreas.frontService.map((table) => (
                <StationCard
                  key={table.id}
                  table={table}
                  assignments={assignments}
                  employees={employees}
                  onDrop={onDrop}
                  onRemove={onRemove}
                  onInternalDragStart={handleInternalDragStart}
                  onInternalDrop={handleInternalDrop}
                  onDragEnd={handleDragEnd}
                  isDragMode={!!draggedEmployee}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Kitchen Area */}
        <div className="relative">
          <h3 className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 py-2 border-b border-gray-100 text-lg font-semibold text-mcdonalds-red mb-4 flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            Kitchen Operations
          </h3>
          <div className="overflow-x-auto">
            <div className="grid grid-cols-4 lg:grid-cols-6 xl:grid-cols-4 gap-4 min-w-max">
              {stationAreas.kitchen.map((table) => (
                <StationCard
                  key={table.id}
                  table={table}
                  assignments={assignments}
                  employees={employees}
                  onDrop={onDrop}
                  onRemove={onRemove}
                  onInternalDragStart={handleInternalDragStart}
                  onInternalDrop={handleInternalDrop}
                  onDragEnd={handleDragEnd}
                  isDragMode={!!draggedEmployee}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Beverage & Support Area */}
        <div className="relative">
          <h3 className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 py-2 border-b border-gray-100 text-lg font-semibold text-mcdonalds-red mb-4 flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            Beverage & Support
          </h3>
          <div className="overflow-x-auto">
            <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 gap-4 min-w-max">
              {stationAreas.beverageAndSupport.map((table) => (
                <StationCard
                  key={table.id}
                  table={table}
                  assignments={assignments}
                  employees={employees}
                  onDrop={onDrop}
                  onRemove={onRemove}
                  onInternalDragStart={handleInternalDragStart}
                  onInternalDrop={handleInternalDrop}
                  onDragEnd={handleDragEnd}
                  isDragMode={!!draggedEmployee}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Scheduling & Breaks Area */}
        <div className="relative">
          <h3 className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 py-2 border-b border-gray-100 text-lg font-semibold text-mcdonalds-red mb-4 flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            Scheduling & Delivery
          </h3>
          <div className="overflow-x-auto">
            <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 gap-4 min-w-max">
              {stationAreas.scheduling.map((table) => (
                <StationCard
                  key={table.id}
                  table={table}
                  assignments={assignments}
                  employees={employees}
                  onDrop={onDrop}
                  onRemove={onRemove}
                  onInternalDragStart={handleInternalDragStart}
                  onInternalDrop={handleInternalDrop}
                  onDragEnd={handleDragEnd}
                  isDragMode={!!draggedEmployee}
                />
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Drag Indicator */}
      {draggedEmployee && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto bg-mcdonalds-yellow text-mcdonalds-red px-4 py-2 rounded-lg shadow-lg z-50 text-sm font-medium">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 animate-spin" />
            Moving {draggedEmployee.employee.name} - Drop on target station
          </div>
        </div>
      )}
    </div>
  );
};

// Individual Station Card Component
interface StationCardProps {
  table: Layout['tables'][0];
  assignments: Assignment[string];
  employees: Employee[];
  onDrop: (employee: Employee, tableId: string, columnName: string) => void;
  onRemove: (employeeName: string, tableId: string, columnName: string) => void;
  onInternalDragStart: (employee: Employee, fromTableId: string, fromColumn: string) => void;
  onInternalDrop: (employee: Employee, toTableId: string, toColumn: string) => void;
  onDragEnd: () => void;
  isDragMode: boolean;
}

const StationCard: React.FC<StationCardProps> = ({
  table,
  assignments,
  employees,
  onDrop,
  onRemove,
  onInternalDragStart,
  onInternalDrop,
  onDragEnd,
  isDragMode
}) => {
  const totalAssigned = Object.values(table.columns).reduce((total, column) => 
    total + (assignments?.[table.id]?.[column]?.length || 0), 0
  );

  return (
    <div className={`bg-white rounded-xl shadow-lg border-2 border-gray-100 transition-all duration-200 hover:shadow-xl hover:border-mcdonalds-yellow/50 hover:transform hover:-translate-y-1 ${
      isDragMode ? 'border-mcdonalds-yellow bg-yellow-50/50' : ''
    }`} style={{minHeight: '200px'}}>
      <div className="bg-gradient-to-r from-mcdonalds-red to-red-600 text-white p-3 rounded-t-xl">
        <h3 className="text-white font-bold text-sm sm:text-base">{table.name}</h3>
        <div className="text-red-100 text-xs mt-1">
          {totalAssigned} assigned
        </div>
      </div>
      
      <div className="p-3 space-y-2">
        {table.columns.map((column) => (
          <div key={column} className="border border-gray-100 rounded-lg p-2 bg-gray-50">
            <div className="bg-white px-2 py-1 rounded text-gray-700 border-b border-gray-200 text-xs font-medium mb-1">
              {column}
            </div>
            <EnhancedDropZone
              tableId={table.id}
              columnName={column}
              employees={assignments?.[table.id]?.[column] || []}
              allEmployees={employees}
              onDrop={onDrop}
              onRemove={onRemove}
              onInternalDragStart={onInternalDragStart}
              onInternalDrop={onInternalDrop}
              onDragEnd={onDragEnd}
              compact={true}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResponsiveAssignmentGrid;
