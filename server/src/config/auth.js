const PLACEHOLDER_SECRETS = new Set([
  'replace_with_secure_secret',
  'your-secret-key-change-this',
  'your_jwt_secret',
  'your_jwt_secret_here',
  'change-me',
  'changeme',
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
  const normalized = String(value || '')
    .trim()
    .toLowerCase();
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
    maxAge:
      Number.isInteger(configuredMaxAge) && configuredMaxAge > 0
        ? configuredMaxAge
        : DEFAULT_AUTH_COOKIE_MAX_AGE_MS,
  };

  if (configuredDomain) {
    options.domain = configuredDomain;
  }

  const clearOptions = {
    httpOnly: true,
    secure,
    sameSite,
    path: options.path,
  };

  if (configuredDomain) {
    clearOptions.domain = configuredDomain;
  }

  return {
    name: resolveAuthCookieName(),
    options,
    clearOptions,
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
      token: cookieToken,
    });
  }

  const authorizationHeader = String(getAuthorizationHeader(req) || '').trim();
  if (authorizationHeader.startsWith('Bearer ')) {
    const bearerToken = authorizationHeader.slice(7).trim();
    if (bearerToken && !candidates.some((candidate) => candidate.token === bearerToken)) {
      candidates.push({
        source: 'bearer',
        token: bearerToken,
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

const jwt = require('jsonwebtoken');

const createSessionToken = ({ userId, email, role, isSuperAdmin, expiresIn = '7d' }) =>
  jwt.sign(
    {
      userId,
      email,
      role: role || (isSuperAdmin ? 'admin' : 'user'),
      isSuperAdmin: Boolean(isSuperAdmin),
    },
    resolveJwtSecret(),
    { expiresIn }
  );

const sendSessionResponse = ({ res, statusCode = 200, message, token, user, extra = {} }) => {
  setAuthCookie(res, token);
  return res.status(statusCode).json({
    success: true,
    message,
    token,
    user,
    ...extra,
  });
};

const buildSessionUserPayload = ({ account, accountType, role, isSuperAdmin }) => {
  const baseUser = {
    id: account?._id || account?.id,
    email: account?.email,
    role: role || (isSuperAdmin ? 'admin' : 'user'),
    isSuperAdmin: Boolean(isSuperAdmin),
  };

  if (accountType === 'admin') {
    return {
      ...baseUser,
      name: isSuperAdmin ? 'Super Admin' : account?.name || 'Admin',
      avatar: null,
      avatarType: 'default',
      isPremium: false,
      createdAt: account?.createdAt,
    };
  }

  return {
    ...baseUser,
    name: account?.name || 'Learner',
    avatar:
      typeof account?.getAvatarUrl === 'function'
        ? account.getAvatarUrl()
        : account?.avatar?.url || null,
    avatarType: account?.avatar?.type || 'default',
    isPremium: Boolean(account?.isPremium),
    createdAt: account?.createdAt,
  };
};

const hasRole = (currentRole, allowedRoles = []) => {
  if (!currentRole) return false;
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return roles.includes(currentRole);
};

const isAdminRole = (role) => role === 'admin';

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5175',
  'http://localhost:5176',
  'http://127.0.0.1:5176',
  'http://localhost:5177',
  'http://127.0.0.1:5177',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

const resolveCorsOrigins = () => {
  const configured = String(process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  return configured.length > 0 ? configured : DEFAULT_ALLOWED_ORIGINS;
};

const isOriginAllowed = (origin, allowedOrigins = resolveCorsOrigins()) => {
  if (!origin) return true;
  return allowedOrigins.includes(origin);
};

module.exports = {
  applyAuthContext,
  assertJwtSecretConfigured,
  buildSessionUserPayload,
  clearAuthCookie,
  createSessionToken,
  extractAuthTokenCandidates,
  hasRole,
  isAdminRole,
  isOriginAllowed,
  parseCookieHeader,
  resolveAuthCookieConfig,
  resolveAuthCookieName,
  resolveCorsOrigins,
  resolveJwtSecret,
  sendSessionResponse,
  setAuthCookie,
};
