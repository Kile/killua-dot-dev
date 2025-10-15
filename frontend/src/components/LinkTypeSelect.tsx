import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface LinkTypeSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const LinkTypeSelect: React.FC<LinkTypeSelectProps> = ({
  value,
  onChange,
  placeholder = "Select link type",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const predefinedOptions = [
    { value: 'GitHub', label: 'GitHub' },
    { value: 'Twitter', label: 'Twitter' },
    { value: 'YouTube', label: 'YouTube' },
    { value: 'Download', label: 'Download' }
  ];

  const handleSelect = (selectedValue: string) => {
    if (selectedValue === 'custom') {
      setCustomValue(value);
      setIsOpen(false);
      return;
    }
    onChange(selectedValue);
    setIsOpen(false);
  };

  const handleCustomSubmit = () => {
    if (customValue.trim()) {
      onChange(customValue.trim());
      setCustomValue('');
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCustomSubmit();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setCustomValue('');
    }
  };

  const displayValue = predefinedOptions.find(option => option.value === value)?.label || value;

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-left focus:ring-2 focus:ring-discord-blurple focus:border-discord-blurple flex items-center justify-between"
      >
        <span className={value ? 'text-white' : 'text-gray-400'}>
          {value ? displayValue : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {predefinedOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className="w-full px-3 py-2 text-left text-white hover:bg-gray-700 transition-colors"
            >
              {option.label}
            </button>
          ))}
          
          <div className="border-t border-gray-600">
            <button
              type="button"
              onClick={() => handleSelect('custom')}
              className="w-full px-3 py-2 text-left text-discord-blurple hover:bg-gray-700 transition-colors"
            >
              + Custom...
            </button>
          </div>
        </div>
      )}

      {/* Custom input modal */}
      {customValue !== '' && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg p-3">
          <input
            type="text"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter custom link name"
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-discord-blurple focus:border-discord-blurple"
            autoFocus
          />
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={handleCustomSubmit}
              className="px-3 py-1 bg-discord-blurple text-white rounded text-sm hover:bg-blue-600 transition-colors"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setCustomValue('');
                setIsOpen(false);
              }}
              className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LinkTypeSelect;
