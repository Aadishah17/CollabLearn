import { API_URL } from '../config.js';

const DEFAULT_TIMEOUT_MS = 15000;

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'api_error', details = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const getBaseUrl = () => String(API_URL || '').replace(/\/$/, '');

const getStoredToken = () => {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  return localStorage.getItem('token');
};

const resolveUrl = (input) => {
  const value = String(input || '').trim();
  if (!value) {
    throw new ApiError('Request URL is required', { code: 'invalid_request' });
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `${getBaseUrl()}${value.startsWith('/') ? '' : '/'}${value}`;
};

const toErrorMessage = (payload, fallback) => {
  if (!payload) return fallback;
  if (typeof payload === 'string') return payload.trim() || fallback;
  if (typeof payload.message === 'string' && payload.message.trim()) return payload.message.trim();
  if (typeof payload.error === 'string' && payload.error.trim()) return payload.error.trim();
  if (typeof payload.preview === 'string' && payload.preview.trim()) return payload.preview.trim();
  return fallback;
};

const parseResponseBody = async (response) => {
  const text = await response.text();
  if (!text) return null;

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

export const normalizeApiError = (error, fallbackMessage = 'Request failed') => {
  if (error instanceof ApiError) {
    return error;
  }

  if (error?.name === 'AbortError') {
    return new ApiError('Request timed out', { code: 'timeout' });
  }

  if (error instanceof Error) {
    return new ApiError(error.message || fallbackMessage, {
      code: error.code || 'request_failed'
    });
  }

  return new ApiError(fallbackMessage, { code: 'request_failed' });
};

export const buildJsonHeaders = (headers = {}, { auth = false } = {}) => {
  const nextHeaders = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...headers
  };

  if (auth) {
    const token = getStoredToken();
    if (token) {
      nextHeaders.Authorization = `Bearer ${token}`;
    }
  }

  return nextHeaders;
};

export const requestJson = async (input, options = {}) => {
  const {
    method = 'GET',
    body,
    headers = {},
    auth = false,
    credentials = 'include',
    timeoutMs = DEFAULT_TIMEOUT_MS,
    signal
  } = options;

  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);

  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }

  try {
    const response = await fetch(resolveUrl(input), {
      method,
      headers: buildJsonHeaders(headers, { auth }),
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials,
      signal: controller.signal
    });

    const payload = await parseResponseBody(response);

    if (!response.ok) {
      throw new ApiError(
        toErrorMessage(payload, `Request failed with status ${response.status}`),
        {
          status: response.status,
          code: response.status === 429 ? 'rate_limited' : 'http_error',
          details: payload
        }
      );
    }

    if (payload && typeof payload === 'object' && payload.success === false) {
      throw new ApiError(
        toErrorMessage(payload, 'Request failed'),
        {
          status: typeof payload.httpStatus === 'number' ? payload.httpStatus : response.status,
          code: response.status === 429 || payload.httpStatus === 429 ? 'rate_limited' : 'request_failed',
          details: payload
        }
      );
    }

    return payload;
  } catch (error) {
    throw normalizeApiError(error);
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
};
