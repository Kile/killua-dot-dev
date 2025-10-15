import type { UserEditPayload } from '../types/userSettings';

export const updateUserSettings = async (jwtToken: string, settings: UserEditPayload): Promise<void> => {
  const response = await fetch('/api/auth/user/edit', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update user settings');
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message || 'Failed to update user settings');
  }
};
