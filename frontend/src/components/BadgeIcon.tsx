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
const customIconMap: Record<string, string> = {
  'rps_master': 'rps_master.webp',
  'developer': 'developer.webp',
  'artist': 'artist.webp',
  'early_supporter': 'early_supporter.webp',
  'pro_hugger': 'pro_hugger.webp',
  'pro_hugged': 'pro_hugged.webp',
  'full_book': 'full_book.webp',
  'partner': 'partner.webp', 
  '6002629': 'tier_1.webp',
  '6002630': 'tier_2.webp',
  '6002631': 'tier_3.webp',
  'premium': 'premium_guild.webp',
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
      'partner': Crown,
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
