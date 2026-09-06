const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { validateBody, validateParams, schemas } = require('../middleware/validation');
const {
  // Skill Posting (Browse Skills Modal)
  postSkill,

  // Skill Offering
  addSkillOffering,
  updateSkillOffering,
  deleteSkillOffering,

  // Skill Seeking
  addSkillSeeking,
  updateSkillSeeking,
  deleteSkillSeeking,

  // General
  getUserSkills,
  searchSkills,
  getSkillCategories,
  getAllSkillNames,

  // Advanced Recommendations
  getPersonalizedRecommendations,
} = require('../controllers/skillController');

// ============= SKILL POSTING ROUTES (BROWSE SKILLS MODAL) =============
router.post('/post', auth, validateBody(schemas.skills.postSkill), postSkill);

// ============= SKILL OFFERING ROUTES =============
router.post('/offering', auth, validateBody(schemas.skills.addOffering), addSkillOffering);
router.put(
  '/offering/:skillId',
  auth,
  validateParams(schemas.skills.skillIdParam),
  validateBody(schemas.skills.updateOffering),
  updateSkillOffering
);
router.delete(
  '/offering/:skillId',
  auth,
  validateParams(schemas.skills.skillIdParam),
  deleteSkillOffering
);

// ============= SKILL SEEKING ROUTES =============
router.post('/seeking', auth, validateBody(schemas.skills.addSeeking), addSkillSeeking);
router.put(
  '/seeking/:skillId',
  auth,
  validateParams(schemas.skills.skillIdParam),
  validateBody(schemas.skills.updateSeeking),
  updateSkillSeeking
);
router.delete(
  '/seeking/:skillId',
  auth,
  validateParams(schemas.skills.skillIdParam),
  deleteSkillSeeking
);

// ============= GENERAL SKILL ROUTES =============
router.get('/my-skills', auth, getUserSkills);
router.get('/search', searchSkills);
router.get('/categories', getSkillCategories);
router.get('/names', getAllSkillNames);

// ============= RECOMMENDATION ROUTES =============
router.get('/recommendations', auth, getPersonalizedRecommendations);

module.exports = router;
