const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');

// Middleware to check for admin role would be ideal here

// --- Dashboard Stats ---
router.get('/stats', auth, adminController.getStats);

// --- User Management Routes ---
router.get('/users', auth, adminController.getAllUsers);
router.put('/users/:userId/block', auth, adminController.blockUser);
router.put('/users/:userId/unblock', auth, adminController.unblockUser);
router.put('/users/:userId/subscription', auth, (req, res, next) => {
    console.log('🔔 Subscription route hit!');
    console.log('User ID:', req.params.userId);
    console.log('Request body:', req.body);
    next();
}, adminController.updateUserSubscription);

// --- Post Management Routes (Correctly Defined) ---
router.get('/posts', auth, adminController.getAllPosts);
router.delete('/posts/:postId', auth, adminController.deletePostAsAdmin);


module.exports = router;

