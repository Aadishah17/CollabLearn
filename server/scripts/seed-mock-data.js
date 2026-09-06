require('dotenv').config();

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { buildMongoConnectOptions, resolveMongoUri } = require('../src/db');
const User = require('../src/models/User');
const Skill = require('../src/models/Skill');
const Booking = require('../src/models/Booking');
const Post = require('../src/models/Post');
const LearningPlan = require('../src/models/LearningPlan');

const DEFAULT_PASSWORD = 'DemoPass123!';
const DEFAULT_CATEGORY = 'Programming';
const BOOKING_DATE = new Date('2026-04-01T10:00:00.000Z');

const mentorProfile = {
  name: 'Amina Mentor',
  email: 'amina.mentor@example.com',
  bio: 'Frontend and API mentor with a practical focus on project-based learning.',
  isPremium: true,
};

const learnerProfile = {
  name: 'Noah Learner',
  email: 'noah.learner@example.com',
  bio: 'Learning backend fundamentals, testing, and production readiness.',
};

const articleDate = new Date();

const resetRequested = process.argv.includes('--reset') || process.env.MOCK_DATA_RESET === '1';
const allowReset =
  process.env.ALLOW_MOCK_SEED_RESET === '1' ||
  String(process.env.NODE_ENV || '').trim() !== 'production';

const log = (message) => {
  console.log(`[seed-mock] ${message}`);
};

const connect = async () => {
  const mongoUri = resolveMongoUri();
  await mongoose.connect(mongoUri, buildMongoConnectOptions(mongoUri));
  return mongoUri;
};

