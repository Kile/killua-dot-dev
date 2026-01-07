export interface TagOwner {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
}

export interface GuildTag {
  name: string;
  created_at: string;
  owner: TagOwner;
  content: string;
  uses: number;
}

export interface GuildInfo {
  member_count: number;
  prefix: string;
  is_premium: boolean;
  bot_added_on: string | null;
  tags: GuildTag[];
}

export interface TagCreatePayload {
  name: string;
  content: string;
}

export interface TagEditPayload {
  name: string;
  content?: string;
  new_name?: string;
  new_owner?: string;
}

export interface TagDeletePayload {
  name: string;
}

export interface TagResponse {
  success: boolean;
  message: string;
}


