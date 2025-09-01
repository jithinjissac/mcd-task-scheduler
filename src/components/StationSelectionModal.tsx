 'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Layout, Employee, Assignment } from '@/types';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  layout: Layout;
  // assignments for the current day part: map tableId -> column -> employee names
  assignments: Assignment[string] | undefined;
  employee: Employee | null;
  onAssign: (employee: Employee, tableId: string, columnName: string) => void;
}

const StationSelectionModal: React.FC<Props> = ({ isOpen, onClose, layout, assignments, employee, onAssign }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);

  // Manage body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!isOpen || !mounted || !employee) return null;

  const handleAssign = (tableId: string, columnName: string) => {
    onAssign(employee, tableId, columnName);
    onClose();
  };

  const modal = (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-container">
        <div className="modal-header">
          <div className="modal-title">
            <h2>Select Station</h2>
            <p>{employee.name}</p>
          </div>
          <button onClick={onClose} className="modal-close-btn"><X size={18} /></button>
        </div>

        <div className="station-list">
          {layout.tables.map(table => (
            <div key={table.id} className="station-card">
              <div className="station-row">
                <div className="station-left">
                  <div className="station-icon">
                    {table.name ? table.name.charAt(0).toUpperCase() : table.id.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="station-name">{table.name || table.id}</div>
                    <div className="station-sub">{table.columns.length} stations available</div>
                  </div>
                </div>
                <div className="station-count">
                  {table.columns.reduce((total, col) => {
                    const assigned = (assignments?.[table.id]?.[col] || []) as string[];
                    return total + assigned.length;
                  }, 0)} assigned
                </div>
              </div>
              
              <div className="station-columns">
                {table.columns.map(col => {
                  const assigned = (assignments?.[table.id]?.[col] || []) as string[];
                  const alreadyHere = assigned.includes(employee.name);
                  return (
                    <div key={col} className="station-column-pill">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1">
                          <div className="text-sm font-medium">{col}</div>
                          <div className="text-xs opacity-70">{assigned.length} staff</div>
                        </div>
                        <button
                          onClick={() => handleAssign(table.id, col)}
                          disabled={alreadyHere}
                          className={`station-add-btn ${alreadyHere ? 'assigned' : 'add'}`}
                        >
                          {alreadyHere ? 'Assigned' : 'Add'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default StationSelectionModal;
