const { isAdminRole } = require('../config/auth');

const requireAdmin = (req, res, next) => {
  if (!isAdminRole(req.userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required.',
    });
  }

  next();
};

module.exports = requireAdmin;
