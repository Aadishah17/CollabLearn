const jwt = require('jsonwebtoken');
const LearningPlan = require('../models/LearningPlan');

let customTrainingData = null;
try {
  customTrainingData = require('../data/custom_training_data.json');
} catch (err) {
  console.warn('Custom training data not found, relying solely on generic fallbacks.');
}

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const RESOURCE_TYPES = ['Video', 'Article', 'Course', 'Docs', 'Community', 'Practice'];
const DEFAULT_MODEL_CANDIDATES = [
  'llama3.1',
  'llama3',
  'mistral'
];
const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';
const YOUTUBE_SEARCH_RESULTS_PER_QUERY = 25;
const YOUTUBE_CACHE_TTL_MS = 30 * 60 * 1000;
const youtubeVideoCache = new Map();

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const sanitizeText = (value, fallback = '') => {
  const text = String(value || '').trim();
  return text || fallback;
};

const parseNumericEnv = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseIntegerEnv = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) ? parsed : fallback;
};

const toTitleCase = (value) =>
  String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const parseModelCandidates = () => {
  const preferredModel = sanitizeText(process.env.GEMINI_MODEL);
  const configuredCandidates = sanitizeText(process.env.GEMINI_MODEL_CANDIDATES)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return Array.from(
    new Set([preferredModel, ...configuredCandidates, ...DEFAULT_MODEL_CANDIDATES].filter(Boolean))
  );
};

const isPlaceholderApiKey = (apiKey) => {
  const normalized = String(apiKey || '').trim().toLowerCase();
  if (!normalized) return true;

  const knownPlaceholders = new Set([
    'your_gemini_api_key',
    'your_gemini_api_key_here',
    'replace_with_gemini_api_key',
    'replace-with-gemini-api-key',
    'your-google-ai-studio-api-key'
  ]);

  return knownPlaceholders.has(normalized);
};

const buildAiStudioConfig = async () => {
  return {
    provider: 'local-basic-engine',
    configured: true,
    modelCandidates: ['local-basic-engine'],
    generationConfig: {}
  };
};

let AI_STUDIO_CONFIG = {
  provider: 'local-basic-engine',
  configured: true,
  modelCandidates: ['local-basic-engine'],
  generationConfig: {}
};

const refreshAiStudioConfig = async () => {
  AI_STUDIO_CONFIG = await buildAiStudioConfig();
};

// Initial load
refreshAiStudioConfig().catch(err => console.error('Initial AI config load failed:', err));

const getPublicAiStudioConfig = () => ({
  provider: AI_STUDIO_CONFIG.provider,
  configured: AI_STUDIO_CONFIG.configured,
  modelCandidates: AI_STUDIO_CONFIG.modelCandidates,
  generationConfig: AI_STUDIO_CONFIG.generationConfig,
  hasSystemInstruction: false
});

const buildGenerationConfig = (overrides = {}) => {
  const merged = {
    ...AI_STUDIO_CONFIG.generationConfig
  };

  if (overrides.temperature !== undefined) {
    merged.temperature = clamp(parseNumericEnv(overrides.temperature, merged.temperature), 0, 2);
  }

  if (overrides.topP !== undefined) {
    merged.topP = clamp(parseNumericEnv(overrides.topP, merged.topP), 0, 1);
  }

  if (overrides.topK !== undefined) {
    merged.topK = clamp(parseIntegerEnv(overrides.topK, merged.topK), 1, 200);
  }

  if (overrides.maxOutputTokens !== undefined) {
    merged.maxOutputTokens = clamp(
      parseIntegerEnv(overrides.maxOutputTokens, merged.maxOutputTokens),
      64,
      8192
    );
  }

  const responseMimeType = sanitizeText(overrides.responseMimeType);
  if (responseMimeType) {
    merged.responseMimeType = responseMimeType;
  }

  if (overrides.responseSchema && typeof overrides.responseSchema === 'object') {
    merged.responseSchema = overrides.responseSchema;
  }

  return merged;
};

const buildModelConfig = (modelName, generationOverrides = {}) => {
  const modelConfig = {
    model: modelName,
    generationConfig: buildGenerationConfig(generationOverrides)
  };

  if (AI_STUDIO_CONFIG.systemInstruction) {
    modelConfig.systemInstruction = AI_STUDIO_CONFIG.systemInstruction;
  }

  return modelConfig;
};

const isModelRetryableError = (error) => {
  const message = String(error?.message || '').toLowerCase();
  if (!message) return false;

  return (
    message.includes('not found') ||
    message.includes('404') ||
    (message.includes('model') && message.includes('unsupported')) ||
    (message.includes('model') && message.includes('not available')) ||
    (message.includes('model') && message.includes('permission'))
  );
};

const normalizeLevel = (value) => {
  if (typeof value !== 'string') {
    return 'Beginner';
  }
  const match = LEVELS.find((level) => level.toLowerCase() === value.toLowerCase().trim());
  return match || 'Beginner';
};

const normalizeFocusAreas = (focusAreas) => {
  if (Array.isArray(focusAreas)) {
    return focusAreas
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .slice(0, 8);
  }

  if (typeof focusAreas === 'string') {
    return focusAreas
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 8);
  }

  return [];
};

