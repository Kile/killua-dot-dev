import React from 'react';
import type { NewsType } from '../types/news';

interface NewsTypeSelectProps {
  value: NewsType;
  onChange: (value: NewsType) => void;
  className?: string;
}

const NewsTypeSelect: React.FC<NewsTypeSelectProps> = ({ value, onChange, className = '' }) => {
  const getNewsTypeColor = (type: NewsType) => {
    switch (type) {
      case 'news': return 'bg-blue-600 text-blue-100';
      case 'update': return 'bg-green-600 text-green-100';
      case 'post': return 'bg-purple-600 text-purple-100';
      default: return 'bg-gray-600 text-gray-100';
    }
  };

  const newsTypes: NewsType[] = ['news', 'update', 'post'];

  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as NewsType)}
        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-discord-blurple focus:border-discord-blurple appearance-none cursor-pointer"
      >
        {newsTypes.map((type) => (
          <option key={type} value={type} className="bg-gray-700 text-white">
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </option>
        ))}
      </select>
      
      {/* Custom dropdown indicator with color preview */}
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none flex items-center space-x-2">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getNewsTypeColor(value)}`}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
};

export default NewsTypeSelect;
