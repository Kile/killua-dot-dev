import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxTags?: number;
}

const TagInput: React.FC<TagInputProps> = ({
  value = [],
  onChange,
  placeholder = "Enter targets...",
  className = "",
  disabled = false,
  maxTags
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !value.includes(trimmedTag)) {
      // If maxTags is set and we're at the limit, replace the first tag
      if (maxTags && value.length >= maxTags) {
        onChange([trimmedTag]);
      } else {
        onChange([...value, trimmedTag]);
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
        setInputValue('');
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    setIsFocused(false);
    if (inputValue.trim()) {
      addTag(inputValue);
      setInputValue('');
    }
  };

  const handleInputFocus = () => {
    setIsFocused(true);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const tags = pastedText.split(',').map(tag => tag.trim()).filter(tag => tag);
    
    const newTags = [...value];
    tags.forEach(tag => {
      if (tag && !newTags.includes(tag)) {
        newTags.push(tag);
      }
    });
    
    onChange(newTags);
  };

  return (
    <div className={`relative ${className}`}>
      <div
        className={`
          min-h-[42px] w-full bg-gray-700 border rounded-lg px-3 py-2 
          flex flex-wrap items-center gap-1 cursor-text
          ${isFocused ? 'ring-2 ring-discord-blurple border-discord-blurple' : 'border-gray-600'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onClick={() => inputRef.current?.focus()}
      >
        {/* Existing Tags */}
        {value.map((tag, index) => (
          <div
            key={index}
            className="inline-flex items-center gap-1 bg-discord-blurple text-white px-2 py-1 rounded text-sm"
          >
            <span>{tag}</span>
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag);
                }}
                className="hover:bg-blue-600 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
        
        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onPaste={handlePaste}
          placeholder={value.length === 0 ? placeholder : ""}
          disabled={disabled}
          className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-white placeholder-gray-400"
        />
      </div>
      
      {/* Helper Text */}
      <div className="mt-1 text-xs text-gray-400">
        Press Enter or comma to add targets. Enter specific user IDs.
        {value.length > 0 && (
          <span className="ml-2 text-blue-400">
            {value.length} target{value.length !== 1 ? 's' : ''} selected
          </span>
        )}
      </div>
    </div>
  );
};

export default TagInput;
