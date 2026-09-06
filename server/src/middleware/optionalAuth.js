const jwt = require('jsonwebtoken');
const { extractAuthTokenCandidates, resolveJwtSecret } = require('../config/auth');
const { applyResolvedAuthContext, resolveAuthenticatedAccount } = require('./resolveAuthAccount');

const optionalAuth = async (req, _res, next) => {
  const candidates = extractAuthTokenCandidates(req);

  if (candidates.length === 0) {
    return next();
  }

  try {
    for (const candidate of candidates) {
      try {
        const decoded = jwt.verify(candidate.token, resolveJwtSecret());
        const resolvedAccount = await resolveAuthenticatedAccount(decoded);
        if (!resolvedAccount || resolvedAccount.account.isActive === false) {
          continue;
        }

        applyResolvedAuthContext(req, decoded, candidate.source, resolvedAccount);
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
