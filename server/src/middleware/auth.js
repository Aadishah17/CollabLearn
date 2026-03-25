const jwt = require('jsonwebtoken');
const {
  applyAuthContext,
  extractAuthTokenCandidates,
  resolveJwtSecret
} = require('../config/auth');

const verifyCandidateToken = (token) => jwt.verify(token, resolveJwtSecret());

// ============= AUTHENTICATION MIDDLEWARE =============
const auth = (req, res, next) => {
  const candidates = extractAuthTokenCandidates(req);

  if (candidates.length === 0) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.'
    });
  }

  try {
    let lastError = null;

    for (const candidate of candidates) {
      try {
        const decoded = verifyCandidateToken(candidate.token);
        applyAuthContext(req, decoded, candidate.source);
        return next();
      } catch (error) {
        lastError = error;
      }
    }

    if (lastError && lastError.code === 'JWT_SECRET_MISSING') {
      return res.status(500).json({
        success: false,
        message: 'Server authentication is not configured.'
      });
    }

    if (lastError && lastError.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again.'
      });
    }

    if (lastError && lastError.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.'
      });
    }

    // Fallback for malformed credentials or unexpected verification failures.
    return res.status(401).json({
      success: false,
      message: 'Token verification failed.'
    });
  } catch (error) {
    if (error.code === 'JWT_SECRET_MISSING') {
      return res.status(500).json({
        success: false,
        message: 'Server authentication is not configured.'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again.'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Token verification failed.'
    });
  }
};

module.exports = auth;
