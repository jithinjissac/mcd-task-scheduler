'use client';

import React, { useState } from 'react';
import { X, Trash2, Minus, RotateCcw } from 'lucide-react';

interface ModernRemoveButtonProps {
  onClick: (e: React.MouseEvent | React.TouchEvent) => void;
  employeeName?: string;
  position?: string;
  size?: 'xs' | 'sm' | 'md';
  variant?: 'floating' | 'inline' | 'corner' | 'hover';
  style?: 'modern' | 'minimal' | 'glass' | 'solid';
  showTooltip?: boolean;
  className?: string;
  disabled?: boolean;
}

const ModernRemoveButton: React.FC<ModernRemoveButtonProps> = ({
  onClick,
  employeeName = '',
  position = '',
  size = 'xs',
  variant = 'floating',
  style = 'modern',
  showTooltip = true,
  className = '',
  disabled = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Size configurations
  const sizeConfig = {
    xs: { 
      button: 'w-5 h-5', 
      icon: 'w-2.5 h-2.5',
      tooltip: 'text-xs',
      confirmButton: 'w-16 h-5 text-xs'
    },
    sm: { 
      button: 'w-6 h-6', 
      icon: 'w-3 h-3',
      tooltip: 'text-sm',
      confirmButton: 'w-20 h-6 text-sm'
    },
    md: { 
      button: 'w-7 h-7', 
      icon: 'w-3.5 h-3.5',
      tooltip: 'text-base',
      confirmButton: 'w-24 h-7 text-base'
    }
  };

  // Variant configurations
  const variantConfig = {
    floating: 'absolute -top-1 -right-1 z-20',
    inline: 'relative ml-1',
    corner: 'absolute top-0 right-0 z-20',
    hover: 'absolute top-1 right-1 z-20 opacity-0 group-hover:opacity-100'
  };

  // Style configurations
  const styleConfig = {
    modern: {
      base: 'bg-white/90 backdrop-blur-sm border border-red-200 text-red-600 shadow-lg',
      hover: 'hover:bg-red-50 hover:border-red-300 hover:shadow-xl hover:scale-110',
      active: 'active:scale-95 active:bg-red-100'
    },
    minimal: {
      base: 'bg-red-50/80 border border-red-200/50 text-red-500',
      hover: 'hover:bg-red-100 hover:border-red-300 hover:text-red-600 hover:scale-105',
      active: 'active:scale-95'
    },
    glass: {
      base: 'bg-white/20 backdrop-blur-md border border-white/30 text-red-600 shadow-md',
      hover: 'hover:bg-red-100/30 hover:border-red-200/50 hover:shadow-lg hover:scale-110',
      active: 'active:scale-95'
    },
    solid: {
      base: 'bg-red-500 border border-red-600 text-white shadow-md',
      hover: 'hover:bg-red-600 hover:shadow-lg hover:scale-110',
      active: 'active:scale-95 active:bg-red-700'
    }
  };

  const config = sizeConfig[size];
  const variantClass = variantConfig[variant];
  const styleClasses = styleConfig[style];

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    // For critical actions, show confirmation
    if (employeeName && !showConfirm) {
      setShowConfirm(true);
      setTimeout(() => setShowConfirm(false), 3000); // Auto-hide after 3s
      return;
    }
    
    onClick(e);
    setShowConfirm(false);
  };

  const handleCancel = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirm(false);
  };

  if (showConfirm) {
    return (
      <div className={`${variantClass} flex items-center gap-1 ${className}`}>
        <button
          onClick={handleClick}
          className={`
            ${config.confirmButton}
            bg-red-500 text-white text-xs font-medium
            rounded-md border border-red-600
            hover:bg-red-600 active:bg-red-700
            transition-all duration-200 ease-out
            flex items-center justify-center gap-1
            shadow-lg hover:shadow-xl
          `}
        >
          <Trash2 className="w-2.5 h-2.5" />
          Remove
        </button>
        <button
          onClick={handleCancel}
          className={`
            ${config.button}
            bg-gray-100 text-gray-600 border border-gray-300
            rounded-full hover:bg-gray-200
            transition-all duration-200 ease-out
            flex items-center justify-center
          `}
        >
          <RotateCcw className={config.icon} />
        </button>
      </div>
    );
  }

  return (
    <div 
      className={`${variantClass} group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={handleClick}
        disabled={disabled}
        aria-label={`Remove ${employeeName} from ${position}`}
        className={`
          ${config.button}
          ${styleClasses.base}
          ${styleClasses.hover}
          ${styleClasses.active}
          rounded-full
          flex items-center justify-center
          transition-all duration-300 ease-out
          focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1
          disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
          transform
          select-none touch-manipulation
        `}
        type="button"
      >
        <X 
          className={`${config.icon} transition-transform duration-200`} 
          strokeWidth={2.5}
        />
      </button>
      
      {/* Tooltip */}
      {showTooltip && isHovered && employeeName && (
        <div className={`
          absolute -top-8 left-1/2 transform -translate-x-1/2
          ${config.tooltip}
          bg-gray-900 text-white px-2 py-1 rounded
          whitespace-nowrap pointer-events-none
          transition-opacity duration-200
          ${isHovered ? 'opacity-100' : 'opacity-0'}
          z-30
        `}>
          Remove {employeeName}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

export default ModernRemoveButton;
