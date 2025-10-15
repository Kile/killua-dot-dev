import type { 
  NewsResponse, 
  NewsResponseData, 
  CreateNewsRequest, 
  EditNewsRequest, 
  LikeRequest, 
  NewsSaveResponse 
} from '../types/news';

const API_BASE_URL = '/api/news';

export const fetchAllNews = async (jwtToken?: string): Promise<NewsResponseData> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Add Authorization header if token is provided
  if (jwtToken) {
    headers['Authorization'] = `Bearer ${jwtToken}`;
  }
  
  const response = await fetch(API_BASE_URL, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch news: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

export const fetchNewsById = async (newsId: string, jwtToken?: string): Promise<NewsResponse> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Add Authorization header if token is provided
  if (jwtToken) {
    headers['Authorization'] = `Bearer ${jwtToken}`;
  }
  
  const response = await fetch(`${API_BASE_URL}/${newsId}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch news item: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

export const likeNews = async (jwtToken: string, newsId: string): Promise<any> => {
  const likeRequest: LikeRequest = { news_id: newsId };
  
  const response = await fetch(`${API_BASE_URL}/like`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(likeRequest),
  });

  if (!response.ok) {
    throw new Error(`Failed to like/unlike news: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

export const saveNews = async (jwtToken: string, createRequest: CreateNewsRequest): Promise<NewsSaveResponse> => {
  
  const requestBody = JSON.stringify(createRequest);
  
  const response = await fetch(`${API_BASE_URL}/save`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
    },
    body: requestBody,
  });


  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Response not OK. Error text:', errorText);
    throw new Error(`Failed to save news: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  return result;
};

export const editNews = async (jwtToken: string, newsId: string, editRequest: EditNewsRequest): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/${newsId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(editRequest),
  });

  if (!response.ok) {
    throw new Error(`Failed to edit news: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

export const deleteNews = async (jwtToken: string, newsId: string): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/${newsId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete news: ${response.status} ${response.statusText}`);
  }

  return response.json();
};