const upsertDoc = async (model, filter, payload) =>
  model.findOneAndUpdate(
    filter,
    {
      $set: payload,
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );

const buildLearningPlan = (learnerId) => ({
  user: learnerId,
  skill: 'JavaScript Testing and Reliability',
  learnerLevel: 'Beginner',
  weeklyHours: 5,
  targetWeeks: 6,
  focusAreas: ['API testing', 'MongoDB', 'deployment checks'],
  plan: {
    summary:
      'A short guided path for building confidence with backend testing, resilient services, and smoke automation.',
    steps: [
      {
        title: 'Understand the service boundaries',
        description:
          'Map the Express API, data layer, and protected write flows before changing anything.',
        goals: ['Read the source tree', 'Identify auth and DB dependencies'],
        practiceTask: 'Trace one request end-to-end from route to MongoDB.',
        estimatedHours: 3,
      },
      {
        title: 'Write reliable tests',
        description:
          'Cover validation, rate limiting, and startup failure modes with focused tests.',
        goals: ['Add deterministic tests', 'Verify degraded-path behavior'],
        practiceTask: 'Extend one existing server test with a failure-case assertion.',
        estimatedHours: 4,
      },
      {
        title: 'Automate smoke checks',
        description: 'Create a repeatable script that exercises the app against seeded data.',
        goals: ['Seed demo records', 'Run a full smoke pass'],
        practiceTask: 'Execute the smoke script against a clean local database.',
        estimatedHours: 4,
      },
    ],
    milestones: [
      {
        week: 1,
        title: 'Map the architecture',
        successCriteria:
          'You can explain the API, DB, and auth boundaries without checking the code.',
      },
      {
        week: 3,
        title: 'Validate the important flows',
        successCriteria: 'Route validation and retry behavior are covered by tests.',
      },
      {
        week: 6,
        title: 'Ship a repeatable smoke flow',
        successCriteria: 'The smoke script runs cleanly on a seeded database.',
      },
    ],
    resources: [
      {
        type: 'Docs',
        title: 'Express API testing checklist',
        url: 'https://expressjs.com/',
        reason: 'Reference the framework the backend uses.',
        level: 'Beginner',
      },
      {
        type: 'Practice',
        title: 'MongoDB connection readiness',
        url: 'https://www.mongodb.com/docs/',
        reason: 'Review connection states and retry behavior.',
        level: 'Beginner',
      },
    ],
    habits: ['Run tests before pushing', 'Keep smoke checks deterministic'],
    checkpoints: ['Validation middleware passes', 'Smoke script passes against local MongoDB'],
  },
  completedStepIndexes: [0],
  progressPercentage: 34,
  source: 'fallback',
  lastProgressUpdate: articleDate,
});

const seedMockData = async () => {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  if (resetRequested && !allowReset) {
    throw new Error(
      'Refusing to reset mock data in production. Set ALLOW_MOCK_SEED_RESET=1 to override.'
    );
  }

  if (resetRequested) {
    log('Reset requested. Clearing seeded collections first.');
    await Promise.all([
      LearningPlan.deleteMany({}),
      Booking.deleteMany({}),
      Post.deleteMany({}),
      Skill.deleteMany({}),
      User.deleteMany({}),
    ]);
  }

  const mentor = await upsertDoc(
    User,
    { email: mentorProfile.email },
    {
      ...mentorProfile,
      password: passwordHash,
      totalSessions: 18,
      rating: {
        average: 4.9,
        count: 12,
      },
      badges: ['Top Mentor', 'Fast Responder'],
      isActive: true,
    }
  );

  const learner = await upsertDoc(
    User,
    { email: learnerProfile.email },
    {
      ...learnerProfile,
      password: passwordHash,
      totalSessions: 4,
      rating: {
        average: 4.7,
        count: 4,
      },
      badges: ['Early Adopter'],
      isActive: true,
    }
  );

  const offeringSkill = await upsertDoc(
    Skill,
    { user: mentor._id, name: 'JavaScript Testing and Reliability' },
    {
      name: 'JavaScript Testing and Reliability',
      user: mentor._id,
      isOffering: true,
      isSeeking: false,
      isPosted: true,
      priority: 4,
      category: DEFAULT_CATEGORY,
      subCategory: 'Backend Quality',
      tags: ['testing', 'api', 'mongodb'],
      offering: {
        level: 'Intermediate',
        description:
          'Mentoring for practical backend testing, MongoDB readiness, and deployment-safe workflows.',
        sessions: 18,
        rating: 4.9,
        price: 0,
        duration: '1 hour',
      },
    }
  );

  const seekingSkill = await upsertDoc(
    Skill,
    { user: learner._id, name: 'Production Readiness' },
    {
      name: 'Production Readiness',
      user: learner._id,
      isOffering: false,
      isSeeking: true,
      isPosted: true,
      priority: 3,
      category: 'Quality Assurance',
      subCategory: 'Operations',
      tags: ['deployment', 'health checks', 'monitoring'],
      seeking: {
        progress: 34,
        preferredSchedule: [
          {
            day: 'Saturday',
            timeSlots: [
              {
                start: '10:00',
                end: '12:00',
              },
            ],
          },
        ],
      },
    }
  );

  const booking = await upsertDoc(
    Booking,
    {
      instructor: mentor._id,
      student: learner._id,
      skill: offeringSkill._id,
      date: BOOKING_DATE,
    },
    {
      instructor: mentor._id,
      student: learner._id,
      skill: offeringSkill._id,
      date: BOOKING_DATE,
      duration: 60,
      notes: 'Seeded demo session for local development and smoke checks.',
      status: 'confirmed',
      sessionCount: {
        current: 1,
        total: 3,
      },
    }
  );

  const mentorPost = await upsertDoc(
    Post,
    { userId: mentor._id, title: 'Shipping resilient Node APIs' },
    {
      author: mentor.name,
      avatar: mentor.getAvatarUrl?.() || '',
      title: 'Shipping resilient Node APIs',
      excerpt:
        'A practical checklist for validating routes, surviving MongoDB startup delays, and keeping smoke tests deterministic.',
      tags: ['backend', 'testing', 'reliability'],
      category: 'Engineering',
      authorRole: 'mentor',
      isHot: true,
      likedBy: [],
      comments: [],
      userId: mentor._id,
      stats: {
        comments: 2,
        views: 128,
        likes: 14,
      },
      timestamp: articleDate,
    }
  );

  const learnerPost = await upsertDoc(
    Post,
    { userId: learner._id, title: 'Mock data makes smoke tests predictable' },
    {
      author: learner.name,
      avatar: learner.getAvatarUrl?.() || '',
      title: 'Mock data makes smoke tests predictable',
      excerpt:
        'Seeded datasets make it easier to validate the UI, API, and database behavior in CI and local development.',
      tags: ['mock-data', 'ci', 'qa'],
      category: 'Testing',
      authorRole: 'learner',
      isHot: false,
      likedBy: [],
      comments: [],
      userId: learner._id,
      stats: {
        comments: 1,
        views: 72,
        likes: 9,
      },
      timestamp: articleDate,
    }
  );

  const learningPlan = await upsertDoc(
    LearningPlan,
    { user: learner._id, skill: 'JavaScript Testing and Reliability' },
    buildLearningPlan(learner._id)
  );

  return {
    mentor,
    learner,
    offeringSkill,
    seekingSkill,
    booking,
    mentorPost,
    learnerPost,
    learningPlan,
  };
};

async function main() {
  const mongoUri = await connect();

  try {
    log(`Connected to ${mongoUri}`);
    const seeded = await seedMockData();

    log('Mock data ready:');
    log(`- mentor: ${seeded.mentor.email} / ${DEFAULT_PASSWORD}`);
    log(`- learner: ${seeded.learner.email} / ${DEFAULT_PASSWORD}`);
    log(`- offering skill: ${seeded.offeringSkill.name}`);
    log(`- seeking skill: ${seeded.seekingSkill.name}`);
    log(`- booking: ${seeded.booking._id}`);
    log(`- post: ${seeded.mentorPost.title}`);
    log(`- learning plan: ${seeded.learningPlan.skill}`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(async (error) => {
  console.error('[seed-mock] FAILURE:', error.message);
  if (error.stack) {
    console.error(error.stack);
  }

  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  } catch (_disconnectError) {
    // Ignore disconnect cleanup failures.
  }

  process.exit(1);
});
