'use client';

import React, { useState } from 'react';
import { X, Minus, Trash2 } from 'lucide-react';

interface TinyRemoveButtonProps {
  onClick: (e: React.MouseEvent | React.TouchEvent) => void;
  size?: 'micro' | 'tiny' | 'small';
  variant?: 'dot' | 'line' | 'ghost' | 'minimal';
  className?: string;
  disabled?: boolean;
  'aria-label'?: string;
}

const TinyRemoveButton: React.FC<TinyRemoveButtonProps> = ({
  onClick,
  size = 'micro',
  variant = 'dot',
  className = '',
  disabled = false,
  'aria-label': ariaLabel = 'Remove'
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Ultra-compact size configurations
  const sizeConfig = {
    micro: { 
      button: 'w-3 h-3', 
      icon: 'w-1.5 h-1.5',
      text: 'text-[8px]'
    },
    tiny: { 
      button: 'w-4 h-4', 
      icon: 'w-2 h-2',
      text: 'text-[10px]'
    },
    small: { 
      button: 'w-5 h-5', 
      icon: 'w-2.5 h-2.5',
      text: 'text-xs'
    }
  };

  // Minimal variant configurations
  const variantConfig = {
    dot: {
      base: 'bg-red-100 text-red-600 border border-red-200',
      hover: 'hover:bg-red-200 hover:scale-110',
      shape: 'rounded-full'
    },
    line: {
      base: 'bg-gray-100 text-red-500 border border-gray-200',
      hover: 'hover:bg-red-50 hover:border-red-300',
      shape: 'rounded-sm'
    },
    ghost: {
      base: 'bg-transparent text-red-400 border-0',
      hover: 'hover:bg-red-50 hover:text-red-600',
      shape: 'rounded'
    },
    minimal: {
      base: 'bg-white/50 text-red-500 border border-red-100',
      hover: 'hover:bg-red-50 hover:shadow-sm',
      shape: 'rounded-full'
    }
  };

  const config = sizeConfig[size];
  const variantStyles = variantConfig[variant];

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      onClick(e);
    }
  };

  const renderIcon = () => {
    switch (variant) {
      case 'line':
        return <Minus className={`${config.icon} stroke-[3]`} />;
      case 'dot':
        return <X className={`${config.icon} stroke-[3]`} />;
      case 'ghost':
        return <span className={`${config.text} font-bold leading-none`}>×</span>;
      default:
        return <X className={`${config.icon} stroke-[2.5]`} />;
    }
  };

  return (
    <button
      onClick={handleClick}
      onTouchStart={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`
        ${config.button}
        ${variantStyles.base}
        ${variantStyles.hover}
        ${variantStyles.shape}
        flex items-center justify-center
        transition-all duration-150 ease-out
        focus:outline-none focus:ring-1 focus:ring-red-400
        disabled:opacity-40 disabled:cursor-not-allowed
        active:scale-95
        select-none touch-manipulation
        ${className}
      `}
      type="button"
    >
      {renderIcon()}
    </button>
  );
};

export default TinyRemoveButton;
