const SESSION_KEYS = [
  'token',
  'username',
  'userId',
  'userAvatar',
  'email',
  'isPremium',
  'userRole',
];

export function persistSession({ token, user }) {
  if (token) {
    localStorage.setItem('token', token);
  }

  if (!user) {
    return;
  }

  localStorage.setItem('username', user.name || 'Learner');
  localStorage.setItem('userId', user.id || user._id || '');
  localStorage.setItem('userAvatar', user.avatar || '');
  localStorage.setItem('email', user.email || '');
  localStorage.setItem('isPremium', String(Boolean(user.isPremium)));
  localStorage.setItem('userRole', user.role || 'user');
}

export function clearSession() {
  SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
}

export function emitProfileUpdated(detail) {
  window.dispatchEvent(new CustomEvent('profileUpdated', { detail }));
}

export function hasStoredSession() {
  return Boolean(localStorage.getItem('token'));
}
