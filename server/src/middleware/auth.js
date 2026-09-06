const jwt = require('jsonwebtoken');
const { extractAuthTokenCandidates, resolveJwtSecret } = require('../config/auth');
const { applyResolvedAuthContext, resolveAuthenticatedAccount } = require('./resolveAuthAccount');

const verifyCandidateToken = (token) => jwt.verify(token, resolveJwtSecret());

// ============= AUTHENTICATION MIDDLEWARE =============
const auth = async (req, res, next) => {
  const candidates = extractAuthTokenCandidates(req);

  if (candidates.length === 0) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
  }

  try {
    let lastError = null;

    for (const candidate of candidates) {
      try {
        const decoded = verifyCandidateToken(candidate.token);
        const resolvedAccount = await resolveAuthenticatedAccount(decoded);

        if (!resolvedAccount) {
          return res.status(401).json({
            success: false,
            message: 'Session is no longer valid. Please login again.',
          });
        }

        if (resolvedAccount.account.isActive === false) {
          return res.status(401).json({
            success: false,
            message:
              resolvedAccount.accountType === 'admin'
                ? 'Admin account is deactivated. Please contact support.'
                : 'Account is deactivated. Please contact support.',
          });
        }

        applyResolvedAuthContext(req, decoded, candidate.source, resolvedAccount);
        return next();
      } catch (error) {
        lastError = error;
      }
    }

    if (lastError && lastError.code === 'JWT_SECRET_MISSING') {
      return res.status(500).json({
        success: false,
        message: 'Server authentication is not configured.',
      });
    }

    if (lastError && lastError.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again.',
      });
    }

    if (lastError && lastError.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.',
      });
    }

    // Fallback for malformed credentials or unexpected verification failures.
    return res.status(401).json({
      success: false,
      message: 'Token verification failed.',
    });
  } catch (error) {
    if (error.code === 'JWT_SECRET_MISSING') {
      return res.status(500).json({
        success: false,
        message: 'Server authentication is not configured.',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again.',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Token verification failed.',
    });
  }
};

module.exports = auth;
