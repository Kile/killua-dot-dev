import React, { useState, useEffect } from 'react';

interface SmartImageLayoutProps {
  images: string[];
  className?: string;
}

interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

const SmartImageLayout: React.FC<SmartImageLayoutProps> = ({ images, className = '' }) => {
  const [loading, setLoading] = useState(true);
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions[]>([]);

  useEffect(() => {
    const loadImageDimensions = async () => {
      const dimensions: ImageDimensions[] = [];
      
      for (const imageUrl of images) {
        try {
          const img = new Image();
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = imageUrl;
          });
          
          dimensions.push({
            width: img.naturalWidth,
            height: img.naturalHeight,
            aspectRatio: img.naturalWidth / img.naturalHeight
          });
        } catch {
          // Fallback to square aspect ratio if image fails to load
          dimensions.push({
            width: 1,
            height: 1,
            aspectRatio: 1
          });
        }
      }
      
      setImageDimensions(dimensions);
      setLoading(false);
    };

    if (images.length > 0) {
      loadImageDimensions();
    } else {
      setLoading(false);
    }
  }, [images]);

  const getLayoutClass = () => {
    if (loading || images.length === 0) return '';
    
    const count = images.length;
    
    if (count === 1) {
      return 'single-image';
    } else if (count === 2) {
      return 'two-images';
    } else if (count === 3) {
      // Check for significantly different aspect ratios
      const aspectRatios = imageDimensions.map(dim => dim.aspectRatio);
      
      // Find the most extreme aspect ratio
      const maxRatio = Math.max(...aspectRatios);
      const minRatio = Math.min(...aspectRatios);
      
      // Check if one image is significantly taller (portrait) or wider (landscape)
      const hasTallImage = minRatio < 0.7; // Significantly taller
      const hasWideImage = maxRatio > 1.8; // Significantly wider
      
      if (hasTallImage) {
        return 'three-tall-left';
      } else if (hasWideImage) {
        return 'three-wide-bottom';
      } else {
        return 'three-grid';
      }
    } else if (count === 4) {
      return 'four-grid';
    } else {
      // 5+ images - use simple grid
      return 'many-images';
    }
  };

  const getImageClass = () => {
    return 'w-full h-auto object-contain rounded-lg border border-gray-600 hover:border-gray-500 transition-colors';
  };

  const getContainerClass = () => {
    const layout = getLayoutClass();
    
    if (layout === 'single-image') {
      return 'w-full';
    } else if (layout === 'two-images') {
      return 'grid grid-cols-1 md:grid-cols-2 gap-4';
    } else if (layout === 'three-grid') {
      return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
    } else if (layout === 'three-tall-left') {
      return 'grid grid-cols-2 gap-2 sm:gap-4';
    } else if (layout === 'three-wide-bottom') {
      return 'space-y-2 sm:space-y-4';
    } else if (layout === 'four-grid') {
      return 'grid grid-cols-2 gap-4';
    } else {
      // 5+ images - use responsive grid
      return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          {images.map((_, index) => (
            <div key={index} className="bg-gray-700 rounded-lg h-48"></div>
          ))}
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return null;
  }

  const imageClass = getImageClass();
  const layout = getLayoutClass();
  
  const renderThreeImageLayout = () => {
    if (layout === 'three-tall-left') {
      // Find the tallest image (smallest aspect ratio)
      const tallImageIndex = imageDimensions.findIndex(dim => dim.aspectRatio === Math.min(...imageDimensions.map(d => d.aspectRatio)));
      const otherImages = images.filter((_, index) => index !== tallImageIndex);
      
      return (
        <>
          {/* Tall image - first on mobile, left on desktop */}
          <div className="relative group">
            <img
              src={images[tallImageIndex]}
              alt={`News image ${tallImageIndex + 1}`}
              className={imageClass}
            />
          </div>
          {/* Two other images - stacked on mobile, right column on desktop */}
          <div className="space-y-2 sm:space-y-4">
            {otherImages.map((imageUrl, index) => (
              <div key={index} className="relative group">
                <img
                  src={imageUrl}
                  alt={`News image ${index + 1}`}
                  className={imageClass}
                />
              </div>
            ))}
          </div>
        </>
      );
    } else if (layout === 'three-wide-bottom') {
      // Find the widest image (largest aspect ratio)
      const wideImageIndex = imageDimensions.findIndex(dim => dim.aspectRatio === Math.max(...imageDimensions.map(d => d.aspectRatio)));
      const otherImages = images.filter((_, index) => index !== wideImageIndex);
      
      return (
        <>
          {/* Two other images on top in a row */}
          <div className="grid grid-cols-2 gap-4">
            {otherImages.map((imageUrl, index) => (
              <div key={index} className="relative group">
                <img
                  src={imageUrl}
                  alt={`News image ${index + 1}`}
                  className={imageClass}
                />
              </div>
            ))}
          </div>
          {/* Wide image on the bottom */}
          <div className="relative group">
            <img
              src={images[wideImageIndex]}
              alt={`News image ${wideImageIndex + 1}`}
              className={imageClass}
            />
          </div>
        </>
      );
    }
    
    // Fallback to regular grid
    return images.map((imageUrl, index) => (
      <div key={index} className="relative group">
        <img
          src={imageUrl}
          alt={`News image ${index + 1}`}
          className={imageClass}
        />
      </div>
    ));
  };
  
  return (
    <div className={`${getContainerClass()} ${className}`}>
      {layout === 'three-tall-left' || layout === 'three-wide-bottom' 
        ? renderThreeImageLayout()
        : images.map((imageUrl, index) => (
            <div key={index} className="relative group">
              <img
                src={imageUrl}
                alt={`News image ${index + 1}`}
                className={imageClass}
              />
            </div>
          ))
      }
    </div>
  );
};

export default SmartImageLayout;
