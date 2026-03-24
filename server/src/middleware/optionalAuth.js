const jwt = require('jsonwebtoken');
const { resolveJwtSecret } = require('../config/auth');

const optionalAuth = (req, _res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, resolveJwtSecret());
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    return next();
  } catch (_error) {
    return next();
  }
};

module.exports = optionalAuth;
