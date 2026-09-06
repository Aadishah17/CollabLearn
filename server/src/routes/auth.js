const express = require('express');
const path = require('path');
const multer = require('multer');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const { avatarUploadsPath, ensureUploadDirectories } = require('../config/storage');
const { validateBody, validateParams, schemas } = require('../middleware/validation');

const router = express.Router();

ensureUploadDirectories();

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, avatarUploadsPath),
  filename: (_req, file, cb) => {
    const safeOriginal = String(file.originalname || 'avatar')
      .replace(/[^\w.\-]+/g, '_')
      .slice(0, 120);
    const ext = path.extname(safeOriginal).toLowerCase() || '.png';
    const base = path.basename(safeOriginal, ext) || 'avatar';
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

const avatarFileFilter = (_req, file, cb) => {
  const allowed = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);
  if (!allowed.has(String(file.mimetype || '').toLowerCase())) {
    return cb(new Error('Only PNG, JPG, JPEG, and WebP images are allowed'));
  }
  cb(null, true);
};

const avatarUpload = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: avatarFileFilter,
});

const runAvatarUpload = (req, res, next) => {
  avatarUpload.single('avatar')(req, res, (error) => {
    if (!error) return next();

    const message =
      error.code === 'LIMIT_FILE_SIZE'
        ? 'Avatar file is too large. Max size is 5MB.'
        : error.message || 'Avatar upload failed';

    return res.status(400).json({
      success: false,
      message,
    });
  });
};

// ============= AUTHENTICATION ROUTES =============

// ===== PUBLIC ROUTES (No authentication required) =====

// POST /api/auth/register - Create new user account
router.post('/register', validateBody(schemas.auth.register), authController.register);

// POST /api/auth/login - User login
// POST /api/auth/login - User login
router.post('/login', validateBody(schemas.auth.login), authController.login);

// POST /api/auth/google - Google login
router.post('/google', validateBody(schemas.auth.googleLogin), authController.googleLogin);

// POST /api/auth/logout - Clear the active session cookie
router.post('/logout', authController.logout);

// GET /api/auth/user/:userId - Get user by ID (public for profile viewing)
router.get('/user/:userId', validateParams(schemas.auth.userIdParam), authController.getUserById);

// ===== PROTECTED ROUTES (Authentication required) =====

// GET /api/auth/me - Get current user profile
router.get('/me', auth, authController.getCurrentUser);

// PUT /api/auth/profile - Update user profile
router.put(
  '/profile',
  auth,
  validateBody(schemas.auth.updateProfile),
  authController.updateProfile
);

// POST /api/auth/avatar - Upload profile avatar image
router.post('/avatar', auth, runAvatarUpload, authController.uploadAvatar);

// DELETE /api/auth/delete - Permanently delete current user's account
router.delete('/delete', auth, authController.deleteAccount);

// ===== ROUTE DOCUMENTATION =====
// GET /api/auth/ - Show available auth endpoints
router.get('/', (req, res) => {
  res.json({
    message: 'CollabLearn Authentication API',
    endpoints: {
      register: {
        method: 'POST',
        url: '/api/auth/register',
        description: 'Create new user account',
        body: {
          name: 'string (required)',
          email: 'string (required)',
          password: 'string (required, min 6 chars)',
        },
      },
      login: {
        method: 'POST',
        url: '/api/auth/login',
        description: 'User login',
        body: {
          email: 'string (required)',
          password: 'string (required)',
        },
      },
      logout: {
        method: 'POST',
        url: '/api/auth/logout',
        description: 'Clear the active session cookie',
      },
      getCurrentUser: {
        method: 'GET',
        url: '/api/auth/me',
        description: 'Get current user profile (accepts cookie or bearer token)',
        headers: {
          Authorization: 'Bearer your-jwt-token',
        },
      },
      updateProfile: {
        method: 'PUT',
        url: '/api/auth/profile',
        description: 'Update user profile (accepts cookie or bearer token)',
        headers: {
          Authorization: 'Bearer your-jwt-token',
        },
        body: {
          name: 'string (optional)',
          bio: 'string (optional)',
          avatar: 'string (optional)',
        },
      },
    },
    note: 'Session authentication supports both httpOnly cookies and Authorization Bearer tokens.',
  });
});

module.exports = router;
