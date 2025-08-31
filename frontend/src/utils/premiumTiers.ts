export const PREMIUM_TIERS = {
  "6002629": {
    name: "Tier One",
    icon: "🥉",
    color: "text-yellow-400"
  },
  "6002630": {
    name: "Tier Two", 
    icon: "🥈",
    color: "text-gray-300"
  },
  "6002631": {
    name: "Tier Three",
    icon: "🥇", 
    color: "text-yellow-500"
  }
};

export const getPremiumTierInfo = (tierId: string | null) => {
  if (!tierId) return null;
  return PREMIUM_TIERS[tierId as keyof typeof PREMIUM_TIERS] || null;
};