const normalizeRoadmapInput = (body = {}) => {
  const safeSkill = String(body.skill || '').trim();
  const safeLevel = normalizeLevel(body.learnerLevel);
  const safeWeeklyHours = clamp(Number(body.weeklyHours) || 6, 1, 40);
  const safeTargetWeeks = clamp(Number(body.targetWeeks) || 8, 2, 52);
  const safeFocusAreas = normalizeFocusAreas(body.focusAreas);

  return {
    skill: safeSkill,
    learnerLevel: safeLevel,
    weeklyHours: safeWeeklyHours,
    targetWeeks: safeTargetWeeks,
    focusAreas: safeFocusAreas
  };
};

const normalizeChatContext = (body = {}) => {
  const context = body && typeof body.context === 'object' ? body.context : {};
  const focusAreas = normalizeFocusAreas(context.focusAreas);

  return {
    weeklyHours: clamp(Number(context.weeklyHours) || 6, 1, 40),
    targetWeeks: clamp(Number(context.targetWeeks) || 8, 2, 52),
    progressPercentage: clamp(Number(context.progressPercentage) || 0, 0, 100),
    focusAreas,
    roadmapSummary: sanitizeText(context.roadmapSummary),
    currentStepTitle: sanitizeText(context.currentStepTitle),
    currentStepDescription: sanitizeText(context.currentStepDescription)
  };
};

const normalizeStudySessionInput = (body = {}) => {
  const roadmap = body && typeof body.roadmap === 'object' ? body.roadmap : {};

  return {
    skill: sanitizeText(body.skill),
    learnerLevel: normalizeLevel(body.learnerLevel),
    weeklyHours: clamp(Number(body.weeklyHours) || 6, 1, 40),
    availableMinutes: clamp(Number(body.availableMinutes) || 90, 30, 240),
    focusAreas: normalizeFocusAreas(body.focusAreas),
    progressPercentage: clamp(Number(body.progressPercentage) || 0, 0, 100),
    roadmapSummary: sanitizeText(roadmap.summary),
    currentStepTitle: sanitizeText(roadmap.currentStepTitle),
    currentStepDescription: sanitizeText(roadmap.currentStepDescription),
    currentStepGoals: Array.isArray(roadmap.currentStepGoals)
      ? roadmap.currentStepGoals.map((item) => sanitizeText(item)).filter(Boolean).slice(0, 5)
      : []
  };
};

const extractBearerToken = (req) => {
  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
};

const getOptionalUserIdFromToken = (req) => {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return null;
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');
    return decoded.userId || null;
  } catch (_error) {
    return null;
  }
};

const toSearchUrl = (query) =>
  `https://www.google.com/search?q=${encodeURIComponent(String(query || '').trim())}`;
const toYouTubeSearchUrl = (query) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(String(query || '').trim())}`;

const normalizeUrl = (rawUrl, fallbackQuery) => {
  const candidate = String(rawUrl || '').trim();
  if (/^https?:\/\//i.test(candidate)) {
    return candidate;
  }
  if (candidate) {
    return toSearchUrl(candidate);
  }
  return toSearchUrl(fallbackQuery);
};

const parseYouTubeApiKeys = () =>
  Array.from(
    new Set(
      [
        sanitizeText(process.env.YOUTUBE_API_KEY),
        sanitizeText(process.env.GOOGLE_API_KEY),
        sanitizeText(process.env.GEMINI_API_KEY)
      ].filter(Boolean)
    )
  );

const buildVideoSearchQueries = ({ skill, focusAreas }) => {
  const safeSkill = sanitizeText(skill);
  const focusQuery = focusAreas.length > 0 ? `${safeSkill} ${focusAreas[0]} tutorial` : '';

  return Array.from(
    new Set(
      [focusQuery, `${safeSkill} tutorial`, `learn ${safeSkill}`, `${safeSkill} full course`].filter(Boolean)
    )
  ).slice(0, 4);
};

const fetchJson = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    const details = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status}: ${details.slice(0, 220)}`);
  }
  return response.json();
};

const getYoutubeCacheKey = (skill, focusAreas) =>
  `${sanitizeText(skill).toLowerCase()}::${focusAreas.join('|').toLowerCase()}`;

const getCachedYoutubeVideo = (cacheKey) => {
  const cached = youtubeVideoCache.get(cacheKey);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > YOUTUBE_CACHE_TTL_MS) {
    youtubeVideoCache.delete(cacheKey);
    return null;
  }
  return cached.video;
};

const setCachedYoutubeVideo = (cacheKey, video) => {
  youtubeVideoCache.set(cacheKey, {
    timestamp: Date.now(),
    video
  });
};

const collectYouTubeVideoIds = async (apiKey, queries) => {
  const ids = new Set();

  for (const query of queries) {
    try {
      const params = new URLSearchParams({
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults: String(YOUTUBE_SEARCH_RESULTS_PER_QUERY),
        relevanceLanguage: 'en',
        videoEmbeddable: 'true',
        key: apiKey
      });

      const payload = await fetchJson(`${YOUTUBE_API_BASE_URL}/search?${params.toString()}`);
      (payload.items || []).forEach((item) => {
        const videoId = sanitizeText(item?.id?.videoId);
        if (videoId) ids.add(videoId);
      });
    } catch (error) {
      console.warn(`YouTube search failed for query "${query}":`, error.message);
    }
  }

  return Array.from(ids).slice(0, 50);
};

const chunkArray = (array, size) => {
  const chunks = [];
  for (let index = 0; index < array.length; index += size) {
    chunks.push(array.slice(index, index + size));
  }
  return chunks;
};

