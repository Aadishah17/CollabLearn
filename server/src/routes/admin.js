const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');

router.use(auth, requireAdmin);

// --- Platform Settings ---
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);

// --- Dashboard Stats ---
router.get('/stats', adminController.getStats);

// --- User Management Routes ---
router.get('/users', adminController.getAllUsers);
router.put('/users/:userId/block', adminController.blockUser);
router.put('/users/:userId/unblock', adminController.unblockUser);
router.put('/users/:userId/subscription', adminController.updateUserSubscription);

// --- Post Management Routes (Correctly Defined) ---
router.get('/posts', adminController.getAllPosts);
router.delete('/posts/:postId', adminController.deletePostAsAdmin);


module.exports = router;

