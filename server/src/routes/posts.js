const express = require('express');
const router = express.Router();
const { getPosts, createPost, deletePost, likePost, addComment, getPostById, getTopContributors } = require('../controllers/postController');

router.get('/', getPosts);
// Specific route should come before param routes
router.get('/top-contributors', getTopContributors);
router.get('/:id', getPostById);
router.post('/', createPost);
router.delete('/:id', deletePost);
router.post('/:id/like', likePost);
router.post('/:id/comment', addComment);


module.exports = router;