const fetchYouTubeVideoMetadata = async (apiKey, videoIds) => {
  const allVideos = [];

  for (const idsChunk of chunkArray(videoIds, 50)) {
    const params = new URLSearchParams({
      part: 'snippet,statistics',
      id: idsChunk.join(','),
      key: apiKey
    });

    const payload = await fetchJson(`${YOUTUBE_API_BASE_URL}/videos?${params.toString()}`);
    const videos = (payload.items || []).map((item) => {
      const videoId = sanitizeText(item.id);
      const title = sanitizeText(item?.snippet?.title);
      const channelTitle = sanitizeText(item?.snippet?.channelTitle);
      const likeCount = Math.max(0, Number(item?.statistics?.likeCount) || 0);
      const viewCount = Math.max(0, Number(item?.statistics?.viewCount) || 0);

      return {
        videoId,
        title,
        channelTitle,
        likeCount,
        viewCount,
        url: `https://www.youtube.com/watch?v=${videoId}`
      };
    });

    allVideos.push(...videos);
  }

  return allVideos.filter((video) => video.videoId && video.title && video.url);
};

const pickBestYouTubeVideo = (videos) => {
  if (!Array.isArray(videos) || videos.length === 0) return null;

  const sorted = [...videos].sort((a, b) => {
    if (b.likeCount !== a.likeCount) return b.likeCount - a.likeCount;
    if (b.viewCount !== a.viewCount) return b.viewCount - a.viewCount;
    return a.title.localeCompare(b.title);
  });

  return sorted[0];
};

const findBestYouTubeVideoForSkill = async ({ skill, focusAreas }) => {
  const safeSkill = sanitizeText(skill);
  if (!safeSkill) return null;

  const safeFocusAreas = Array.isArray(focusAreas) ? focusAreas : [];
  const cacheKey = getYoutubeCacheKey(safeSkill, safeFocusAreas);
  const cached = getCachedYoutubeVideo(cacheKey);
  if (cached) return cached;

  const queries = buildVideoSearchQueries({
    skill: safeSkill,
    focusAreas: safeFocusAreas
  });
  const apiKeys = parseYouTubeApiKeys();

  if (queries.length === 0 || apiKeys.length === 0) {
    return null;
  }

  let lastError = null;

  for (const apiKey of apiKeys) {
    try {
      const videoIds = await collectYouTubeVideoIds(apiKey, queries);
      if (videoIds.length === 0) continue;

      const videos = await fetchYouTubeVideoMetadata(apiKey, videoIds);
      const bestVideo = pickBestYouTubeVideo(videos);
      if (!bestVideo) continue;

      setCachedYoutubeVideo(cacheKey, bestVideo);
      return bestVideo;
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) {
    console.warn('Unable to resolve best YouTube video:', lastError.message);
  }

  return null;
};

const extractJsonString = (responseText) => {
  const raw = String(responseText || '').trim();
  if (!raw) return '';

  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return cleaned.slice(firstBrace, lastBrace + 1);
  }

  return cleaned;
};

const sanitizeJsonCandidate = (candidate) =>
  String(candidate || '')
    .replace(/^\uFEFF/, '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/,\s*([}\]])/g, '$1')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');

const parseJsonWithCleanup = (responseText) => {
  const jsonPayload = extractJsonString(responseText);
  if (!jsonPayload) {
    throw new Error('Empty JSON payload received from model');
  }

  const parseCandidates = [jsonPayload, sanitizeJsonCandidate(jsonPayload)];
  let parseError = null;

  for (const candidate of parseCandidates) {
    try {
      return JSON.parse(candidate);
    } catch (error) {
      parseError = error;
    }
  }

  throw parseError || new Error('Unable to parse model JSON output');
};

const ROADMAP_SCHEMA_REPAIR_TEMPLATE = `{
  "summary": "string",
  "steps": [
    {
      "title": "string",
      "description": "string",
      "goals": ["string", "string"],
      "practiceTask": "string",
      "estimatedHours": 4
    }
  ],
  "milestones": [
    {
      "week": 1,
      "title": "string",
      "successCriteria": "string"
    }
  ],
  "resources": [
    {
      "type": "Video | Article | Course | Docs | Community | Practice",
      "title": "string",
      "url": "https://...",
      "reason": "string",
      "level": "Beginner | Intermediate | Advanced | All Levels"
    }
  ],
  "habits": ["string"],
  "checkpoints": ["string"]
}`;

const STUDY_SESSION_SCHEMA_REPAIR_TEMPLATE = `{
  "summary": "string",
  "tasks": [
    {
      "title": "string",
      "minutes": 30,
      "instructions": "string",
      "output": "string"
    }
  ],
  "reflectionQuestions": ["string"],
  "pitfalls": ["string"]
}`;

const buildJsonRepairPrompt = ({ schema, invalidJson }) => `
You repair malformed JSON.
Convert the content below into one valid JSON object that matches this schema.
Return ONLY JSON.

Schema:
${schema}

Malformed content:
${invalidJson}
`.trim();

const isLegacyFallbackStep = ({ title, description, practiceTask, goals }) => {
  const safeGoals = Array.isArray(goals) ? goals : [];
  const joinedGoals = safeGoals.join(' ').toLowerCase();
  const safeTitle = String(title || '').toLowerCase();
  const safeDescription = String(description || '').toLowerCase();
  const safePracticeTask = String(practiceTask || '').toLowerCase();

  return (
    /focus block \d+/i.test(safeTitle) ||
    /create a mini project for .* phase \d+/i.test(safePracticeTask) ||
    /understand the key concepts for phase \d+/i.test(joinedGoals) ||
    /build confidence in .* during weeks \d+-\d+/i.test(safeDescription)
  );
};

