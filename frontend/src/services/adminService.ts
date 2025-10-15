interface AdminCheckResponse {
  isAdmin: boolean;
  user: {
    discordId: string;
    username: string;
    discriminator: string;
    avatar: string;
    email: string;
  };
}

interface AdminUserInfoResponse {
  id: number;
  email: string;
  display_name: string;
  avatar_url: string;
  jenny: number;
  daily_cooldown: string;
  met_user: number[];
  effects: {
    [key: string]: any;
  };
  rs_cards: Array<[number, { fake: boolean; clone: boolean }]>;
  fs_cards: Array<[number, { fake: boolean; clone: boolean }]>;
  badges: string[];
  rps_stats: {
    pvp: {
      won: number;
      lost: number;
      tied: number;
    };
    pve: {
      won: number;
      lost: number;
      tied: number;
    };
  };
  counting_highscore: {
    easy: number;
    hard: number;
  };
  trivia_stats: {
    easy: {
      right: number;
      wrong: number;
    };
    medium: {
      right: number;
      wrong: number;
    };
    hard: {
      right: number;
      wrong: number;
    };
  };
  achievements: string[];
  votes: number;
  voting_streak: {
    topgg: {
      streak: number;
      last_vote: string;
    };
    discordbotlist: {
      streak: number;
      last_vote: string;
    };
  };
  voting_reminder: boolean;
  premium_guilds: Record<string, any>;
  lootboxes: number[];
  boosters: {
    [key: string]: number;
  };
  weekly_cooldown: string;
  action_settings: {
    hug: boolean;
    pat: boolean;
    slap: boolean;
    poke: boolean;
    tickle: boolean;
    cuddle: boolean;
  };
  action_stats: Record<string, any>;
  locale: string;
  has_user_installed: boolean;
  is_premium: boolean;
  premium_tier: string | null;
}

export const checkAdminStatus = async (jwtToken: string): Promise<AdminCheckResponse> => {
  const response = await fetch('/api/auth/admin/check', {
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to check admin status: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

export const fetchAdminUserInfo = async (jwtToken: string, discordId: string): Promise<AdminUserInfoResponse> => {
  const response = await fetch(`/api/auth/admin/user/${discordId}`, {
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch admin user info: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

export const updateAdminUserSettings = async (jwtToken: string, discordId: string, payload: any) => {
  const response = await fetch(`/api/auth/admin/user/${discordId}/edit`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwtToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update user settings');
  }

  return response.json();
};

export const testUpdateEndpoint = async (jwtToken: string) => {
  const response = await fetch('/api/auth/admin/update/test', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to test update endpoint');
  }

  return response.json();
};

export const updateBot = async (jwtToken: string) => {
  const response = await fetch('/api/auth/admin/update/bot', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update bot');
  }

  return response.json();
};

export type { AdminCheckResponse, AdminUserInfoResponse };
