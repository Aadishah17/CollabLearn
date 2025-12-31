const jwt = require('jsonwebtoken');

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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');
    
    // 4. ADD USER INFO TO REQUEST OBJECT
    // Now all protected routes can access req.userId and req.userEmail
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    
    // 5. CONTINUE TO NEXT MIDDLEWARE/ROUTE HANDLER
    next();

  } catch (error) {
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