const Competition = require('../models/Competition');
const CareerTrack = require('../models/CareerTrack');
const Counsellor = require('../models/Counsellor');
const {
  COMPETITION_FIXTURES,
  CAREER_TRACK_FIXTURES,
  COUNSELLOR_FIXTURES,
  readManyWithFallback,
  readOneBySlugWithFallback
} = require('../utils/publicContent');

exports.getPublicCompetitions = async (_req, res) => {
  const competitions = await readManyWithFallback({
    model: Competition,
    fixtures: COMPETITION_FIXTURES
  });

  res.json({
    success: true,
    count: competitions.length,
    competitions
  });
};

exports.getPublicCompetitionBySlug = async (req, res) => {
  const competition = await readOneBySlugWithFallback({
    model: Competition,
    fixtures: COMPETITION_FIXTURES,
    slug: req.params.slug
  });

  if (!competition) {
    return res.status(404).json({
      success: false,
      message: 'Competition not found'
    });
  }

  res.json({
    success: true,
    competition
  });
};

exports.getPublicCareerTracks = async (_req, res) => {
  const tracks = await readManyWithFallback({
    model: CareerTrack,
    fixtures: CAREER_TRACK_FIXTURES
  });

  res.json({
    success: true,
    count: tracks.length,
    tracks
  });
};

exports.getPublicCareerTrackBySlug = async (req, res) => {
  const track = await readOneBySlugWithFallback({
    model: CareerTrack,
    fixtures: CAREER_TRACK_FIXTURES,
    slug: req.params.slug
  });

  if (!track) {
    return res.status(404).json({
      success: false,
      message: 'Career track not found'
    });
  }

  res.json({
    success: true,
    track
  });
};

exports.getPublicCounsellors = async (_req, res) => {
  const counsellors = await readManyWithFallback({
    model: Counsellor,
    fixtures: COUNSELLOR_FIXTURES
  });

  res.json({
    success: true,
    count: counsellors.length,
    counsellors
  });
};