const buildFallbackRoadmap = ({ skill, learnerLevel, weeklyHours, targetWeeks, focusAreas }) => {
  const safeSkill = skill || 'New Skill';
  const planWeeks = clamp(targetWeeks, 2, 24);
  const stepCount = clamp(Math.ceil(planWeeks / 2), 4, 8);
  const baseHoursPerStep = Math.max(2, Math.round((weeklyHours * planWeeks) / stepCount));
  
  const skillKey = safeSkill.toLowerCase();
  const customSkillData = customTrainingData?.skills?.[skillKey];

  const fallbackPhaseTitles = customSkillData?.phases || customTrainingData?.defaultPhases || [
    'Foundation and setup',
    'Core fundamentals',
    'Controlled practice',
    'Applied execution',
    'Feedback and refinement',
    'Advanced combinations',
    'Independent performance',
    'Capstone and next steps'
  ];

  const fallbackFocusThemes = customSkillData?.phases || [
    `posture and basics in ${safeSkill}`,
    `essential ${safeSkill} techniques`,
    `accuracy and repetition in ${safeSkill}`,
    `combining skills in realistic scenarios`,
    'self-review and corrections',
    `intermediate-to-advanced ${safeSkill} patterns`,
    'confident independent execution',
    'final showcase and improvement plan'
  ];

  const steps = Array.from({ length: stepCount }).map((_, index) => {
    const stepNumber = index + 1;
    const weekStart = Math.floor((index * planWeeks) / stepCount) + 1;
    const weekEnd = Math.max(weekStart, Math.floor(((index + 1) * planWeeks) / stepCount));
    const phaseTitle = toTitleCase(fallbackPhaseTitles[Math.min(index, fallbackPhaseTitles.length - 1)]);
    const focusArea = sanitizeText(
      focusAreas[index % Math.max(1, focusAreas.length)] || fallbackFocusThemes[index],
      fallbackFocusThemes[Math.min(index, fallbackFocusThemes.length - 1)]
    );

    return {
      title: `Phase ${stepNumber}: ${phaseTitle} (${safeSkill})`,
      description: `Weeks ${weekStart}-${weekEnd}: strengthen ${focusArea} through focused practice sessions and one structured review.`,
      goals: [
        `Learn and explain the key principles behind ${focusArea}.`,
        `Complete at least one guided ${safeSkill} drill tied to ${focusArea}.`,
        'Capture what improved, what is weak, and the next practice adjustment.'
      ],
      practiceTask: `Run one 60-minute deliberate-practice session on ${focusArea}. Keep one proof of work (video clip, solved exercise, or written notes) and list 3 quality improvements for the next session.`,
      estimatedHours: baseHoursPerStep
    };
  });

  const milestones = [
    {
      week: 1,
      title: 'Learning environment ready',
      successCriteria: `Set your ${safeSkill} study schedule, install required tools, and finish first guided lesson.`
    },
    {
      week: Math.max(2, Math.ceil(planWeeks / 2)),
      title: 'Midpoint validation',
      successCriteria: `Complete a strong ${safeSkill} practice output and identify two concrete improvement areas.`
    },
    {
      week: planWeeks,
      title: 'Capstone completion',
      successCriteria: `Deliver a capstone-level ${safeSkill} demonstration and document what to learn next.`
    }
  ];

  let resources = [];
  if (customSkillData?.resources && customSkillData.resources.length > 0) {
    resources = [...customSkillData.resources];
  } else {
    resources = [
      {
        type: 'Docs',
        title: `${safeSkill} official documentation`,
        url: toSearchUrl(`${safeSkill} official documentation`),
        reason: 'Primary source for accurate concepts and API behavior.',
        level: 'All Levels'
      },
      {
        type: 'Course',
        title: `${safeSkill} structured beginner-to-advanced course`,
        url: toSearchUrl(`${safeSkill} full course`),
        reason: 'Gives step-by-step structure with consistent progression.',
        level: learnerLevel
      },
      {
        type: 'Video',
        title: `${safeSkill} practical walkthroughs`,
        url: toSearchUrl(`${safeSkill} tutorial playlist`),
        reason: 'Useful for seeing practical workflows and project execution.',
        level: 'All Levels'
      },
      {
        type: 'Community',
        title: `${safeSkill} discussion and Q&A`,
        url: toSearchUrl(`${safeSkill} community forum`),
        reason: 'Get unstuck faster by learning from common issues and solutions.',
        level: 'All Levels'
      },
      {
        type: 'Practice',
        title: `${safeSkill} exercises and challenges`,
        url: toSearchUrl(`${safeSkill} exercises challenges`),
        reason: 'Hands-on repetition helps convert theory into skill.',
        level: learnerLevel
      }
    ];
  }

  const habits = customTrainingData?.defaultHabits || [
    'Study in focused 45-60 minute blocks with short breaks.',
    'Log one lesson learned and one blocker after each session.',
    'Practice before consuming more theory whenever possible.'
  ];

  const checkpoints = customTrainingData?.defaultCheckpoints || [
    'Can you explain core concepts without notes?',
    'Can you complete one task from scratch without tutorial copy-paste?',
    'Can you identify your next weak area and make a targeted practice plan?'
  ];

  return {
    summary: `This roadmap builds practical ${safeSkill} ability at ${learnerLevel} level in ${planWeeks} weeks with ${weeklyHours} hours per week.`,
    steps,
    milestones,
    resources,
    habits,
    checkpoints
  };
};

