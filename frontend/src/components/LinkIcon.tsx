import React from 'react';
import { ExternalLink, Github, Twitter, Youtube, Download } from 'lucide-react';

interface LinkIconProps {
  linkName: string;
  className?: string;
}

const LinkIcon: React.FC<LinkIconProps> = ({ linkName, className = "w-4 h-4" }) => {
  const normalizedName = linkName.toLowerCase().trim();
  
  // Map common link names to appropriate icons
  const getIcon = () => {
    if (normalizedName.includes('github') || normalizedName.includes('git')) {
      return <Github className={className} />;
    }
    if (normalizedName.includes('twitter') || normalizedName.includes('x.com')) {
      return <Twitter className={className} />;
    }
    if (normalizedName.includes('youtube') || normalizedName.includes('video')) {
      return <Youtube className={className} />;
    }
    if (normalizedName.includes('download') || normalizedName.includes('file')) {
      return <Download className={className} />;
    }
    
    // Default fallback to external link icon
    return <ExternalLink className={className} />;
  };

  return getIcon();
};

export default LinkIcon;
