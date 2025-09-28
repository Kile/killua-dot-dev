import React from 'react';

interface StyledSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; color?: string }[];
  className?: string;
  placeholder?: string;
}

const StyledSelect: React.FC<StyledSelectProps> = ({ 
  value, 
  onChange, 
  options, 
  className = '', 
  placeholder 
}) => {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-discord-blurple focus:border-discord-blurple appearance-none cursor-pointer pr-10"
      >
        {placeholder && (
          <option value="" disabled className="bg-gray-700 text-gray-400">
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-gray-700 text-white">
            {option.label}
          </option>
        ))}
      </select>
      
      {/* Custom dropdown indicator */}
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
};

export default StyledSelect;