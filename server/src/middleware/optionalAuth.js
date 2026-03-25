const jwt = require('jsonwebtoken');
const {
  applyAuthContext,
  extractAuthTokenCandidates,
  resolveJwtSecret
} = require('../config/auth');

const optionalAuth = (req, _res, next) => {
  const candidates = extractAuthTokenCandidates(req);

  if (candidates.length === 0) {
    return next();
  }

  try {
    for (const candidate of candidates) {
      try {
        const decoded = jwt.verify(candidate.token, resolveJwtSecret());
        applyAuthContext(req, decoded, candidate.source);
        return next();
      } catch (_error) {
        // Continue to the next candidate, preserving optional auth behavior.
      }
    }
  } catch (_error) {
    // Ignore optional auth failures.
  }

  return next();
};

module.exports = optionalAuth;
