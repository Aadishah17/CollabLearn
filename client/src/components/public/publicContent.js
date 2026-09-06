import { resolvePublicWebsiteEntry } from '../../navbar/navLinks.js';

const slugify = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const collectionKeys = ['items', 'data', 'results', 'competitions', 'tracks', 'careerTracks'];
const detailKeys = ['competition', 'track', 'item', 'data', 'result'];

export const competitionFallbackItems = [
  {
    slug: 'frontend-founders-cup',
    title: 'Frontend Founders Cup',
    status: 'live',
    summary:
      'A short competition for polished interface craft, clean structure, and shipping discipline.',
    overview:
      'Build a focused landing experience with strong hierarchy, responsive behavior, and enough restraint to feel production ready.',
    timing: {
      label: '7-day sprint',
      start: '2026-04-08',
      end: '2026-04-15',
    },
    sourceUrl: '/competitions/frontend-founders-cup',
    reward: 'Showcase placement and mentor review',
    tags: ['Frontend', 'Design systems', 'Execution'],
    requirements: ['Responsive layout', 'Readable copy', 'Polished interactions'],
    judgingCriteria: ['Hierarchy', 'Craft', 'Clarity'],
    cta: { label: 'Enter competition', target: '/signup' },
  },
  {
    slug: 'product-pitch-sprint',
    title: 'Product Pitch Sprint',
    status: 'upcoming',
    summary: 'Shape a concise product story and present it with a disciplined visual system.',
    overview:
      'Turn a rough feature idea into a narrative, a landing page outline, and a final pitch that feels clear and intentional.',
    timing: {
      label: 'Launching soon',
      start: '2026-04-20',
      end: '2026-04-27',
    },
    sourceUrl: '/competitions/product-pitch-sprint',
    reward: 'Priority feedback and profile feature',
    tags: ['Storytelling', 'Product', 'Presentation'],
    requirements: ['Clear positioning', 'Strong call to action', 'Tight structure'],
    judgingCriteria: ['Message', 'Focus', 'Delivery'],
    cta: { label: 'Get notified', target: '/signup' },
  },
];

export const careerFallbackTracks = [
  {
    slug: 'full-stack-react',
    title: 'Full-Stack React',
    roleTitle: 'Junior Frontend Engineer',
    summary: 'Grow from UI implementation into data-aware product delivery.',
    roleSummary:
      'This track is built for learners who want to move from component work into full product delivery with a strong React foundation.',
    hiringAdvice:
      'Show a small number of shipped projects, explain tradeoffs clearly, and demonstrate that you can move from design intent to working UI without overcomplicating the stack.',
    sourceUrl: '/career/tracks/full-stack-react',
    tags: ['React', 'Product UI', 'APIs'],
    linkedSkills: ['React fundamentals', 'Component composition', 'Data fetching'],
    linkedCourses: ['React Core Sprint', 'Shipping UI Systems'],
    linkedModules: ['Profile builder', 'Public competition brief', 'Mentor feedback loop'],
    cta: { label: 'Start this track', target: '/signup' },
  },
  {
    slug: 'product-design-systems',
    title: 'Product Design Systems',
    roleTitle: 'UI Engineer / Design Systems Associate',
    summary: 'Translate design intent into reusable interfaces and durable tokens.',
    roleSummary:
      'A track for builders who like interface quality, accessibility, and the kind of craft that keeps a product cohesive as it grows.',
    hiringAdvice:
      'Keep your portfolio concise. Lead with a system, not a pile of screenshots, and make your impact measurable.',
    sourceUrl: '/career/tracks/product-design-systems',
    tags: ['Design systems', 'Accessibility', 'UI'],
    linkedSkills: ['Design tokens', 'Accessible components', 'Visual polish'],
    linkedCourses: ['System thinking', 'Practical accessibility'],
    linkedModules: ['Theme foundations', 'Component polish', 'Portfolio layout'],
    cta: { label: 'Explore the track', target: '/signup' },
  },
];

export function normalizePublicCollection(payload, preferredKeys = []) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  for (const key of [...preferredKeys, ...collectionKeys]) {
    if (Array.isArray(payload[key])) return payload[key];
  }

  return [];
}

export function normalizePublicRecord(payload, preferredKeys = []) {
  if (!payload || typeof payload !== 'object') return payload || null;

  for (const key of [...preferredKeys, ...detailKeys]) {
    const value = payload[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  }

  return payload;
}

export function findPublicItemBySlug(items, slug) {
  const needle = slugify(slug);
  if (!needle || !Array.isArray(items)) return null;

  return (
    items.find((item) => {
      const candidates = [
        item?.slug,
        item?.trackSlug,
        item?.competitionSlug,
        item?.id,
        item?._id,
        item?.name,
        item?.title,
        item?.key,
      ];

      return candidates.some((candidate) => slugify(candidate) === needle);
    }) || null
  );
}

export function pickFallbackPublicItem(collection, slug) {
  return findPublicItemBySlug(collection, slug) || collection[0] || null;
}

export function resolvePublicPageCta(session) {
  return resolvePublicWebsiteEntry(session);
}

export function formatPublicDate(value, options = {}) {
  if (!value) return 'TBA';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  });
}
