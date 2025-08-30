'use client';

import React from 'react';
import { DayPart } from '@/types';

interface DayPartTabsProps {
  currentDayPart: DayPart;
  onDayPartChange: (dayPart: DayPart) => void;
}

const DayPartTabs: React.FC<DayPartTabsProps> = ({
  currentDayPart,
  onDayPartChange
}) => {
  const dayParts: DayPart[] = ['Breakfast', 'Day Part 1', 'Day Part 2'];

  const getTabStyles = (dayPart: DayPart) => {
    const isActive = currentDayPart === dayPart;
    return `
      px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200
      ${isActive 
        ? 'bg-red-600 text-white shadow-md' 
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }
    `;
  };

  const getTabDescription = (dayPart: DayPart): string => {
    switch (dayPart) {
      case 'Breakfast':
        return 'Morning operations with breakfast-specific stations';
      case 'Day Part 1':
        return 'Lunch operations - first shift';
      case 'Day Part 2':
        return 'Dinner operations - second shift';
      default:
        return '';
    }
  };

  return (
    <div className="day-part-tabs">
      {dayParts.map((dayPart) => (
        <button
          key={dayPart}
          onClick={() => onDayPartChange(dayPart)}
          className={`day-part-tab ${currentDayPart === dayPart ? 'active' : ''}`}
        >
          {dayPart}
        </button>
      ))}
    </div>
  );
};

export default DayPartTabs;
