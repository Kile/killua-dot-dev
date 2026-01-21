import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTitleProps {
  title?: string;
  description?: string;
}

const PageTitle: React.FC<PageTitleProps> = ({ title, description }) => {
  const location = useLocation();

  useEffect(() => {
    const baseTitle = 'Killua Discord Bot';
    const fullTitle = title ? `${title} | ${baseTitle}` : baseTitle;
    document.title = fullTitle;

    // Update Meta Tags
    const updateMetaTag = (property: string, content: string) => {
      let element = document.querySelector(`meta[property="${property}"]`) || 
                    document.querySelector(`meta[name="${property}"]`);
      
      if (element) {
        element.setAttribute('content', content);
      } else {
        element = document.createElement('meta');
        if (property.startsWith('og:')) {
          element.setAttribute('property', property);
        } else {
          element.setAttribute('name', property);
        }
        element.setAttribute('content', content);
        document.head.appendChild(element);
      }
    };

    updateMetaTag('og:title', fullTitle);
    updateMetaTag('twitter:title', fullTitle);

    if (description) {
      updateMetaTag('description', description);
      updateMetaTag('og:description', description);
      updateMetaTag('twitter:description', description);
    }
  }, [title, description, location]);

  return null;
};

export default PageTitle;

