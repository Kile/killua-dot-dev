import React, { useState } from 'react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  alt?: string;
}

const sizeMap: Record<NonNullable<LoadingProps['size']>, { box: string; spinner: string }> = {
  sm: { box: 'w-6 h-6', spinner: 'h-6 w-6' },
  md: { box: 'w-12 h-12', spinner: 'h-12 w-12' },
  lg: { box: 'w-32 h-32', spinner: 'h-32 w-32' },
};

const Loading: React.FC<LoadingProps> = ({ size = 'md', className = '', alt = 'Loading' }) => {
  const [src, setSrc] = useState<string | null>('/brand/loader.svg');
  const sizes = sizeMap[size];

  const handleError = () => {
    if (src === '/brand/loader.svg') setSrc('/brand/loader.png');
    else setSrc(null);
  };

  if (src) {
    return (
      <div className={`${sizes.box} ${className} inline-flex items-center justify-center`}>
        <img
          src={src}
          alt={alt}
          onError={handleError}
          className={`max-w-full max-h-full object-contain animate-spin select-none pointer-events-none`}
        />
      </div>
    );
  }

  // Fallback CSS spinner
  return (
    <div className={`animate-spin rounded-full border-b-2 border-discord-blurple ${sizes.spinner} ${className}`}></div>
  );
};

export default Loading;
