'use client';

import React from 'react';
import { X, Trash2, Minus } from 'lucide-react';

interface RemoveButtonProps {
  onClick: (e: React.MouseEvent | React.TouchEvent) => void;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'danger' | 'ghost';
  style?: 'circle' | 'square' | 'pill';
  icon?: 'x' | 'trash' | 'minus';
  className?: string;
  disabled?: boolean;
  'aria-label'?: string;
}

const RemoveButton: React.FC<RemoveButtonProps> = ({
  onClick,
  size = 'xs',
  variant = 'minimal',
  style = 'circle',
  icon = 'x',
  className = '',
  disabled = false,
  'aria-label': ariaLabel = 'Remove assignment'
}) => {
  // Size configurations
  const sizeConfig = {
    xs: { 
      button: 'w-5 h-5', 
      icon: 'w-2.5 h-2.5', 
      padding: 'p-0.5',
      text: 'text-xs'
    },
    sm: { 
      button: 'w-6 h-6', 
      icon: 'w-3 h-3', 
      padding: 'p-1',
      text: 'text-sm'
    },
    md: { 
      button: 'w-7 h-7', 
      icon: 'w-3.5 h-3.5', 
      padding: 'p-1.5',
      text: 'text-base'
    },
    lg: { 
      button: 'w-8 h-8', 
      icon: 'w-4 h-4', 
      padding: 'p-2',
      text: 'text-lg'
    }
  };

  // Variant configurations
  const variantConfig = {
    default: {
      base: 'bg-red-100 border-red-200 text-red-700 hover:bg-red-200 hover:border-red-300 hover:text-red-800',
      focus: 'focus:ring-red-400 focus:border-red-400',
      active: 'active:bg-red-300 active:scale-95'
    },
    minimal: {
      base: 'bg-white/80 backdrop-blur-sm border-gray-300 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 shadow-sm',
      focus: 'focus:ring-red-400 focus:border-red-400',
      active: 'active:bg-red-100 active:scale-95'
    },
    danger: {
      base: 'bg-red-500 border-red-600 text-white hover:bg-red-600 hover:border-red-700 shadow-md',
      focus: 'focus:ring-red-400 focus:border-red-500',
      active: 'active:bg-red-700 active:scale-95'
    },
    ghost: {
      base: 'bg-transparent border-transparent text-red-500 hover:bg-red-50 hover:text-red-600',
      focus: 'focus:ring-red-400 focus:bg-red-50',
      active: 'active:bg-red-100 active:scale-95'
    }
  };

  // Style configurations
  const styleConfig = {
    circle: 'rounded-full',
    square: 'rounded-md',
    pill: 'rounded-full'
  };

  // Icon selection
  const IconComponent = {
    x: X,
    trash: Trash2,
    minus: Minus
  }[icon];

  const config = sizeConfig[size];
  const variantStyles = variantConfig[variant];
  const styleClass = styleConfig[style];

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      onClick(e);
    }
  };

  return (
    <button
      onClick={handleClick}
      onTouchStart={handleClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`
        ${config.button} ${config.padding}
        ${variantStyles.base}
        ${variantStyles.focus}
        ${variantStyles.active}
        ${styleClass}
        border
        flex items-center justify-center
        transition-all duration-200 ease-out
        focus:outline-none focus:ring-2 focus:ring-offset-1
        disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
        transform hover:scale-110 active:scale-95
        select-none touch-manipulation
        ${size === 'xs' ? 'hover:shadow-sm' : 'hover:shadow-md'}
        ${className}
      `}
      type="button"
    >
      <IconComponent 
        className={`${config.icon} flex-shrink-0`} 
        strokeWidth={size === 'xs' ? 2.5 : 2}
      />
    </button>
  );
};

export default RemoveButton;
