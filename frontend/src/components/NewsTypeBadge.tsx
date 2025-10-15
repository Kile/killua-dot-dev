import React from 'react';

interface NewsTypeBadgeProps {
  type: string;
  size?: 'sm' | 'md';
}

const NewsTypeBadge: React.FC<NewsTypeBadgeProps> = ({ type, size = 'sm' }) => {
  const getNewsTypeColor = (type: string) => {
    switch (type) {
      case 'news': return 'bg-blue-600 text-blue-100';
      case 'update': return 'bg-green-600 text-green-100';
      case 'post': return 'bg-purple-600 text-purple-100';
      default: return 'bg-gray-600 text-gray-100';
    }
  };

  const sizeClasses = size === 'sm' 
    ? 'px-2 py-1 text-xs' 
    : 'px-3 py-1 text-sm';

  return (
    <span className={`${sizeClasses} rounded-full font-medium ${getNewsTypeColor(type)}`}>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </span>
  );
};

export default NewsTypeBadge;
