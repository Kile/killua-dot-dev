import React from 'react';
import { 
  Code, 
  Crown, 
  Star, 
  Heart, 
  Trophy, 
  Zap, 
  Shield, 
  Award,
  Flame,
  Sparkles,
  Target,
  Users,
  Clock,
  Gift,
  Gem
} from 'lucide-react';

interface BadgeIconProps {
  badgeName: string;
  className?: string;
}

// Map badge keys to custom image filenames placed under /public/badges
// Example: place rps_master.png in frontend/public/badges, then map 'rps_master': 'rps_master.png'
const customIconMap: Record<string, string> = {
  'rps_master': 'rps_master.png',
  'developer': 'developer.png',
  'artist': 'artist.png',
  'early_supporter': 'early_supporter.png',
  'pro_hugger': 'pro_hugger.png',
  'pro_hugged': 'pro_hugged.png',
  'full_book': 'full_book.png',
  '6002629': 'tier_1.png',
  '6002630': 'tier_2.png',
  '6002631': 'tier_3.png',
};

const BadgeIcon: React.FC<BadgeIconProps> = ({ badgeName, className = "w-6 h-6" }) => {
  const getBadgeIcon = (name: string) => {
    const iconMap: { [key: string]: React.ComponentType<any> } = {
      'developer': Code,
      'rps_master': Trophy,
      'premium': Star,
      'voter': Heart,
      'winner': Trophy,
      'speed': Zap,
      'defender': Shield,
      'achiever': Award,
      'hot': Flame,
      'magic': Sparkles,
      'accurate': Target,
      'social': Users,
      'time': Clock,
      'gift': Gift,
      'rare': Gem,
      // Premium tiers
      '6002630': Crown, // Tier One
      '6002629': Star,  // Tier Two
      '6002631': Gem,   // Tier Three
    };

    return iconMap[name] || Award; // Default to Award icon if badge not found
  };

  const customAsset = customIconMap[badgeName];

  return (
    <div className="flex items-center space-x-2 p-2 bg-discord-dark rounded-lg border border-gray-600 whitespace-nowrap">
      {customAsset ? (
        <img
          src={`/badges/${customAsset}`}
          alt={badgeName}
          className={`${className} object-contain`}
          loading="lazy"
        />
      ) : (
        (() => {
          const IconComponent = getBadgeIcon(badgeName);
          return <IconComponent className={`${className} text-discord-blurple`} />;
        })()
      )}
      <span className="text-white font-medium">
        {badgeName === '6002629'
          ? 'Tier One'
          : badgeName === '6002630'
            ? 'Tier Two'
            : badgeName === '6002631'
              ? 'Tier Three'
              : badgeName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </span>
    </div>
  );
};

export default BadgeIcon;
