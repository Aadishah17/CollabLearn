const mongoose = require('mongoose');

const deepClone = (value) => JSON.parse(JSON.stringify(value));

const normalizeSlug = (value) =>
  String(value || '')
    .trim()
    .toLowerCase();

const COMPETITION_FIXTURES = [
  {
    slug: 'frontend-founders-cup',
    title: 'Frontend Founders Cup',
    status: 'live',
    tags: ['react', 'ui', 'product-thinking'],
    sourceUrl: 'https://collablearn.example.com/competitions/frontend-founders-cup',
    timing: {
      startsAt: '2026-04-01T09:00:00.000Z',
      endsAt: '2026-04-21T18:00:00.000Z',
      timezone: 'UTC',
      label: 'Live now',
    },
    summary: 'Build a polished learner-facing product surface with real-world constraints.',
    prize: 'Mentorship, portfolio review, and community showcase placement.',
    eligibility: ['Open to all learners', 'Solo or team entries', 'Public repository required'],
  },
  {
    slug: 'career-path-sprint',
    title: 'Career Path Sprint',
    status: 'upcoming',
    tags: ['career', 'portfolio', 'interviewing'],
    sourceUrl: 'https://collablearn.example.com/competitions/career-path-sprint',
    timing: {
      startsAt: '2026-04-18T09:00:00.000Z',
      endsAt: '2026-05-02T18:00:00.000Z',
      timezone: 'UTC',
      label: 'Starts soon',
    },
    summary: 'A guided challenge for turning learning progress into a credible role pitch.',
    prize: 'Mock interviews, resume feedback, and booking credits.',
    eligibility: ['Portfolio-ready learners', 'Career switchers welcome'],
  },
  {
    slug: 'ai-learning-showcase',
    title: 'AI Learning Showcase',
    status: 'upcoming',
    tags: ['ai', 'projects', 'showcase'],
    sourceUrl: 'https://collablearn.example.com/competitions/ai-learning-showcase',
    timing: {
      startsAt: '2026-05-05T09:00:00.000Z',
      endsAt: '2026-05-19T18:00:00.000Z',
      timezone: 'UTC',
      label: 'Planned next',
    },
    summary: 'Ship a small, useful AI learning project and present it publicly.',
    prize: 'Showcase slot, mentor feedback, and profile feature.',
    eligibility: ['One prototype per entrant', 'Public demo link required'],
  },
];

const CAREER_TRACK_FIXTURES = [
  {
    slug: 'full-stack-react',
    title: 'Full Stack React',
    status: 'active',
    sourceUrl: 'https://collablearn.example.com/career/tracks/full-stack-react',
    tags: ['react', 'node', 'api-design'],
    timing: {
      durationWeeks: 12,
      pace: 'Self-paced',
      label: '12 week track',
    },
    roleSummary:
      'Prepare for product-focused frontend and full-stack roles with one deployable portfolio project.',
    hiringAdvice:
      'Show one shipped app, one measurable outcome, and one example of debugging a real production issue.',
    linkedSkills: ['React component design', 'Express APIs', 'Testing and release checks'],
    linkedCourses: [
      {
        slug: 'react-patterns',
        title: 'React Patterns for Product Teams',
      },
      {
        slug: 'api-testing-basics',
        title: 'API Testing Basics',
      },
    ],
    linkedModules: [
      {
        slug: 'shipping-a-public-api',
        title: 'Shipping a Public API',
      },
      {
        slug: 'portfolio-review-checklist',
        title: 'Portfolio Review Checklist',
      },
    ],
  },
  {
    slug: 'career-ops-coordinator',
    title: 'Career Ops Coordinator',
    status: 'active',
    sourceUrl: 'https://collablearn.example.com/career/tracks/career-ops-coordinator',
    tags: ['career', 'operations', 'communication'],
    timing: {
      durationWeeks: 8,
      pace: 'Guided',
      label: '8 week track',
    },
    roleSummary:
      'Build the communication, planning, and learner support skills needed for people operations roles.',
    hiringAdvice:
      'Recruiters want to see calm follow-through, organized notes, and evidence you can keep multiple learners moving.',
    linkedSkills: ['Learner support', 'Scheduling', 'Communication'],
    linkedCourses: [
      {
        slug: 'career-communication',
        title: 'Career Communication Essentials',
      },
    ],
    linkedModules: [
      {
        slug: 'booking-workflows',
        title: 'Booking Workflows',
      },
    ],
  },
];

const COUNSELLOR_FIXTURES = [
  {
    slug: 'maya-khan',
    name: 'Maya Khan',
    title: 'Career strategist',
    bio: 'Helps learners shape a focused portfolio, choose a role target, and prepare for interviews.',
    specialties: ['portfolio review', 'role selection', 'interview prep'],
    cta: {
      label: 'Book a strategy call',
      target: '/bookings/career-strategy-call',
    },
    sourceUrl: 'https://collablearn.example.com/counsellors/maya-khan',
    responseTime: 'Usually replies within 1 business day',
  },
  {
    slug: 'devin-cole',
    name: 'Devin Cole',
    title: 'Learning coach',
    bio: 'Supports learners who need a plan for consistency, accountability, and practical next steps.',
    specialties: ['study planning', 'accountability', 'progress reviews'],
    cta: {
      label: 'Reserve a check-in',
      target: '/bookings/learning-check-in',
    },
    sourceUrl: 'https://collablearn.example.com/counsellors/devin-cole',
    responseTime: 'Replies within one business day',
  },
];

const toPlain = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value.toObject === 'function') {
    return value.toObject();
  }

  return value;
};

const runMaybeQuery = async (query) => {
  let result = query;

  if (result && typeof result.sort === 'function') {
    result = result.sort({ createdAt: -1, title: 1 });
  }

  if (result && typeof result.lean === 'function') {
    result = result.lean();
  }

  if (result && typeof result.exec === 'function') {
    result = result.exec();
  }

  return Promise.resolve(result);
};

const readManyWithFallback = async ({ model, fixtures, filter = {} }) => {
  if (mongoose.connection.readyState !== 1 || !model?.find) {
    return deepClone(fixtures);
  }

  try {
    const result = await runMaybeQuery(model.find(filter));
    const docs = Array.isArray(result) ? result.map(toPlain).filter(Boolean) : [];

    if (docs.length > 0) {
      return docs;
    }
  } catch (_error) {
    // Fall through to fixtures.
  }

  return deepClone(fixtures);
};

const readOneBySlugWithFallback = async ({ model, fixtures, slug }) => {
  const normalizedSlug = normalizeSlug(slug);

  if (mongoose.connection.readyState !== 1 || !model?.findOne) {
    const fixture = fixtures.find((item) => normalizeSlug(item.slug) === normalizedSlug);
    return fixture ? deepClone(fixture) : null;
  }

  try {
    const result = await runMaybeQuery(model.findOne({ slug: normalizedSlug }));
    const doc = toPlain(result);
    if (doc) {
      return doc;
    }
  } catch (_error) {
    // Fall through to fixtures.
  }

  const fixture = fixtures.find((item) => normalizeSlug(item.slug) === normalizedSlug);
  return fixture ? deepClone(fixture) : null;
};

module.exports = {
  COMPETITION_FIXTURES,
  CAREER_TRACK_FIXTURES,
  COUNSELLOR_FIXTURES,
  normalizeSlug,
  readManyWithFallback,
  readOneBySlugWithFallback,
};
