const jwt = require('jsonwebtoken');
const { resolveJwtSecret } = require('../config/auth');

// ============= AUTHENTICATION MIDDLEWARE =============
const auth = (req, res, next) => {
  try {
    // 1. GET TOKEN FROM HEADER
    // Expected format: "Authorization: Bearer your-jwt-token-here"
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : null;
    
    // 2. CHECK IF TOKEN EXISTS
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Access denied. No token provided.' 
      });
    }

    // 3. VERIFY TOKEN
    const decoded = jwt.verify(token, resolveJwtSecret());
    
    // 4. ADD USER INFO TO REQUEST OBJECT
    // Now all protected routes can access req.userId and req.userEmail
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    req.userRole = decoded.role || (decoded.isSuperAdmin ? 'admin' : 'user');
    req.isSuperAdmin = Boolean(decoded.isSuperAdmin);
    req.auth = decoded;
    
    // 5. CONTINUE TO NEXT MIDDLEWARE/ROUTE HANDLER
    next();

  } catch (error) {
    if (error.code === 'JWT_SECRET_MISSING') {
      return res.status(500).json({
        success: false,
        message: 'Server authentication is not configured.'
      });
    }

    // Handle different JWT errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token has expired. Please login again.' 
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token. Please login again.' 
      });
    } else {
      return res.status(401).json({ 
        success: false,
        message: 'Token verification failed.' 
      });
    }
  }
};

module.exports = auth;
