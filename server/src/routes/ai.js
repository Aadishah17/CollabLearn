const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const auth = require('../middleware/auth');

router.get('/studio-status', aiController.getStudioStatus);
router.post('/studio-test', aiController.testStudioConnection);
router.post('/chat', auth, aiController.chat);
router.post('/study-session', auth, aiController.generateStudySession);
router.post('/roadmap', auth, aiController.generateRoadmap);
router.get('/plans', auth, aiController.listLearningPlans);
router.get('/plans/:planId', auth, aiController.getLearningPlan);
router.patch('/plans/:planId/progress', auth, aiController.updateLearningProgress);

module.exports = router;
