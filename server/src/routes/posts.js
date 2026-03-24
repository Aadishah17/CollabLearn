const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getPosts, createPost, deletePost, likePost, addComment, getPostById, getTopContributors } = require('../controllers/postController');

router.get('/', getPosts);
// Specific route should come before param routes
router.get('/top-contributors', getTopContributors);
router.get('/:id', getPostById);
router.post('/', auth, createPost);
router.delete('/:id', auth, deletePost);
router.post('/:id/like', auth, likePost);
router.post('/:id/comment', auth, addComment);


module.exports = router;
