const express = require('express');
const router = express.Router();
const {
  getPublicCompetitions,
  getPublicCompetitionBySlug,
  getPublicCareerTracks,
  getPublicCareerTrackBySlug,
  getPublicCounsellors
} = require('../controllers/publicController');

router.get('/competitions', getPublicCompetitions);
router.get('/competitions/:slug', getPublicCompetitionBySlug);
router.get('/career/tracks', getPublicCareerTracks);
router.get('/career/tracks/:slug', getPublicCareerTrackBySlug);
router.get('/counsellors', getPublicCounsellors);

module.exports = router;
