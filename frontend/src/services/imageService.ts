import { useAuth } from '../contexts/AuthContext';

export interface ImageUploadResponse {
  url: string;
  path: string;
}

export interface FileLinkResponse {
  url: string;
  token: string;
  expiry: number;
}

export const uploadImage = async (jwtToken: string, file: File, path: string): Promise<ImageUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('path', path);

  const response = await fetch('/api/image/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload image: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

export const generateImageLink = async (jwtToken: string, path: string, expiryTimestamp: number): Promise<FileLinkResponse> => {
  const response = await fetch(`/api/image/generate-link?path=${encodeURIComponent(path)}&expiry=${expiryTimestamp}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to generate image link: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

export const listImages = async (jwtToken: string): Promise<string[]> => {
  const response = await fetch('/api/image/list', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to list images: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return JSON.parse(data);
};
