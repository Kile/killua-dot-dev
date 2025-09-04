export interface FileInfo {
  path: string;
  name: string;
  isDirectory: boolean;
  size?: number;
  lastModified?: string;
}

export interface FileViewerToken {
  token: string;
  expiry: number;
  baseUrl: string;
}

export interface FileLink {
  url: string;
  token: string;
  expiry: number;
}

// Common error handling function
const handleApiError = async (response: Response, defaultMessage: string): Promise<never> => {
  if (!response.ok) {
    // Try to get the error message from the response body
    try {
      const errorData = await response.json();
      const errorMessage = errorData.error || defaultMessage;
      throw new Error(errorMessage);
    } catch (parseError) {
      // If we can't parse the response, fall back to status text
      throw new Error(defaultMessage);
    }
  }
  throw new Error(defaultMessage);
};

export const getFileViewerToken = async (jwtToken: string): Promise<FileViewerToken> => {
  const response = await fetch('/api/image/fileviewer-token', {
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
    },
  });

  if (!response.ok) {
    await handleApiError(response, `Failed to get file viewer token: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

export const generateFileLink = async (path: string, expiry: number, token: string): Promise<FileLink> => {
  const formData = new FormData();
  formData.append('path', path);
  formData.append('expiry', expiry.toString());

  const response = await fetch('/api/image/generate-link', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    await handleApiError(response, `Failed to generate file link: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

export const uploadFile = async (file: File, path: string, token: string): Promise<void> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`/api/image/upload?path=${encodeURIComponent(path)}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    await handleApiError(response, `Failed to upload file: ${response.status} ${response.statusText}`);
  }
};

export const editFilePath = async (oldPath: string, newPath: string, token: string): Promise<void> => {
  const response = await fetch(`/api/image/edit?path=${encodeURIComponent(oldPath)}&new_path=${encodeURIComponent(newPath)}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    await handleApiError(response, `Failed to edit file path: ${response.status} ${response.statusText}`);
  }
};

export const deleteFile = async (path: string, token: string): Promise<void> => {
  const response = await fetch(`/api/image/delete?path=${encodeURIComponent(path)}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    await handleApiError(response, `Failed to delete file: ${response.status} ${response.statusText}`);
  }
};

export const listFiles = async (token: string): Promise<string[]> => {
  const response = await fetch('/api/image/list', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    await handleApiError(response, `Failed to list files: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

export const getFileUrl = (path: string): string => {
  return `/api/image/${encodeURIComponent(path)}`;
};

export const isImageFile = (filename: string): boolean => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return imageExtensions.includes(extension);
};

export const isTextFile = (filename: string): boolean => {
  const textExtensions = ['.txt', '.md', '.json', '.xml', '.html', '.css', '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.c', '.cpp', '.h', '.hpp', '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.scala', '.sql', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf', '.log'];
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return textExtensions.includes(extension);
};