const normalizeRoadmap = (rawRoadmap, input) => {
  const fallback = buildFallbackRoadmap(input);
  const safeRaw = rawRoadmap && typeof rawRoadmap === 'object' ? rawRoadmap : {};

  const normalizedSteps = Array.isArray(safeRaw.steps)
    ? safeRaw.steps
        .map((step, index) => {
          const safeStep = step && typeof step === 'object' ? step : {};
          const fallbackStep = fallback.steps[index] || fallback.steps[fallback.steps.length - 1];
          const title = sanitizeText(safeStep.title, fallbackStep.title);
          const description = sanitizeText(safeStep.description, fallbackStep.description);
          const goals = Array.isArray(safeStep.goals)
            ? safeStep.goals.map((goal) => sanitizeText(goal)).filter(Boolean).slice(0, 5)
            : [];
          const practiceTask = sanitizeText(safeStep.practiceTask, fallbackStep.practiceTask);
          const shouldUseFallbackStep = isLegacyFallbackStep({
            title,
            description,
            practiceTask,
            goals
          });

          if (shouldUseFallbackStep) {
            return {
              ...fallbackStep,
              estimatedHours: clamp(Number(safeStep.estimatedHours) || fallbackStep.estimatedHours, 1, 40)
            };
          }

          return {
            title: sanitizeText(title, fallbackStep.title),
            description: sanitizeText(description, fallbackStep.description),
            goals: goals.length > 0 ? goals : fallbackStep.goals,
            practiceTask: sanitizeText(practiceTask, fallbackStep.practiceTask),
            estimatedHours: clamp(Number(safeStep.estimatedHours) || input.weeklyHours, 1, 40)
          };
        })
        .filter((step) => step.title && step.description)
        .slice(0, 10)
    : [];

  const normalizedMilestones = Array.isArray(safeRaw.milestones)
    ? safeRaw.milestones
        .map((milestone, index) => {
          const safeMilestone = milestone && typeof milestone === 'object' ? milestone : {};
          return {
            week: clamp(Number(safeMilestone.week) || index + 1, 1, 52),
            title: sanitizeText(safeMilestone.title, `Milestone ${index + 1}`),
            successCriteria: sanitizeText(
              safeMilestone.successCriteria,
              'Define a measurable checkpoint for this milestone.'
            )
          };
        })
        .slice(0, 6)
    : [];

  const normalizedResources = Array.isArray(safeRaw.resources)
    ? safeRaw.resources
        .map((resource) => {
          const safeResource = resource && typeof resource === 'object' ? resource : {};
          const normalizedType = RESOURCE_TYPES.includes(safeResource.type) ? safeResource.type : 'Article';
          const title = sanitizeText(safeResource.title, `${input.skill} learning resource`);

          return {
            type: normalizedType,
            title,
            url: normalizeUrl(safeResource.url, `${input.skill} ${title}`),
            reason: sanitizeText(
              safeResource.reason,
              'Supports your roadmap goals with focused practice.'
            ),
            level: LEVELS.includes(safeResource.level) ? safeResource.level : 'All Levels'
          };
        })
        .slice(0, 10)
    : [];

  const habits = Array.isArray(safeRaw.habits)
    ? safeRaw.habits.map((habit) => sanitizeText(habit)).filter(Boolean).slice(0, 6)
    : [];

  const checkpoints = Array.isArray(safeRaw.checkpoints)
    ? safeRaw.checkpoints
        .map((checkpoint) => sanitizeText(checkpoint))
        .filter(Boolean)
        .slice(0, 6)
    : [];

  return {
    summary: sanitizeText(safeRaw.summary, fallback.summary),
    steps: normalizedSteps.length > 0 ? normalizedSteps : fallback.steps,
    milestones: normalizedMilestones.length > 0 ? normalizedMilestones : fallback.milestones,
    resources: normalizedResources.length > 0 ? normalizedResources : fallback.resources,
    habits: habits.length > 0 ? habits : fallback.habits,
    checkpoints: checkpoints.length > 0 ? checkpoints : fallback.checkpoints
  };
};

const applyBestVideoGuidance = async (roadmap, input) => {
  const safeRoadmap = roadmap && typeof roadmap === 'object' ? roadmap : buildFallbackRoadmap(input);
  const resources = Array.isArray(safeRoadmap.resources) ? [...safeRoadmap.resources] : [];
  const bestVideo = await findBestYouTubeVideoForSkill({
    skill: input.skill,
    focusAreas: input.focusAreas
  });

  if (!bestVideo) {
    const fallbackVideoResource = {
      type: 'Video',
      title: `${input.skill} YouTube tutorials`,
      url: toYouTubeSearchUrl(`${input.skill} tutorial`),
      reason:
        'Direct YouTube guidance link. Add YOUTUBE_API_KEY with YouTube Data API enabled to auto-pick the highest-liked video.',
      level: input.learnerLevel
    };
    const existingVideoIndex = resources.findIndex(
      (resource) => String(resource?.type || '').toLowerCase() === 'video'
    );
    if (existingVideoIndex >= 0) {
      resources[existingVideoIndex] = fallbackVideoResource;
    } else {
      resources.unshift(fallbackVideoResource);
    }

    return {
      roadmap: {
        ...safeRoadmap,
        resources: resources.slice(0, 10)
      },
      videoGuidance: null
    };
  }

  const likesOrViews =
    bestVideo.likeCount > 0
      ? `${bestVideo.likeCount.toLocaleString()} likes`
      : `${bestVideo.viewCount.toLocaleString()} views`;

  const videoResource = {
    type: 'Video',
    title: bestVideo.title,
    url: bestVideo.url,
    reason: `Top YouTube guidance selected by highest engagement (${likesOrViews}) from ${bestVideo.channelTitle}.`,
    level: input.learnerLevel
  };

  const existingVideoIndex = resources.findIndex(
    (resource) => String(resource?.type || '').toLowerCase() === 'video'
  );

  if (existingVideoIndex >= 0) {
    resources[existingVideoIndex] = videoResource;
  } else {
    resources.unshift(videoResource);
  }

  return {
    roadmap: {
      ...safeRoadmap,
      resources: resources.slice(0, 10)
    },
    videoGuidance: bestVideo
  };
};

