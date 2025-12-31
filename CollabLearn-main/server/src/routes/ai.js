const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
// potentially add auth middleware if needed, e.g. require('../middleware/auth')

router.post('/chat', aiController.chat);
router.post('/roadmap', aiController.generateRoadmap);

module.exports = router;
