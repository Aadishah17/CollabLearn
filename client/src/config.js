const configuredApiUrl = String(import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
const configuredGoogleClientId = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();

export const API_URL = configuredApiUrl || 'http://localhost:5001';
export const GOOGLE_CLIENT_ID = configuredGoogleClientId;
export const GOOGLE_AUTH_ENABLED = Boolean(configuredGoogleClientId);
