'use client';

import React from 'react';
import TinyRemoveButton from './TinyRemoveButton';

interface MiniEmployeeCardProps {
  name: string;
  position?: string;
  shift?: string;
  avatar?: string;
  onRemove?: () => void;
  className?: string;
  compact?: boolean;
}

const MiniEmployeeCard: React.FC<MiniEmployeeCardProps> = ({
  name,
  position = '',
  shift = '',
  avatar = '',
  onRemove,
  className = '',
  compact = true
}) => {
  // Generate initials for avatar if no avatar provided
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Ultra-compact styling for micro ghost design
  const cardClasses = compact 
    ? "flex items-center gap-1 p-1 rounded border bg-gray-50 hover:bg-blue-50 border-gray-200 hover:border-blue-300 transition-all duration-200 group min-h-[20px]"
    : "flex items-center gap-2 p-2 rounded-md border bg-white hover:bg-blue-50 border-gray-200 hover:border-blue-300 transition-all duration-200 group";

  const avatarSize = compact ? "w-3 h-3" : "w-6 h-6";
  const textSize = compact ? "text-[8px]" : "text-xs";
  const nameSize = compact ? "text-[9px]" : "text-sm";

  return (
    <div className={`${cardClasses} ${className}`}>
      {/* Avatar */}
      <div className={`${avatarSize} bg-blue-300 rounded-full flex items-center justify-center flex-shrink-0`}>
        {avatar ? (
          <img 
            src={avatar} 
            alt={name} 
            className={`${avatarSize} rounded-full object-cover`}
          />
        ) : (
          <span className={`${compact ? 'text-[6px]' : 'text-[8px]'} text-white font-bold leading-none`}>
            {getInitials(name)}
          </span>
        )}
      </div>

      {/* Employee Info */}
      <div className="flex-1 min-w-0 flex flex-col gap-0">
        <div className={`${nameSize} font-medium text-gray-700 truncate leading-tight`}>
          {name}
        </div>
        {(position || shift) && (
          <div className={`${textSize} text-gray-500 truncate leading-none`}>
            {position && shift ? `${position} • ${shift}` : position || shift}
          </div>
        )}
      </div>

      {/* Ultra-compact micro ghost remove button */}
      {onRemove && (
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <TinyRemoveButton
            onClick={onRemove}
            size="micro"
            variant="ghost"
            className="transition-all duration-200"
            aria-label={`Remove ${name}`}
          />
        </div>
      )}
    </div>
  );
};

export default MiniEmployeeCard;