const buildRoadmapPrompt = ({ skill, learnerLevel, weeklyHours, targetWeeks, focusAreas }) => {
  const focusInstruction =
    focusAreas.length > 0
      ? `Focus areas to prioritize: ${focusAreas.join(', ')}.`
      : 'Focus on practical and transferable foundations first.';

  return `
You are an expert skill-learning coach for CollabLearn.
Create a personalized learning roadmap for "${skill}".

Learner profile:
- Level: ${learnerLevel}
- Weekly study hours: ${weeklyHours}
- Target duration (weeks): ${targetWeeks}
- ${focusInstruction}

Return ONLY valid JSON with this exact schema:
{
  "summary": "string",
  "steps": [
    {
      "title": "string",
      "description": "string",
      "goals": ["string", "string"],
      "practiceTask": "string",
      "estimatedHours": 4
    }
  ],
  "milestones": [
    {
      "week": 1,
      "title": "string",
      "successCriteria": "string"
    }
  ],
  "resources": [
    {
      "type": "Video | Article | Course | Docs | Community | Practice",
      "title": "string",
      "url": "https://...",
      "reason": "string",
      "level": "Beginner | Intermediate | Advanced | All Levels"
    }
  ],
  "habits": ["string"],
  "checkpoints": ["string"]
}

Rules:
- 5 to 8 roadmap steps.
- Every step must include at least 2 concrete goals.
- Every description must state exactly what will be practiced in that phase.
- Every practiceTask must create proof of work (recording, solved exercise, draft, or mini deliverable).
- Milestones must map to realistic weeks inside target duration.
- Give 5 to 8 high-value resources with practical relevance.
- Keep writing concise, specific, and action-oriented.
`.trim();
};

// Independent internal engine functions (no external fetch calls needed)

const createRoadmap = async (input) => {
  try {
    const fallbackRoadmap = buildFallbackRoadmap(input);
    const enrichedFallback = await applyBestVideoGuidance(fallbackRoadmap, input);
    return {
      roadmap: enrichedFallback.roadmap,
      source: 'basic-engine',
      model: 'local-basic-engine',
      videoGuidance: enrichedFallback.videoGuidance
    };
  } catch (error) {
    console.error('Basic Engine roadmap generation failed:', error.message);
    const fallbackRoadmap = buildFallbackRoadmap(input);
    return {
      roadmap: fallbackRoadmap,
      source: 'basic-engine',
      model: 'local-basic-engine',
      videoGuidance: null
    };
  }
};

const buildFallbackChatResponse = ({ message, skillContext, learnerLevel, context }) => {
  const focusSkill = skillContext || 'your chosen skill';
  const cleanedMessage = sanitizeText(message, 'Help me learn faster');
  const progress = Number.isFinite(context?.progressPercentage) ? context.progressPercentage : 0;
  const currentStepTitle = sanitizeText(context?.currentStepTitle);
  const focusAreas = Array.isArray(context?.focusAreas) ? context.focusAreas : [];
  const focusLine =
    focusAreas.length > 0 ? `Prioritize ${focusAreas.slice(0, 3).join(', ')}.` : 'Prioritize practical fundamentals first.';
  const currentStepLine = currentStepTitle
    ? `Focus today on "${currentStepTitle}" before moving ahead.`
    : 'Focus on the next incomplete roadmap step before adding new topics.';

  return [
    `Great question. For ${focusSkill} (${learnerLevel}), use a simple loop: Learn -> Build -> Review.`,
    `Start by spending 60% of your time on practical exercises and 40% on concepts. You are at about ${progress}% progress. ${currentStepLine}`,
    focusLine,
    `Next action: pick one small project linked to "${cleanedMessage}" and finish it this week. Avoid jumping between too many tutorials before you ship one complete result.`
  ].join(' ');
};

const buildChatPrompt = ({ message, skillContext, learnerLevel, context }) => {
  const focusAreaLine =
    context.focusAreas.length > 0
      ? context.focusAreas.join(', ')
      : 'No specific focus areas provided';

  const summaryLine = context.roadmapSummary || 'No roadmap summary available yet.';
  const currentStepLine = context.currentStepTitle
    ? `${context.currentStepTitle}: ${context.currentStepDescription || 'No step description provided.'}`
    : 'No current step selected';

  return `
You are CollabLearn's AI learning mentor.
User message: "${message}"
Skill context: "${skillContext || 'General learning'}"
Learner level: "${learnerLevel}"
Weekly hours: ${context.weeklyHours}
Target weeks: ${context.targetWeeks}
Progress: ${context.progressPercentage}%
Focus areas: ${focusAreaLine}
Roadmap summary: "${summaryLine}"
Current step: "${currentStepLine}"

Respond as a concise mentor:
- Max 160 words
- Practical and actionable
- Include one specific "do next" task for the next study session
- Mention one common mistake to avoid
- If useful, suggest one concrete resource type (docs/video/practice/community)
`.trim();
};

