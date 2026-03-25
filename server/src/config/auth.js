const PLACEHOLDER_SECRETS = new Set([
  'replace_with_secure_secret',
  'your-secret-key-change-this',
  'your_jwt_secret',
  'your_jwt_secret_here',
  'change-me',
  'changeme'
]);

const DEFAULT_AUTH_COOKIE_NAME = 'collablearn_access_token';
const DEFAULT_AUTH_COOKIE_PATH = '/';
const DEFAULT_AUTH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalized)) {
    return true;
  }

  if (['false', '0', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return defaultValue;
};

const parseSameSite = (value, defaultValue = 'lax') => {
  const normalized = String(value || '').trim().toLowerCase();
  if (['strict', 'lax', 'none'].includes(normalized)) {
    return normalized;
  }

  return defaultValue;
};

const parseCookieHeader = (cookieHeader = '') => {
  return String(cookieHeader)
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((cookies, part) => {
      const separatorIndex = part.indexOf('=');
      if (separatorIndex === -1) {
        return cookies;
      }

      const rawName = part.slice(0, separatorIndex).trim();
      const rawValue = part.slice(separatorIndex + 1).trim();

      if (!rawName) {
        return cookies;
      }

      try {
        cookies[rawName] = decodeURIComponent(rawValue);
      } catch (_error) {
        cookies[rawName] = rawValue;
      }

      return cookies;
    }, {});
};

const createMissingJwtSecretError = () => {
  const error = new Error('JWT_SECRET is not configured. Set a strong secret in server/.env.');
  error.code = 'JWT_SECRET_MISSING';
  return error;
};

const resolveJwtSecret = () => {
  const secret = String(process.env.JWT_SECRET || '').trim();
  if (!secret || PLACEHOLDER_SECRETS.has(secret.toLowerCase())) {
    throw createMissingJwtSecretError();
  }

  return secret;
};

const assertJwtSecretConfigured = () => {
  resolveJwtSecret();
};

const resolveAuthCookieName = () => {
  const configuredName = String(process.env.AUTH_COOKIE_NAME || '').trim();
  return configuredName || DEFAULT_AUTH_COOKIE_NAME;
};

const resolveAuthCookieConfig = () => {
  const sameSite = parseSameSite(process.env.AUTH_COOKIE_SAMESITE, 'lax');
  const secure = parseBoolean(
    process.env.AUTH_COOKIE_SECURE,
    String(process.env.NODE_ENV || '').trim() === 'production' || sameSite === 'none'
  );
  const configuredPath = String(process.env.AUTH_COOKIE_PATH || '').trim();
  const configuredDomain = String(process.env.AUTH_COOKIE_DOMAIN || '').trim();
  const configuredMaxAge = Number.parseInt(process.env.AUTH_COOKIE_MAX_AGE_MS || '', 10);

  const options = {
    httpOnly: true,
    secure,
    sameSite,
    path: configuredPath || DEFAULT_AUTH_COOKIE_PATH,
    maxAge: Number.isInteger(configuredMaxAge) && configuredMaxAge > 0
      ? configuredMaxAge
      : DEFAULT_AUTH_COOKIE_MAX_AGE_MS
  };

  if (configuredDomain) {
    options.domain = configuredDomain;
  }

  const clearOptions = {
    httpOnly: true,
    secure,
    sameSite,
    path: options.path
  };

  if (configuredDomain) {
    clearOptions.domain = configuredDomain;
  }

  return {
    name: resolveAuthCookieName(),
    options,
    clearOptions
  };
};

const getAuthorizationHeader = (req) => {
  if (typeof req?.header === 'function') {
    const header = req.header('Authorization') || req.header('authorization');
    if (header) {
      return header;
    }
  }

  return req?.headers?.authorization || req?.headers?.Authorization || '';
};

const extractAuthTokenCandidates = (req) => {
  const { name } = resolveAuthCookieConfig();
  const candidates = [];
  const cookies = parseCookieHeader(req?.headers?.cookie || req?.headers?.Cookie || '');

  const cookieToken = String(req?.cookies?.[name] || cookies[name] || '').trim();
  if (cookieToken) {
    candidates.push({
      source: 'cookie',
      token: cookieToken
    });
  }

  const authorizationHeader = String(getAuthorizationHeader(req) || '').trim();
  if (authorizationHeader.startsWith('Bearer ')) {
    const bearerToken = authorizationHeader.slice(7).trim();
    if (bearerToken && !candidates.some((candidate) => candidate.token === bearerToken)) {
      candidates.push({
        source: 'bearer',
        token: bearerToken
      });
    }
  }

  return candidates;
};

const applyAuthContext = (req, decoded, source = 'bearer') => {
  req.userId = decoded.userId;
  req.userEmail = decoded.email;
  req.userRole = decoded.role || (decoded.isSuperAdmin ? 'admin' : 'user');
  req.isSuperAdmin = Boolean(decoded.isSuperAdmin);
  req.auth = decoded;
  req.authSource = source;
  return req;
};

const setAuthCookie = (res, token) => {
  const { name, options } = resolveAuthCookieConfig();
  res.cookie(name, token, options);
  return res;
};

const clearAuthCookie = (res) => {
  const { name, clearOptions } = resolveAuthCookieConfig();
  res.clearCookie(name, clearOptions);
  return res;
};

module.exports = {
  assertJwtSecretConfigured,
  applyAuthContext,
  clearAuthCookie,
  extractAuthTokenCandidates,
  parseCookieHeader,
  resolveAuthCookieConfig,
  resolveAuthCookieName,
  resolveJwtSecret,
  setAuthCookie
};
