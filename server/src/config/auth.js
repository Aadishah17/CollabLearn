const PLACEHOLDER_SECRETS = new Set([
  'replace_with_secure_secret',
  'your-secret-key-change-this',
  'your_jwt_secret',
  'your_jwt_secret_here',
  'change-me',
  'changeme'
]);

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

module.exports = {
  assertJwtSecretConfigured,
  resolveJwtSecret
};