const chat = async (req, res) => {
  try {
    const message = sanitizeText(req.body?.message);
    const skillContext = sanitizeText(req.body?.skillContext);
    const learnerLevel = normalizeLevel(req.body?.learnerLevel || 'Beginner');
    const context = normalizeChatContext(req.body || {});

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const chatPrompt = buildChatPrompt({ message, skillContext, learnerLevel, context });

    try {
      await refreshAiStudioConfig();
      return res.json({
        success: true,
        response: buildFallbackChatResponse({ message, skillContext, learnerLevel, context }),
        source: 'basic-engine',
        provider: AI_STUDIO_CONFIG.provider,
        model: 'local-basic-engine'
      });
    } catch (error) {
      console.error('Basic Engine chat failed:', error.message);
      return res.json({
        success: true,
        response: buildFallbackChatResponse({ message, skillContext, learnerLevel, context }),
        source: 'basic-engine',
        provider: AI_STUDIO_CONFIG.provider,
        model: 'local-basic-engine'
      });
    }
  } catch (error) {
    console.error('AI Chat error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process chat request'
    });
  }
};

const buildFallbackStudySession = (input) => {
  const focusSkill = input.skill || 'your skill';
  const goals = input.currentStepGoals.length > 0 ? input.currentStepGoals : [`Practice the current ${focusSkill} concept hands-on`];
  const hasCurrentStep = Boolean(input.currentStepTitle);
  const introTaskMinutes = clamp(Math.round(input.availableMinutes * 0.2), 10, 40);
  const buildTaskMinutes = clamp(Math.round(input.availableMinutes * 0.55), 20, 140);
  const reviewTaskMinutes = Math.max(10, input.availableMinutes - introTaskMinutes - buildTaskMinutes);

  return {
    summary: `Use this ${input.availableMinutes}-minute study session to move your ${focusSkill} plan forward with one focused build cycle.`,
    tasks: [
      {
        title: hasCurrentStep ? `Review: ${input.currentStepTitle}` : `Review core ${focusSkill} concepts`,
        minutes: introTaskMinutes,
        instructions: 'Read concise notes and define one objective for this session.',
        output: 'A one-sentence session objective and checklist.'
      },
      {
        title: 'Build a practical exercise',
        minutes: buildTaskMinutes,
        instructions: `Work on one focused exercise tied to: ${goals.slice(0, 2).join(' | ')}.`,
        output: 'A working example, draft, or solved exercise.'
      },
      {
        title: 'Reflect and plan next move',
        minutes: reviewTaskMinutes,
        instructions: 'Write what worked, what failed, and what to improve in the next session.',
        output: 'Three bullet notes plus one blocker to solve next.'
      }
    ],
    reflectionQuestions: [
      'What concept was easiest to apply and why?',
      'Where did you get stuck, and what resource can unblock it?',
      'What single improvement will you test in the next session?'
    ],
    pitfalls: [
      'Consuming too much theory without practice output.',
      'Switching topics before finishing one scoped exercise.',
      'Ending a session without documenting blockers and next steps.'
    ]
  };
};

const normalizeStudySession = (raw, input) => {
  const fallback = buildFallbackStudySession(input);
  const safeRaw = raw && typeof raw === 'object' ? raw : {};

  const tasks = Array.isArray(safeRaw.tasks)
    ? safeRaw.tasks
        .map((task, index) => {
          const safeTask = task && typeof task === 'object' ? task : {};
          return {
            title: sanitizeText(safeTask.title, `Task ${index + 1}`),
            minutes: clamp(Number(safeTask.minutes) || Math.round(input.availableMinutes / 3), 5, input.availableMinutes),
            instructions: sanitizeText(safeTask.instructions, 'Complete this task with focused work.'),
            output: sanitizeText(safeTask.output, 'Record one concrete output from this task.')
          };
        })
        .filter((task) => task.title && task.instructions)
        .slice(0, 5)
    : [];

  const reflectionQuestions = Array.isArray(safeRaw.reflectionQuestions)
    ? safeRaw.reflectionQuestions.map((item) => sanitizeText(item)).filter(Boolean).slice(0, 5)
    : [];

  const pitfalls = Array.isArray(safeRaw.pitfalls)
    ? safeRaw.pitfalls.map((item) => sanitizeText(item)).filter(Boolean).slice(0, 5)
    : [];

  return {
    summary: sanitizeText(safeRaw.summary, fallback.summary),
    tasks: tasks.length > 0 ? tasks : fallback.tasks,
    reflectionQuestions: reflectionQuestions.length > 0 ? reflectionQuestions : fallback.reflectionQuestions,
    pitfalls: pitfalls.length > 0 ? pitfalls : fallback.pitfalls
  };
};

const buildStudySessionPrompt = (input) => {
  const focusAreasText =
    input.focusAreas.length > 0 ? input.focusAreas.join(', ') : 'General mastery and consistency';
  const goalsText =
    input.currentStepGoals.length > 0 ? input.currentStepGoals.join(' | ') : 'No explicit goals provided';

  return `
You are CollabLearn's AI study coach.
Create one highly practical study session plan.

Learner profile:
- Skill: ${input.skill}
- Level: ${input.learnerLevel}
- Weekly hours: ${input.weeklyHours}
- Session length (minutes): ${input.availableMinutes}
- Progress: ${input.progressPercentage}%
- Focus areas: ${focusAreasText}
- Roadmap summary: ${input.roadmapSummary || 'N/A'}
- Current step: ${input.currentStepTitle || 'N/A'}
- Current step goals: ${goalsText}

Return ONLY valid JSON using this schema:
{
  "summary": "string",
  "tasks": [
    {
      "title": "string",
      "minutes": 30,
      "instructions": "string",
      "output": "string"
    }
  ],
  "reflectionQuestions": ["string"],
  "pitfalls": ["string"]
}

Rules:
- 3 to 5 tasks total.
- Sum of task minutes should roughly match session length.
- Tasks must produce concrete outputs.
- Keep language concise and action-oriented.
`.trim();
};

