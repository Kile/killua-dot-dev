import React from 'react';

interface StyledSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
}

const StyledSelect: React.FC<StyledSelectProps> = ({ children, className = '', ...props }) => {
  return (
    <div className="relative inline-block">
      <select
        {...props}
        className={`appearance-none bg-discord-dark border border-gray-600 rounded px-3 py-2 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-discord-blurple ${className}`}
      >
        {children}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.085l3.71-3.856a.75.75 0 111.08 1.04l-4.24 4.41a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );
};

export default StyledSelect;
