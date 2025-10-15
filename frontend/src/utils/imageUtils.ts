import type { NewsType } from '../types/news';

/**
 * Get the default placeholder image URL for a given news type
 * Used on the create/edit news page as a placeholder
 */
export const getDefaultPlaceholderUrl = (newsType: NewsType): string => {
  const baseUrl = import.meta.env.VITE_EXTERNAL_API_BASE_URL || 'https://api.killua.dev';
  return `${baseUrl}/image/news/${newsType}.png`;
};

/**
 * Get the alt text for a default placeholder image
 */
export const getDefaultPlaceholderAlt = (newsType: NewsType): string => {
  return `Default ${newsType} image placeholder`;
};

/**
 * Check if an image URL is a default placeholder image
 */
export const isDefaultImage = (imageUrl: string): boolean => {
  return imageUrl.includes('/image/news/');
};

/**
 * Get thumbnail container classes based on image type
 */
export const getThumbnailClasses = (imageUrl: string): string => {
  return isDefaultImage(imageUrl) ? 'w-48 h-20' : 'w-24 h-24';
};
