const express = require('express');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

// ============= AUTHENTICATION ROUTES =============

// ===== PUBLIC ROUTES (No authentication required) =====

// POST /api/auth/register - Create new user account
router.post('/register', authController.register);

// POST /api/auth/login - User login
// POST /api/auth/login - User login
router.post('/login', authController.login);

// POST /api/auth/google - Google login
router.post('/google', authController.googleLogin);

// GET /api/auth/user/:userId - Get user by ID (public for profile viewing)
router.get('/user/:userId', authController.getUserById);

// ===== PROTECTED ROUTES (Authentication required) =====

// GET /api/auth/me - Get current user profile
router.get('/me', auth, authController.getCurrentUser);

// PUT /api/auth/profile - Update user profile
router.put('/profile', auth, authController.updateProfile);

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
          password: 'string (required, min 6 chars)'
        }
      },
      login: {
        method: 'POST',
        url: '/api/auth/login',
        description: 'User login',
        body: {
          email: 'string (required)',
          password: 'string (required)'
        }
      },
      getCurrentUser: {
        method: 'GET',
        url: '/api/auth/me',
        description: 'Get current user profile (requires token)',
        headers: {
          Authorization: 'Bearer your-jwt-token'
        }
      },
      updateProfile: {
        method: 'PUT',
        url: '/api/auth/profile',
        description: 'Update user profile (requires token)',
        headers: {
          Authorization: 'Bearer your-jwt-token'
        },
        body: {
          name: 'string (optional)',
          bio: 'string (optional)',
          avatar: 'string (optional)'
        }
      }
    },
    note: 'Skill management endpoints are now available at /api/skills/'
  });
});

module.exports = router;