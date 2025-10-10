export interface ActionSettings {
  hug: boolean;
  cuddle: boolean;
  pat: boolean;
  slap: boolean;
  poke: boolean;
  tickle: boolean;
}

export interface EmailNotifications {
  news: boolean;
  updates: boolean;
  posts: boolean;
}

export interface UserEditPayload {
  action_settings?: ActionSettings;
  email_notifications?: EmailNotifications;
  voting_reminder?: boolean;
}

export interface UserEditRequest {
  user_id: string;
  action_settings?: ActionSettings;
  email_notifications?: EmailNotifications;
  voting_reminder?: boolean;
}
