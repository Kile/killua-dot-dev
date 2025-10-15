export type AuthorInfo = {
  display_name: string;
  avatar_url: string;
};

export type NotifyType = 'group' | 'specific';

export type NotifyData = string[] | string; // Can be user IDs array or special string

export type NotifyUsers = {
  type: NotifyType;
  data: NotifyData;
} | null;

export type NewsType = 'news' | 'update' | 'post';

export type NewsResponse = {
  _id: string;
  title: string;
  content: string;
  type: NewsType;
  likes: number;
  liked: boolean;
  author: AuthorInfo;
  version?: string;
  message_id?: string;
  published: boolean;
  timestamp: string;
  links: Record<string, string>;
  images: string[];
  notify_users: NotifyUsers;
};

export type NewsResponseData = {
  news: NewsResponse[];
};

export type CreateNewsRequest = {
  title: string;
  content: string;
  type: NewsType;
  version?: string;
  links?: Record<string, string>;
  images?: string[];
  notify_users: NotifyUsers;
  published?: boolean;
};

export type EditNewsRequest = {
  title?: string;
  content?: string;
  type?: NewsType;
  version?: string;
  published?: boolean;
  links?: Record<string, string>;
  images?: string[];
  notify_users?: NotifyUsers;
};

export type NewsIdRequest = {
  news_id: string;
};

export type LikeRequest = {
  news_id: string;
};

export type NewsSaveResponse = {
  news_id: string;
  message_id?: string;
};
