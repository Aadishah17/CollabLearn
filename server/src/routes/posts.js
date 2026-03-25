const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { validateBody, validateParams, schemas } = require('../middleware/validation');
const { getPosts, createPost, deletePost, likePost, addComment, getPostById, getTopContributors } = require('../controllers/postController');

router.get('/', getPosts);
// Specific route should come before param routes
router.get('/top-contributors', getTopContributors);
router.get('/:id', validateParams(schemas.posts.postIdParam), getPostById);
router.post('/', auth, validateBody(schemas.posts.createPost), createPost);
router.delete('/:id', auth, validateParams(schemas.posts.postIdParam), deletePost);
router.post('/:id/like', auth, validateParams(schemas.posts.postIdParam), likePost);
router.post('/:id/comment', auth, validateParams(schemas.posts.postIdParam), validateBody(schemas.posts.comment), addComment);


module.exports = router;
