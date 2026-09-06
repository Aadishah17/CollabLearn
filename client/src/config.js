const runtimeEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};

const normalizeRuntimeUrl = (value) => {
  const trimmed = String(value || '')
    .trim()
    .replace(/\/+$/, '');
  if (!trimmed) {
    return '';
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }

  return `https://${trimmed}`;
};

const configuredApiUrl = normalizeRuntimeUrl(runtimeEnv.VITE_API_URL);
const configuredGoogleClientId = String(runtimeEnv.VITE_GOOGLE_CLIENT_ID || '').trim();

// Default to same-origin API requests so Vite dev proxy and reverse-proxy deployments
// can use httpOnly cookie sessions without extra host configuration.
export const API_URL = configuredApiUrl;
export const GOOGLE_CLIENT_ID = configuredGoogleClientId;
export const GOOGLE_AUTH_ENABLED = Boolean(configuredGoogleClientId);
