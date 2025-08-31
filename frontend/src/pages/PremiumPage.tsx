import React, { useEffect, useState } from 'react';
import { Crown, Star, Zap, Heart, Check, ExternalLink, CheckCircle } from 'lucide-react';
import LinkButton from '../components/LinkButton';
import { useAuth } from '../contexts/AuthContext';
// import { getPremiumTierInfo } from '../utils/premiumTiers';

interface PremiumTier {
  id: string; // Patreon tier id
  name: string;
  price: string;
  description: string;
  features: string[];
  popular?: boolean;
  headerBg: string; // simple solid background class
  fallbackIcon: React.ComponentType<any>;
  iconAsset?: string; // optional custom icon asset under /public/badges
}

const PremiumPage: React.FC = () => {
  const { user } = useAuth();

  // Premium from API (not Discord)
  const [apiIsPremium, setApiIsPremium] = useState<boolean>(false);
  const [apiPremiumTier, setApiPremiumTier] = useState<string | null>(null);

  useEffect(() => {
    const fetchPremium = async () => {
      try {
        const jwtToken = localStorage.getItem('discord_token');
        if (!jwtToken) return;
        const res = await fetch('/api/auth/userinfo', {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setApiIsPremium(Boolean(data.is_premium));
        setApiPremiumTier(data.premium_tier ?? null);
      } catch (_) {
        // ignore
      }
    };
    fetchPremium();
  }, [user]);

  // current tier info not used in UI at the moment

  // Note: mapping: tier_one: 6002629, tier_two: 6002630, tier_three: 6002631
  // We use custom assets tier_1.png, tier_2.png, tier_3.png if present in /public/badges
  const premiumTiers: PremiumTier[] = [
    {
      id: '6002629',
      name: 'Tier One',
      price: '$3/month',
      description: 'Support Killua and get access to most premium features',
      features: [
        'Halved cooldowns',
        'Up to one premium guild',
        'Custom IDs for todo lists',
        'Exclusive role in support server',
        'Doubled daily jenny',
        'Weekly lootbox',
        'Exclusive badge'
      ],
      headerBg: 'bg-amber-600', // bronze
      fallbackIcon: Heart,
      iconAsset: 'tier_1.png'
    },
    {
      id: '6002630',
      name: 'Tier Two',
      price: '$5/month',
      description: 'Enhanced premium experience with additional perks',
      features: [
        'All Tier One features',
        'Up to two premium guilds',
        'Invite the dev bot to use not yet public features',
      ],
      popular: true,
      headerBg: 'bg-gray-400', // silver
      fallbackIcon: Star,
      iconAsset: 'tier_2.png'
    },
    {
      id: '6002631',
      name: 'Tier Three',
      price: '$10/month',
      description: 'The ultimate Killua experience with maximum benefits',
      features: [
        'All Tier Two features',
        'Up to 3 premium guilds',
        'Doubled Jenny whenever you gain Jenny'
      ],
      headerBg: 'bg-yellow-500', // gold
      fallbackIcon: Crown,
      iconAsset: 'tier_3.png'
    }
  ];

  return (
    <div className="min-h-screen bg-discord-darker text-white py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <Crown className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Support <span className="text-discord-blurple">Killua</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Choose a premium tier and unlock exclusive features while supporting the development of your favorite Discord bot.
          </p>
          {/* Removed large current plan box; top-left badge per card is sufficient */}
        </div>

        {/* Premium Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {premiumTiers.map((tier, index) => {
            const Icon = tier.fallbackIcon;
            const isCurrent = apiIsPremium && apiPremiumTier === tier.id;
            return (
              <div
                key={index}
                className={`relative bg-discord-dark border-2 rounded-2xl overflow-hidden transition-all duration-300 hover:transform hover:scale-105 flex flex-col h-full ${
                  tier.popular 
                    ? 'border-discord-blurple shadow-2xl shadow-discord-blurple/20' 
                    : 'border-gray-600'
                }`}
              >
                {/* Popular Badge */}
                {tier.popular && (
                  <div className="absolute top-0 right-0 bg-discord-blurple text-white px-4 py-2 rounded-bl-lg font-semibold text-sm">
                    Most Popular
                  </div>
                )}
                
                {/* Current Plan Badge */}
                {isCurrent && (
                  <div className="absolute top-0 left-0 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-br-lg font-semibold text-sm flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3" />
                    <span>Current Plan</span>
                  </div>
                )}

                {/* Header */}
                <div className={`${tier.headerBg} p-8 text-center`}>
                  <div className="flex justify-center mb-4">
                    <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
                      {tier.iconAsset ? (
                        <img src={`/badges/${tier.iconAsset}`} alt={tier.name} className="w-20 h-20 object-contain" />
                      ) : (
                        <Icon className="h-16 w-16 text-white" />
                      )}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
                  <div className="text-4xl font-bold text-white mb-2">{tier.price}</div>
                  <p className="text-white/90 text-sm">{tier.description}</p>
                </div>

                {/* Features */}
                <div className="p-8 flex-1 flex flex-col">
                  <ul className="space-y-4 mb-8">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-discord-green rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="h-3 w-3 text-black" />
                        </div>
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <LinkButton
                    href="https://www.patreon.com/KileAlkuri"
                    className={`mt-auto w-full ${tier.headerBg} hover:opacity-90 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2`}
                  >
                    <ExternalLink className="h-5 w-5" />
                    Get {tier.name}
                  </LinkButton>
                </div>
              </div>
            );
          })}
        </div>

        {/* Why Support Section */}
        <div className="bg-discord-dark border border-gray-600 rounded-2xl p-12 text-center mb-20">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">
            Why Support Killua?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-discord-blurple/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-discord-blurple" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Continuous Development</h3>
              <p className="text-gray-300">
                Your support helps us constantly improve Killua and keeps 99% of features completely free.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-discord-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-discord-green" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Community Growth</h3>
              <p className="text-gray-300">
                Help us build a stronger community and support server for all Killua users.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-discord-yellow/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-discord-yellow" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Exclusive Perks</h3>
              <p className="text-gray-300">
                Get access to premium benefits and a shiny badge!
              </p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-discord-blurple to-discord-fuchsia rounded-2xl p-12 max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to support Killua?
            </h2>
            <p className="text-white/90 mb-8 text-lg">
              Choose your tier and start enjoying premium features today!
            </p>
            <LinkButton
              href="https://www.patreon.com/KileAlkuri"
              className="bg-white text-discord-blurple font-bold px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center gap-2 mx-auto w-fit"
            >
              <ExternalLink className="h-6 w-6" />
              Visit Patreon
            </LinkButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumPage;
