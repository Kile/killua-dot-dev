import React from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'purple' | 'red';
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ 
  checked, 
  onChange, 
  label, 
  disabled = false,
  size = 'md',
  color = 'blue'
}) => {
  const sizeClasses = {
    sm: 'w-8 h-4',
    md: 'w-11 h-6',
    lg: 'w-14 h-7'
  };

  const thumbSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const thumbTranslateClasses = {
    sm: checked ? 'translate-x-3' : '-translate-x-2',
    md: checked ? 'translate-x-2' : '-translate-x-2',
    lg: checked ? 'translate-x-3' : '-translate-x-2'
  };

  const colorClasses = {
    blue: checked ? 'bg-discord-blurple' : 'bg-gray-600',
    green: checked ? 'bg-green-500' : 'bg-gray-600',
    purple: checked ? 'bg-purple-500' : 'bg-gray-600',
    red: checked ? 'bg-red-500' : 'bg-gray-600'
  };

  const thumbColorClasses = {
    blue: checked ? 'bg-white' : 'bg-gray-300',
    green: checked ? 'bg-white' : 'bg-gray-300',
    purple: checked ? 'bg-white' : 'bg-gray-300',
    red: checked ? 'bg-white' : 'bg-gray-300'
  };

  return (
    <div className="flex items-center space-x-3">
      <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`
          relative inline-flex items-center justify-center
          ${sizeClasses[size]}
          ${colorClasses[color]}
          rounded-full transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-discord-blurple
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${checked ? 'shadow-lg' : 'shadow-sm'}
        `}
        role="switch"
        aria-checked={checked}
        aria-label={label}
      >
        <span
          className={`
            ${thumbSizeClasses[size]}
            ${thumbColorClasses[color]}
            rounded-full shadow-lg transform transition-transform duration-200 ease-in-out
            ${thumbTranslateClasses[size]}
          `}
        />
      </button>
      
      {label && (
        <span className={`text-sm text-gray-300 ${disabled ? 'opacity-50' : ''}`}>
          {label}
        </span>
      )}
    </div>
  );
};

export default ToggleSwitch;