const createStudySession = async (input) => {
  try {
    return { session: buildFallbackStudySession(input), source: 'basic-engine', model: 'local-basic-engine' };
  } catch (error) {
    console.error('Basic Engine study session generation failed:', error.message);
    return { session: buildFallbackStudySession(input), source: 'basic-engine', model: 'local-basic-engine' };
  }
};

const generateStudySession = async (req, res) => {
  try {
    const input = normalizeStudySessionInput(req.body || {});
    if (!input.skill) {
      return res.status(400).json({
        success: false,
        message: 'Skill is required'
      });
    }

    await refreshAiStudioConfig();
    const { session, source, model } = await createStudySession(input);
    return res.json({
      success: true,
      session,
      source,
      provider: source === 'ai' ? AI_STUDIO_CONFIG.provider : 'fallback',
      model
    });
  } catch (error) {
    console.error('Generate study session error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate study session'
    });
  }
};

const generateRoadmap = async (req, res) => {
  try {
    const input = normalizeRoadmapInput(req.body || {});
    if (!input.skill) {
      return res.status(400).json({
        success: false,
        message: 'Skill is required'
      });
    }

    await refreshAiStudioConfig();
    const { roadmap, source, model, videoGuidance } = await createRoadmap(input);

    const shouldSave = Boolean(req.body?.savePlan);
    const optionalUserId = getOptionalUserIdFromToken(req);
    let savedPlanId = null;

    if (shouldSave && optionalUserId) {
      const planDoc = await LearningPlan.create({
        user: optionalUserId,
        skill: input.skill,
        learnerLevel: input.learnerLevel,
        weeklyHours: input.weeklyHours,
        targetWeeks: input.targetWeeks,
        focusAreas: input.focusAreas,
        plan: roadmap,
        completedStepIndexes: [],
        progressPercentage: 0,
        source
      });
      savedPlanId = planDoc._id;
    }

    return res.json({
      success: true,
      roadmap,
      source,
      provider: source === 'ai' ? AI_STUDIO_CONFIG.provider : 'fallback',
      model,
      videoGuidance,
      savedPlanId
    });
  } catch (error) {
    console.error('AI Roadmap error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate roadmap'
    });
  }
};

const listLearningPlans = async (req, res) => {
  try {
    const plans = await LearningPlan.find({ user: req.userId })
      .sort({ updatedAt: -1 })
      .limit(25)
      .lean();

    return res.json({
      success: true,
      plans
    });
  } catch (error) {
    console.error('List learning plans error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch learning plans'
    });
  }
};

const getLearningPlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const plan = await LearningPlan.findOne({ _id: planId, user: req.userId }).lean();

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Learning plan not found'
      });
    }

    return res.json({
      success: true,
      plan
    });
  } catch (error) {
    console.error('Get learning plan error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch learning plan'
    });
  }
};

const updateLearningProgress = async (req, res) => {
  try {
    const { planId } = req.params;
    const rawCompletedIndexes = Array.isArray(req.body?.completedStepIndexes)
      ? req.body.completedStepIndexes
      : [];

    const plan = await LearningPlan.findOne({ _id: planId, user: req.userId });
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Learning plan not found'
      });
    }

    const totalSteps = plan.plan?.steps?.length || 0;
    const maxIndex = totalSteps - 1;
    const completedStepIndexes = Array.from(
      new Set(
        rawCompletedIndexes
          .map((item) => Number(item))
          .filter((num) => Number.isInteger(num) && num >= 0 && num <= maxIndex)
      )
    ).sort((a, b) => a - b);

    const normalizedStepCount = Math.max(1, totalSteps);
    const progressPercentage = Math.round((completedStepIndexes.length / normalizedStepCount) * 100);

    plan.completedStepIndexes = completedStepIndexes;
    plan.progressPercentage = progressPercentage;
    plan.lastProgressUpdate = new Date();

    await plan.save();

    return res.json({
      success: true,
      planId: plan._id,
      completedStepIndexes: plan.completedStepIndexes,
      progressPercentage: plan.progressPercentage
    });
  } catch (error) {
    console.error('Update learning progress error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update learning progress'
    });
  }
};

const getStudioStatus = async (_req, res) => {
  try {
    const publicConfig = getPublicAiStudioConfig();

    return res.json({
      success: true,
      ...publicConfig,
      ready: publicConfig.configured && publicConfig.modelCandidates.length > 0
    });
  } catch (error) {
    console.error('AI studio status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch AI Studio status'
    });
  }
};

const testStudioConnection = async (req, res) => {
  const startedAt = Date.now();
  
  return res.json({
    success: true,
    provider: AI_STUDIO_CONFIG.provider,
    configured: true,
    model: 'local-basic-engine',
    latencyMs: Date.now() - startedAt,
    preview: "CollabLearn Local Engine connection is working."
  });
};

module.exports = {
  chat,
  generateStudySession,
  generateRoadmap,
  listLearningPlans,
  getLearningPlan,
  updateLearningProgress,
  getStudioStatus,
  testStudioConnection
};
