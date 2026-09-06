import { requestJson } from '../services/apiClient.js';

const SESSION_KEYS = [
  'token',
  'sessionActive',
  'authMode',
  'username',
  'userId',
  'userAvatar',
  'email',
  'isPremium',
  'userRole',
  'isSuperAdmin',
];

const getStorage = () => {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  return localStorage;
};

export function persistSession({ token, user, authMode }) {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  if (token) {
    storage.setItem('token', token);
  } else {
    storage.removeItem('token');
  }

  storage.setItem('sessionActive', 'true');
  storage.setItem('authMode', authMode || (token ? 'token' : 'cookie'));

  if (!user) {
    return;
  }

  storage.setItem('username', user.name || 'Learner');
  storage.setItem('userId', user.id || user._id || '');
  storage.setItem('userAvatar', user.avatar || '');
  storage.setItem('email', user.email || '');
  storage.setItem('isPremium', String(Boolean(user.isPremium)));
  storage.setItem('userRole', user.role || 'user');
  storage.setItem('isSuperAdmin', String(Boolean(user.isSuperAdmin)));
}

export function clearSession() {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  SESSION_KEYS.forEach((key) => storage.removeItem(key));
}

export function emitProfileUpdated(detail) {
  if (
    typeof window === 'undefined' ||
    typeof window.dispatchEvent !== 'function' ||
    typeof CustomEvent !== 'function'
  ) {
    return;
  }

  window.dispatchEvent(new CustomEvent('profileUpdated', { detail }));
}

export async function logoutSession() {
  try {
    await requestJson('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // Best effort: local session teardown still needs to happen even if the API is unavailable.
  } finally {
    clearSession();
    emitProfileUpdated({
      name: 'Guest',
      email: '',
      isPremium: false,
      role: 'user',
      isSuperAdmin: false,
    });
  }
}

export function hasStoredSession() {
  const storage = getStorage();
  if (!storage) {
    return false;
  }

  return Boolean(storage.getItem('token') || storage.getItem('sessionActive') === 'true');
}
