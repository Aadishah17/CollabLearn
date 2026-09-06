const jwt = require('jsonwebtoken');
const LearningPlan = require('../models/LearningPlan');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { resolveJwtSecret } = require('../config/auth');
const {
  buildStudioStatusPayload,
  createStudioDiagnostics,
  resolveStudioHttpStatus,
} = require('../utils/aiStatus');
const { getAiRequestProfile } = require('../utils/aiRequestProfiles');
const { TimeoutError, withTimeout } = require('../utils/withTimeout');
const { aiPipelineService } = require('../services/aiPipelineService');

// --- AI SDK Initialization ---
const { OpenAI } = require('openai');

const NVIDIA_API_KEY = (process.env.NVIDIA_API_KEY || '').trim();
const NVIDIA_MODEL_NAME =
  String(process.env.NVIDIA_MODEL || '').trim() || 'meta/llama-3.1-8b-instruct';
let openaiClient = null;

const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || '').trim();
let genAI = null;
let geminiModel = null;
const GEMINI_MODEL_NAME = String(process.env.GEMINI_MODEL || '').trim() || 'gemini-1.5-flash';

const isQuotaError = (error) => {
  const message = String(error?.message || '').toLowerCase();
  return (
    message.includes('quota') ||
    message.includes('429') ||
    message.includes('resource_exhausted') ||
    message.includes('limit')
  );
};

const isAiTimeoutError = (error) =>
  error instanceof TimeoutError ||
  error?.name === 'APIConnectionTimeoutError' ||
  error?.code === 'ETIMEDOUT';

function isPlaceholderApiKeyRaw(key) {
  const normalized = String(key || '')
    .trim()
    .toLowerCase();
  if (!normalized) return true;
  const knownPlaceholders = [
    'your_gemini_api_key',
    'your_gemini_api_key_here',
    'replace_with_gemini_api_key',
    'replace-with-gemini-api-key',
    'your-google-ai-studio-api-key',
    'your_nvidia_api_key',
  ];
  return knownPlaceholders.includes(normalized);
}

if (NVIDIA_API_KEY && !isPlaceholderApiKeyRaw(NVIDIA_API_KEY)) {
  openaiClient = new OpenAI({
    apiKey: NVIDIA_API_KEY,
    baseURL: 'https://integrate.api.nvidia.com/v1',
  });
  console.log(`[AI] NVIDIA API initialized with model: ${NVIDIA_MODEL_NAME}`);
} else if (GEMINI_API_KEY && !isPlaceholderApiKeyRaw(GEMINI_API_KEY)) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  geminiModel = genAI.getGenerativeModel({ model: GEMINI_MODEL_NAME });
  console.log(`[AI] Gemini API initialized with model: ${GEMINI_MODEL_NAME}`);
} else {
  console.warn('[AI] No valid API keys found. AI features will use fallback engine.');
}

let customTrainingData = null;
try {
  customTrainingData = require('../data/custom_training_data.json');
} catch (err) {
  console.warn('Custom training data not found, relying solely on generic fallbacks.');
}

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const RESOURCE_TYPES = ['Video', 'Article', 'Course', 'Docs', 'Community', 'Practice'];
const DEFAULT_MODEL_CANDIDATES = ['llama3.1', 'llama3', 'mistral'];
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

const AI_PROVIDER_TIMEOUT_MS = clamp(
  parseIntegerEnv(process.env.AI_PROVIDER_TIMEOUT_MS, 9000),
  1000,
  60000
);

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
  const normalized = String(apiKey || '')
    .trim()
    .toLowerCase();
  if (!normalized) return true;

  const knownPlaceholders = new Set([
    'your_gemini_api_key',
    'your_gemini_api_key_here',
    'replace_with_gemini_api_key',
    'replace-with-gemini-api-key',
    'your-google-ai-studio-api-key',
  ]);

  return knownPlaceholders.has(normalized);
};

const buildAiStudioConfig = async () => {
  if (openaiClient) {
    return {
      provider: 'nvidia',
      configured: true,
      modelCandidates: [NVIDIA_MODEL_NAME],
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
    };
  }
  if (geminiModel) {
    return {
      provider: 'gemini',
      configured: true,
      modelCandidates: [GEMINI_MODEL_NAME],
      generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
    };
  }
  return {
    provider: 'local-basic-engine',
    configured: true,
    modelCandidates: ['local-basic-engine'],
    generationConfig: {},
  };
};

let AI_STUDIO_CONFIG = {
  provider: openaiClient ? 'nvidia' : geminiModel ? 'gemini' : 'local-basic-engine',
  configured: true,
  modelCandidates: openaiClient
    ? [NVIDIA_MODEL_NAME]
    : geminiModel
      ? [GEMINI_MODEL_NAME]
      : ['local-basic-engine'],
  generationConfig: openaiClient
    ? { temperature: 0.7, maxOutputTokens: 2048 }
    : geminiModel
      ? { temperature: 0.7, maxOutputTokens: 4096 }
      : {},
};

let lastStudioDiagnostics =
  openaiClient || geminiModel
    ? null
    : createStudioDiagnostics({
        success: true,
        provider: 'local-basic-engine',
        configured: true,
        model: 'local-basic-engine',
        latencyMs: 0,
        preview: 'CollabLearn local engine is active.',
      });

const refreshAiStudioConfig = async () => {
  AI_STUDIO_CONFIG = await buildAiStudioConfig();
};

// Initial load
refreshAiStudioConfig().catch((err) => console.error('Initial AI config load failed:', err));

const getPublicAiStudioConfig = () => ({
  provider: AI_STUDIO_CONFIG.provider,
  configured: AI_STUDIO_CONFIG.configured,
  modelCandidates: AI_STUDIO_CONFIG.modelCandidates,
  generationConfig: AI_STUDIO_CONFIG.generationConfig,
  hasSystemInstruction: false,
});

const buildGenerationConfig = (overrides = {}) => {
  const merged = {
    ...AI_STUDIO_CONFIG.generationConfig,
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
    generationConfig: buildGenerationConfig(generationOverrides),
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
    focusAreas: safeFocusAreas,
  };
};

const normalizeLearningPlanSource = (source) => (source === 'ai' ? 'ai' : 'fallback');

const applyRoadmapToLearningPlan = (plan, { input, roadmap, source }) => {
  plan.skill = input.skill;
  plan.learnerLevel = input.learnerLevel;
  plan.weeklyHours = input.weeklyHours;
  plan.targetWeeks = input.targetWeeks;
  plan.focusAreas = input.focusAreas;
  plan.plan = roadmap;
  plan.completedStepIndexes = [];
  plan.progressPercentage = 0;
  plan.lastProgressUpdate = null;
  plan.source = source;
  return plan;
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
    currentStepDescription: sanitizeText(context.currentStepDescription),
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
      ? roadmap.currentStepGoals
          .map((item) => sanitizeText(item))
          .filter(Boolean)
          .slice(0, 5)
      : [],
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
    const decoded = jwt.verify(token, resolveJwtSecret());
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
      [sanitizeText(process.env.YOUTUBE_API_KEY), sanitizeText(process.env.GOOGLE_API_KEY)].filter(
        Boolean
      )
    )
  );

const buildVideoSearchQueries = ({ skill, focusAreas }) => {
  const safeSkill = sanitizeText(skill);
  const focusQuery = focusAreas.length > 0 ? `${safeSkill} ${focusAreas[0]} tutorial` : '';

  return Array.from(
    new Set(
      [
        focusQuery,
        `${safeSkill} tutorial`,
        `learn ${safeSkill}`,
        `${safeSkill} full course`,
      ].filter(Boolean)
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
    video,
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
        key: apiKey,
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
      key: apiKey,
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
        url: `https://www.youtube.com/watch?v=${videoId}`,
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
    focusAreas: safeFocusAreas,
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

const buildJsonRepairPrompt = ({ schema, invalidJson }) =>
  `
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

  const fallbackPhaseTitles = customSkillData?.phases ||
    customTrainingData?.defaultPhases || [
      'Foundation and setup',
      'Core fundamentals',
      'Controlled practice',
      'Applied execution',
      'Feedback and refinement',
      'Advanced combinations',
      'Independent performance',
      'Capstone and next steps',
    ];

  const fallbackFocusThemes = customSkillData?.phases || [
    `posture and basics in ${safeSkill}`,
    `essential ${safeSkill} techniques`,
    `accuracy and repetition in ${safeSkill}`,
    `combining skills in realistic scenarios`,
    'self-review and corrections',
    `intermediate-to-advanced ${safeSkill} patterns`,
    'confident independent execution',
    'final showcase and improvement plan',
  ];

  const steps = Array.from({ length: stepCount }).map((_, index) => {
    const stepNumber = index + 1;
    const weekStart = Math.floor((index * planWeeks) / stepCount) + 1;
    const weekEnd = Math.max(weekStart, Math.floor(((index + 1) * planWeeks) / stepCount));
    const phaseTitle = toTitleCase(
      fallbackPhaseTitles[Math.min(index, fallbackPhaseTitles.length - 1)]
    );
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
        'Capture what improved, what is weak, and the next practice adjustment.',
      ],
      practiceTask: `Run one 60-minute deliberate-practice session on ${focusArea}. Keep one proof of work (video clip, solved exercise, or written notes) and list 3 quality improvements for the next session.`,
      estimatedHours: baseHoursPerStep,
    };
  });

  const milestones = [
    {
      week: 1,
      title: 'Learning environment ready',
      successCriteria: `Set your ${safeSkill} study schedule, install required tools, and finish first guided lesson.`,
    },
    {
      week: Math.max(2, Math.ceil(planWeeks / 2)),
      title: 'Midpoint validation',
      successCriteria: `Complete a strong ${safeSkill} practice output and identify two concrete improvement areas.`,
    },
    {
      week: planWeeks,
      title: 'Capstone completion',
      successCriteria: `Deliver a capstone-level ${safeSkill} demonstration and document what to learn next.`,
    },
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
        level: 'All Levels',
      },
      {
        type: 'Course',
        title: `${safeSkill} structured beginner-to-advanced course`,
        url: toSearchUrl(`${safeSkill} full course`),
        reason: 'Gives step-by-step structure with consistent progression.',
        level: learnerLevel,
      },
      {
        type: 'Video',
        title: `${safeSkill} practical walkthroughs`,
        url: toSearchUrl(`${safeSkill} tutorial playlist`),
        reason: 'Useful for seeing practical workflows and project execution.',
        level: 'All Levels',
      },
      {
        type: 'Community',
        title: `${safeSkill} discussion and Q&A`,
        url: toSearchUrl(`${safeSkill} community forum`),
        reason: 'Get unstuck faster by learning from common issues and solutions.',
        level: 'All Levels',
      },
      {
        type: 'Practice',
        title: `${safeSkill} exercises and challenges`,
        url: toSearchUrl(`${safeSkill} exercises challenges`),
        reason: 'Hands-on repetition helps convert theory into skill.',
        level: learnerLevel,
      },
    ];
  }

  const habits = customTrainingData?.defaultHabits || [
    'Study in focused 45-60 minute blocks with short breaks.',
    'Log one lesson learned and one blocker after each session.',
    'Practice before consuming more theory whenever possible.',
  ];

  const checkpoints = customTrainingData?.defaultCheckpoints || [
    'Can you explain core concepts without notes?',
    'Can you complete one task from scratch without tutorial copy-paste?',
    'Can you identify your next weak area and make a targeted practice plan?',
  ];

  return {
    summary: `This roadmap builds practical ${safeSkill} ability at ${learnerLevel} level in ${planWeeks} weeks with ${weeklyHours} hours per week.`,
    steps,
    milestones,
    resources,
    habits,
    checkpoints,
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
            ? safeStep.goals
                .map((goal) => sanitizeText(goal))
                .filter(Boolean)
                .slice(0, 5)
            : [];
          const practiceTask = sanitizeText(safeStep.practiceTask, fallbackStep.practiceTask);
          const shouldUseFallbackStep = isLegacyFallbackStep({
            title,
            description,
            practiceTask,
            goals,
          });

          if (shouldUseFallbackStep) {
            return {
              ...fallbackStep,
              estimatedHours: clamp(
                Number(safeStep.estimatedHours) || fallbackStep.estimatedHours,
                1,
                40
              ),
            };
          }

          return {
            title: sanitizeText(title, fallbackStep.title),
            description: sanitizeText(description, fallbackStep.description),
            goals: goals.length > 0 ? goals : fallbackStep.goals,
            practiceTask: sanitizeText(practiceTask, fallbackStep.practiceTask),
            estimatedHours: clamp(Number(safeStep.estimatedHours) || input.weeklyHours, 1, 40),
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
            ),
          };
        })
        .slice(0, 6)
    : [];

  const normalizedResources = Array.isArray(safeRaw.resources)
    ? safeRaw.resources
        .map((resource) => {
          const safeResource = resource && typeof resource === 'object' ? resource : {};
          const normalizedType = RESOURCE_TYPES.includes(safeResource.type)
            ? safeResource.type
            : 'Article';
          const title = sanitizeText(safeResource.title, `${input.skill} learning resource`);

          return {
            type: normalizedType,
            title,
            url: normalizeUrl(safeResource.url, `${input.skill} ${title}`),
            reason: sanitizeText(
              safeResource.reason,
              'Supports your roadmap goals with focused practice.'
            ),
            level: LEVELS.includes(safeResource.level) ? safeResource.level : 'All Levels',
          };
        })
        .slice(0, 10)
    : [];

  const habits = Array.isArray(safeRaw.habits)
    ? safeRaw.habits
        .map((habit) => sanitizeText(habit))
        .filter(Boolean)
        .slice(0, 6)
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
    checkpoints: checkpoints.length > 0 ? checkpoints : fallback.checkpoints,
  };
};

const applyBestVideoGuidance = async (roadmap, input) => {
  const safeRoadmap =
    roadmap && typeof roadmap === 'object' ? roadmap : buildFallbackRoadmap(input);
  const resources = Array.isArray(safeRoadmap.resources) ? [...safeRoadmap.resources] : [];
  const bestVideo = await findBestYouTubeVideoForSkill({
    skill: input.skill,
    focusAreas: input.focusAreas,
  });

  if (!bestVideo) {
    const fallbackVideoResource = {
      type: 'Video',
      title: `${input.skill} YouTube tutorials`,
      url: toYouTubeSearchUrl(`${input.skill} tutorial`),
      reason:
        'Direct YouTube guidance link. Add YOUTUBE_API_KEY with YouTube Data API enabled to auto-pick the highest-liked video.',
      level: input.learnerLevel,
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
        resources: resources.slice(0, 10),
      },
      videoGuidance: null,
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
    level: input.learnerLevel,
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
      resources: resources.slice(0, 10),
    },
    videoGuidance: bestVideo,
  };
};

const buildRoadmapPrompt = ({ skill, learnerLevel, weeklyHours, targetWeeks, focusAreas }) => {
  const focusInstruction =
    focusAreas.length > 0
      ? `Focus areas to prioritize: ${focusAreas.join(', ')}.`
      : 'Focus on practical and transferable foundations first.';

  return `
You are an expert skill-learning coach for CollabLearn.
Create a concise personalized learning roadmap for "${skill}".

Learner profile:
- Level: ${learnerLevel}
- Weekly study hours: ${weeklyHours}
- Target duration (weeks): ${targetWeeks}
- ${focusInstruction}

Return ONLY valid JSON. Do not add markdown, prose, or code fences.
Keep titles and descriptions short and concrete.
Use this exact schema:
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
- Summary: maximum 2 short sentences.
- Use 5 or 6 roadmap steps.
- Every step must include exactly 2 concrete goals.
- Every description must say what gets practiced in that phase in 1 short sentence.
- Every practiceTask must produce proof of work (recording, solved exercise, draft, or mini deliverable).
- Use exactly 3 milestones mapped to realistic weeks inside target duration.
- Use exactly 5 high-value resources with practical relevance.
- Use exactly 3 habits and 3 checkpoints.
- Keep every string concise, specific, and action-oriented.
`.trim();
};

// --- AI Generation Functions (NVIDIA / Gemini API with fallback) ---

const resolveAiRequestProfile = (profileName = 'default') =>
  getAiRequestProfile(profileName, {
    defaultTimeoutMs: AI_PROVIDER_TIMEOUT_MS,
    providerDefaultTemperature: parseNumericEnv(
      AI_STUDIO_CONFIG?.generationConfig?.temperature,
      0.7
    ),
    providerDefaultMaxOutputTokens: parseIntegerEnv(
      AI_STUDIO_CONFIG?.generationConfig?.maxOutputTokens,
      2048
    ),
  });

const callAI = async (prompt, profileName = 'default') => {
  const requestProfile = resolveAiRequestProfile(profileName);

  if (openaiClient) {
    try {
      const response = await openaiClient.chat.completions.create(
        {
          model: NVIDIA_MODEL_NAME,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: requestProfile.maxOutputTokens,
          temperature: requestProfile.temperature,
        },
        {
          timeout: requestProfile.timeoutMs,
          maxRetries: 0,
        }
      );
      return response.choices?.[0]?.message?.content || '';
    } catch (error) {
      if (isAiTimeoutError(error)) {
        error.timeoutMs = requestProfile.timeoutMs;
      }
      throw error;
    }
  }
  if (!geminiModel) {
    throw new Error('AI model not initialized');
  }

  const geminiRequestModel = genAI
    ? genAI.getGenerativeModel(
        buildModelConfig(GEMINI_MODEL_NAME, {
          temperature: requestProfile.temperature,
          maxOutputTokens: requestProfile.maxOutputTokens,
          ...(requestProfile.responseMimeType
            ? { responseMimeType: requestProfile.responseMimeType }
            : {}),
        })
      )
    : geminiModel;

  try {
    const result = await withTimeout(() => geminiRequestModel.generateContent(prompt), {
      timeoutMs: requestProfile.timeoutMs,
      message: `Gemini request timed out after ${requestProfile.timeoutMs}ms`,
    });
    const response = result.response;
    return response.text();
  } catch (error) {
    if (isAiTimeoutError(error)) {
      error.timeoutMs = requestProfile.timeoutMs;
    }
    throw error;
  }
};

const createRoadmap = async (input) => {
  // Try generative AI API first
  if (openaiClient || geminiModel) {
    try {
      const prompt = buildRoadmapPrompt(input);
      console.log(`[AI] Calling AI API (${AI_STUDIO_CONFIG.provider}) for roadmap generation...`);
      const responseText = await callAI(prompt, 'roadmap');
      const parsedRoadmap = parseJsonWithCleanup(responseText);
      const normalizedRoadmap = normalizeRoadmap(parsedRoadmap, input);
      const enriched = await applyBestVideoGuidance(normalizedRoadmap, input);
      console.log('[AI] Roadmap generated successfully.');
      return {
        roadmap: enriched.roadmap,
        source: 'ai',
        model: AI_STUDIO_CONFIG.modelCandidates[0],
        videoGuidance: enriched.videoGuidance,
      };
    } catch (error) {
      if (isQuotaError(error)) {
        console.warn('[AI] Quota exceeded, switching to fallback.');
      } else if (isAiTimeoutError(error)) {
        console.warn(
          `[AI] Provider request timed out after ${error.timeoutMs || AI_PROVIDER_TIMEOUT_MS}ms, switching to fallback.`
        );
      } else {
        console.error('[AI] Roadmap generation failed:', error.message);
      }
    }
  }

  // Fallback to local engine
  try {
    const fallbackRoadmap = buildFallbackRoadmap(input);
    const enrichedFallback = await applyBestVideoGuidance(fallbackRoadmap, input);
    return {
      roadmap: enrichedFallback.roadmap,
      source: 'basic-engine',
      model: 'local-basic-engine',
      videoGuidance: enrichedFallback.videoGuidance,
    };
  } catch (error) {
    console.error('Fallback roadmap generation failed:', error.message);
    const fallbackRoadmap = buildFallbackRoadmap(input);
    return {
      roadmap: fallbackRoadmap,
      source: 'basic-engine',
      model: 'local-basic-engine',
      videoGuidance: null,
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
    focusAreas.length > 0
      ? `Prioritize ${focusAreas.slice(0, 3).join(', ')}.`
      : 'Prioritize practical fundamentals first.';
  const currentStepLine = currentStepTitle
    ? `Focus today on "${currentStepTitle}" before moving ahead.`
    : 'Focus on the next incomplete roadmap step before adding new topics.';

  return [
    `Great question. For ${focusSkill} (${learnerLevel}), use a simple loop: Learn -> Build -> Review.`,
    `Start by spending 60% of your time on practical exercises and 40% on concepts. You are at about ${progress}% progress. ${currentStepLine}`,
    focusLine,
    `Next action: pick one small project linked to "${cleanedMessage}" and finish it this week. Avoid jumping between too many tutorials before you ship one complete result.`,
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
        message: 'Message is required',
      });
    }

    const chatPrompt = buildChatPrompt({ message, skillContext, learnerLevel, context });

    // Try generative AI API first
    if (openaiClient || geminiModel) {
      try {
        await refreshAiStudioConfig();
        console.log(`[AI] Calling AI API (${AI_STUDIO_CONFIG.provider}) for chat...`);
        const responseText = await callAI(chatPrompt, 'chat');
        console.log('[AI] Chat response received.');
        return res.json({
          success: true,
          response: responseText,
          source: 'ai',
          provider: AI_STUDIO_CONFIG.provider,
          model: AI_STUDIO_CONFIG.modelCandidates[0],
        });
      } catch (error) {
        if (isQuotaError(error)) {
          console.warn('[AI] Chat quota exceeded, using fallback.');
        } else if (isAiTimeoutError(error)) {
          console.warn(
            `[AI] Chat provider request timed out after ${error.timeoutMs || AI_PROVIDER_TIMEOUT_MS}ms, using fallback.`
          );
        } else {
          console.error('[AI] Chat failed:', error.message);
        }
      }
    }

    // Fallback
    await refreshAiStudioConfig();
    return res.json({
      success: true,
      response: buildFallbackChatResponse({ message, skillContext, learnerLevel, context }),
      source: 'basic-engine',
      provider: AI_STUDIO_CONFIG.provider,
      model: 'local-basic-engine',
    });
  } catch (error) {
    console.error('AI Chat error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process chat request',
    });
  }
};

const buildFallbackStudySession = (input) => {
  const focusSkill = input.skill || 'your skill';
  const goals =
    input.currentStepGoals.length > 0
      ? input.currentStepGoals
      : [`Practice the current ${focusSkill} concept hands-on`];
  const hasCurrentStep = Boolean(input.currentStepTitle);
  const introTaskMinutes = clamp(Math.round(input.availableMinutes * 0.2), 10, 40);
  const buildTaskMinutes = clamp(Math.round(input.availableMinutes * 0.55), 20, 140);
  const reviewTaskMinutes = Math.max(
    10,
    input.availableMinutes - introTaskMinutes - buildTaskMinutes
  );

  return {
    summary: `Use this ${input.availableMinutes}-minute study session to move your ${focusSkill} plan forward with one focused build cycle.`,
    tasks: [
      {
        title: hasCurrentStep
          ? `Review: ${input.currentStepTitle}`
          : `Review core ${focusSkill} concepts`,
        minutes: introTaskMinutes,
        instructions: 'Read concise notes and define one objective for this session.',
        output: 'A one-sentence session objective and checklist.',
      },
      {
        title: 'Build a practical exercise',
        minutes: buildTaskMinutes,
        instructions: `Work on one focused exercise tied to: ${goals.slice(0, 2).join(' | ')}.`,
        output: 'A working example, draft, or solved exercise.',
      },
      {
        title: 'Reflect and plan next move',
        minutes: reviewTaskMinutes,
        instructions: 'Write what worked, what failed, and what to improve in the next session.',
        output: 'Three bullet notes plus one blocker to solve next.',
      },
    ],
    reflectionQuestions: [
      'What concept was easiest to apply and why?',
      'Where did you get stuck, and what resource can unblock it?',
      'What single improvement will you test in the next session?',
    ],
    pitfalls: [
      'Consuming too much theory without practice output.',
      'Switching topics before finishing one scoped exercise.',
      'Ending a session without documenting blockers and next steps.',
    ],
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
            minutes: clamp(
              Number(safeTask.minutes) || Math.round(input.availableMinutes / 3),
              5,
              input.availableMinutes
            ),
            instructions: sanitizeText(
              safeTask.instructions,
              'Complete this task with focused work.'
            ),
            output: sanitizeText(safeTask.output, 'Record one concrete output from this task.'),
          };
        })
        .filter((task) => task.title && task.instructions)
        .slice(0, 5)
    : [];

  const reflectionQuestions = Array.isArray(safeRaw.reflectionQuestions)
    ? safeRaw.reflectionQuestions
        .map((item) => sanitizeText(item))
        .filter(Boolean)
        .slice(0, 5)
    : [];

  const pitfalls = Array.isArray(safeRaw.pitfalls)
    ? safeRaw.pitfalls
        .map((item) => sanitizeText(item))
        .filter(Boolean)
        .slice(0, 5)
    : [];

  return {
    summary: sanitizeText(safeRaw.summary, fallback.summary),
    tasks: tasks.length > 0 ? tasks : fallback.tasks,
    reflectionQuestions:
      reflectionQuestions.length > 0 ? reflectionQuestions : fallback.reflectionQuestions,
    pitfalls: pitfalls.length > 0 ? pitfalls : fallback.pitfalls,
  };
};

const buildStudySessionPrompt = (input) => {
  const focusAreasText =
    input.focusAreas.length > 0 ? input.focusAreas.join(', ') : 'General mastery and consistency';
  const goalsText =
    input.currentStepGoals.length > 0
      ? input.currentStepGoals.join(' | ')
      : 'No explicit goals provided';

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
  // Try generative AI API first
  if (openaiClient || geminiModel) {
    try {
      const prompt = buildStudySessionPrompt(input);
      console.log(`[AI] Calling AI API (${AI_STUDIO_CONFIG.provider}) for study session...`);
      const responseText = await callAI(prompt, 'study-session');
      const parsedSession = parseJsonWithCleanup(responseText);
      const normalizedSession = normalizeStudySession(parsedSession, input);
      console.log('[AI] Study session generated successfully.');
      return {
        session: normalizedSession,
        source: 'ai',
        model: AI_STUDIO_CONFIG.modelCandidates[0],
      };
    } catch (error) {
      if (isAiTimeoutError(error)) {
        console.warn(
          `[AI] Study session provider request timed out after ${error.timeoutMs || AI_PROVIDER_TIMEOUT_MS}ms, using fallback.`
        );
      } else {
        console.error('[AI] Study session failed, using fallback:', error.message);
      }
    }
  }

  // Fallback
  try {
    return {
      session: buildFallbackStudySession(input),
      source: 'basic-engine',
      model: 'local-basic-engine',
    };
  } catch (error) {
    console.error('Fallback study session generation failed:', error.message);
    return {
      session: buildFallbackStudySession(input),
      source: 'basic-engine',
      model: 'local-basic-engine',
    };
  }
};

const generateStudySession = async (req, res) => {
  try {
    const input = normalizeStudySessionInput(req.body || {});
    if (!input.skill) {
      return res.status(400).json({
        success: false,
        message: 'Skill is required',
      });
    }

    await refreshAiStudioConfig();
    const { session, source, model } = await createStudySession(input);
    return res.json({
      success: true,
      session,
      source,
      provider: source === 'ai' ? AI_STUDIO_CONFIG.provider : 'fallback',
      model,
    });
  } catch (error) {
    console.error('Generate study session error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate study session',
    });
  }
};

const generateRoadmap = async (req, res) => {
  try {
    const input = normalizeRoadmapInput(req.body || {});
    if (!input.skill) {
      return res.status(400).json({
        success: false,
        message: 'Skill is required',
      });
    }

    await refreshAiStudioConfig();
    const { roadmap, source, model, videoGuidance } = await createRoadmap(input);
    const normalizedSource = normalizeLearningPlanSource(source);

    const shouldSave = Boolean(req.body?.savePlan);
    const optionalUserId = getOptionalUserIdFromToken(req);
    const requestedPlanId = sanitizeText(req.body?.planId);
    let savedPlanId = null;

    if (shouldSave && optionalUserId) {
      try {
        const learningPlanData = {
          user: optionalUserId,
          skill: input.skill,
          learnerLevel: input.learnerLevel,
          weeklyHours: input.weeklyHours,
          targetWeeks: input.targetWeeks,
          focusAreas: input.focusAreas,
          plan: roadmap,
          completedStepIndexes: [],
          progressPercentage: 0,
          source: normalizedSource,
        };

        if (requestedPlanId) {
          const existingPlan = await LearningPlan.findOne({
            _id: requestedPlanId,
            user: optionalUserId,
          });
          if (existingPlan) {
            applyRoadmapToLearningPlan(existingPlan, {
              input,
              roadmap,
              source: normalizedSource,
            });
            await existingPlan.save();
            savedPlanId = existingPlan._id;
          } else {
            const planDoc = await LearningPlan.create(learningPlanData);
            savedPlanId = planDoc._id;
          }
        } else {
          const planDoc = await LearningPlan.create(learningPlanData);
          savedPlanId = planDoc._id;
        }
      } catch (saveError) {
        console.warn('Could not save learning plan to database:', saveError.message);
      }
    }

    return res.json({
      success: true,
      roadmap,
      source: normalizedSource,
      provider: normalizedSource === 'ai' ? AI_STUDIO_CONFIG.provider : 'fallback',
      model,
      videoGuidance,
      savedPlanId,
    });
  } catch (error) {
    console.error('AI Roadmap error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate roadmap',
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
      plans,
    });
  } catch (error) {
    console.error('List learning plans error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch learning plans',
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
        message: 'Learning plan not found',
      });
    }

    return res.json({
      success: true,
      plan,
    });
  } catch (error) {
    console.error('Get learning plan error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch learning plan',
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
        message: 'Learning plan not found',
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
    const progressPercentage = Math.round(
      (completedStepIndexes.length / normalizedStepCount) * 100
    );

    plan.completedStepIndexes = completedStepIndexes;
    plan.progressPercentage = progressPercentage;
    plan.lastProgressUpdate = new Date();

    await plan.save();

    return res.json({
      success: true,
      planId: plan._id,
      completedStepIndexes: plan.completedStepIndexes,
      progressPercentage: plan.progressPercentage,
    });
  } catch (error) {
    console.error('Update learning progress error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update learning progress',
    });
  }
};

const getStudioStatus = async (_req, res) => {
  try {
    const publicConfig = getPublicAiStudioConfig();

    return res.json(
      buildStudioStatusPayload({
        publicConfig,
        diagnostics: lastStudioDiagnostics,
      })
    );
  } catch (error) {
    console.error('Learning engine status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch learning engine status',
    });
  }
};

const runStudioConnectionCheck = async () => {
  const startedAt = Date.now();

  if (openaiClient || geminiModel) {
    try {
      const resultText = await callAI(
        'Say "AI is connected to CollabLearn" in exactly those words.',
        'health-check'
      );
      const preview = resultText.slice(0, 200);
      const payload = {
        success: true,
        provider: AI_STUDIO_CONFIG.provider,
        configured: true,
        model: AI_STUDIO_CONFIG.modelCandidates[0],
        latencyMs: Date.now() - startedAt,
        preview,
      };

      const diagnostics = createStudioDiagnostics(payload);
      lastStudioDiagnostics = diagnostics;

      return {
        ...payload,
        liveStatus: diagnostics.liveStatus,
        liveReady: diagnostics.available,
        lastCheckedAt: diagnostics.checkedAt,
        quotaExceeded: diagnostics.quotaExceeded,
        diagnostics,
      };
    } catch (error) {
      const isQuota = isQuotaError(error);
      const friendlyError = isQuota
        ? 'AI Quota Exceeded. Please try again in 1-2 minutes or check your billing account.'
        : error.message;

      const payload = {
        success: false,
        provider: AI_STUDIO_CONFIG.provider,
        configured: true,
        model: AI_STUDIO_CONFIG.modelCandidates[0],
        latencyMs: Date.now() - startedAt,
        preview: `AI connection failed: ${friendlyError}`,
        error: friendlyError,
      };

      const diagnostics = createStudioDiagnostics(payload);
      lastStudioDiagnostics = diagnostics;

      return {
        ...payload,
        liveStatus: diagnostics.liveStatus,
        liveReady: diagnostics.available,
        lastCheckedAt: diagnostics.checkedAt,
        quotaExceeded: diagnostics.quotaExceeded,
        diagnostics,
      };
    }
  }

  const payload = {
    success: true,
    provider: 'local-basic-engine',
    configured: true,
    model: 'local-basic-engine',
    latencyMs: Date.now() - startedAt,
    preview:
      'CollabLearn Local Engine connection is working. Set GEMINI_API_KEY for AI-powered responses.',
  };

  const diagnostics = createStudioDiagnostics(payload);
  lastStudioDiagnostics = diagnostics;

  return {
    ...payload,
    liveStatus: diagnostics.liveStatus,
    liveReady: diagnostics.available,
    lastCheckedAt: diagnostics.checkedAt,
    quotaExceeded: diagnostics.quotaExceeded,
    diagnostics,
  };
};

const testStudioConnection = async (_req, res) => {
  const result = await runStudioConnectionCheck();
  const httpStatus = resolveStudioHttpStatus(result.diagnostics);
  return res.json({
    ...result,
    httpStatus,
  });
};

// --- Learning Studio Tool ---

const STUDIO_TOOLS = [
  'flashcards',
  'quiz',
  'mind-map',
  'notes',
  'summary-slides',
  'audio-script',
  'report',
  'infographic-data',
  'data-table',
];

const normalizeStudioInput = (body = {}) => ({
  tool: String(body.tool || '')
    .trim()
    .toLowerCase(),
  skill: sanitizeText(body.skill),
  learnerLevel: normalizeLevel(body.learnerLevel),
  roadmapSummary: sanitizeText(body.roadmapSummary),
  currentStepTitle: sanitizeText(body.currentStepTitle),
  currentStepDescription: sanitizeText(body.currentStepDescription),
  focusAreas: normalizeFocusAreas(body.focusAreas),
});

const buildStudioContext = (input) => {
  const focusLine = input.focusAreas.length > 0 ? input.focusAreas.join(', ') : 'general mastery';
  return `Skill: "${input.skill}"\nLevel: ${input.learnerLevel}\nFocus areas: ${focusLine}\nRoadmap summary: ${input.roadmapSummary || 'N/A'}\nCurrent step: ${input.currentStepTitle || 'N/A'} — ${input.currentStepDescription || 'N/A'}`;
};

const STUDIO_PROMPTS = {
  flashcards: (ctx) =>
    `You are a learning flashcard generator for CollabLearn.\n${ctx}\n\nGenerate 10 flashcards as JSON: { "cards": [{ "front": "question", "back": "answer" }] }. Cards should test key concepts, definitions, and practical knowledge. Return ONLY valid JSON.`,

  quiz: (ctx) =>
    `You are a quiz generator for CollabLearn.\n${ctx}\n\nGenerate 8 multiple-choice questions as JSON: { "questions": [{ "question": "string", "options": ["A","B","C","D"], "correctIndex": 0, "explanation": "string" }] }. Mix difficulty levels. Return ONLY valid JSON.`,

  'mind-map': (ctx) =>
    `You are a mind map generator for CollabLearn.\n${ctx}\n\nGenerate a mind map as JSON: { "root": "string", "branches": [{ "label": "string", "children": [{ "label": "string" }] }] }. Create 4-6 main branches with 2-4 children each covering the key topics. Return ONLY valid JSON.`,

  notes: (ctx) =>
    `You are a study notes generator for CollabLearn.\n${ctx}\n\nGenerate structured notes as JSON: { "title": "string", "sections": [{ "heading": "string", "bullets": ["string"] }] }. Create 4-6 sections covering key concepts, examples, and tips. Return ONLY valid JSON.`,

  'summary-slides': (ctx) =>
    `You are a slide deck generator for CollabLearn.\n${ctx}\n\nGenerate 8 presentation slides as JSON: { "slides": [{ "title": "string", "body": "string", "footer": "string" }] }. Cover key concepts progressively. Return ONLY valid JSON.`,

  'audio-script': (ctx) =>
    `You are an audio overview script writer for CollabLearn.\n${ctx}\n\nGenerate a concise 2-3 minute audio overview script as JSON: { "title": "string", "duration": "2-3 min", "paragraphs": ["string"] }. Write 4-5 short conversational paragraphs. Return ONLY valid JSON.`,

  report: (ctx) =>
    `You are a learning report generator for CollabLearn.\n${ctx}\n\nGenerate a learning analysis report as JSON: { "title": "string", "executive_summary": "string", "sections": [{ "heading": "string", "content": "string" }], "recommendations": ["string"] }. Include 4-5 analytical sections. Return ONLY valid JSON.`,

  'infographic-data': (ctx) =>
    `You are an infographic data generator for CollabLearn.\n${ctx}\n\nGenerate key stats and facts for an infographic as JSON: { "title": "string", "stats": [{ "label": "string", "value": "string", "icon": "string" }], "facts": ["string"] }. Include 6-8 stats and 4-5 interesting facts. For icon use emoji. Return ONLY valid JSON.`,

  'data-table': (ctx) =>
    `You are a reference table generator for CollabLearn.\n${ctx}\n\nGenerate a comparison/reference table as JSON: { "title": "string", "columns": ["string"], "rows": [["string"]] }. Create 6-10 rows comparing key concepts, tools, or techniques. Return ONLY valid JSON.`,
};

const STUDIO_FALLBACKS = {
  flashcards: (input) => ({
    cards: [
      {
        front: `What is the primary purpose of ${input.skill}?`,
        back: `${input.skill} is a systematic approach to solving problems in its domain. It provides tools, patterns, and methodologies that enable practitioners to build reliable, maintainable solutions at scale.`,
      },
      {
        front: `Name three core principles of ${input.skill}.`,
        back: `1. Abstraction — hiding complexity behind clean interfaces.\n2. Composition — building complex systems from simple, reusable parts.\n3. Iteration — improving through continuous feedback and refinement.`,
      },
      {
        front: `What distinguishes a ${input.learnerLevel} practitioner from a beginner in ${input.skill}?`,
        back: `A ${input.learnerLevel} practitioner can independently apply core concepts, debug common issues without guidance, understand trade-offs between approaches, and produce work that follows established best practices.`,
      },
      {
        front: `What is the "80/20 rule" as applied to learning ${input.skill}?`,
        back: `About 20% of ${input.skill} concepts account for 80% of practical use cases. Focus on mastering these high-impact fundamentals before pursuing advanced or niche topics.`,
      },
      {
        front: `How do you evaluate the quality of a ${input.skill} solution?`,
        back: `Key criteria include: correctness (does it solve the problem?), maintainability (can others understand and modify it?), performance (does it meet efficiency requirements?), and scalability (will it handle growth?).`,
      },
      {
        front: `What is "technical debt" in the context of ${input.skill}?`,
        back: `Technical debt refers to shortcuts taken during development that create future work. It accumulates when quick fixes are chosen over proper solutions, leading to increased maintenance costs and reduced agility.`,
      },
      {
        front: `Explain the concept of "separation of concerns" in ${input.skill}.`,
        back: `Separation of concerns means organizing your work so that each component handles one specific responsibility. This makes systems easier to understand, test, modify, and debug independently.`,
      },
      {
        front: `Why is documentation important in ${input.skill}?`,
        back: `Documentation serves as a knowledge base for current and future team members. It reduces onboarding time by 60%, prevents knowledge silos, and provides context for decisions that code alone cannot convey.`,
      },
      {
        front: `What role does testing play in ${input.skill}?`,
        back: `Testing validates that solutions work correctly, catches regressions early, serves as living documentation, and gives developers confidence to refactor and improve existing work without breaking functionality.`,
      },
      {
        front: `What is the difference between "learning" and "practicing" ${input.skill}?`,
        back: `Learning involves consuming information (reading, watching). Practicing means actively applying knowledge — building projects, solving problems, and getting feedback. Research shows practice produces 3-5x better retention than passive learning.`,
      },
      {
        front: `How do version control systems support ${input.skill} workflows?`,
        back: `Version control (like Git) tracks changes over time, enables collaboration without conflicts, provides rollback capability, supports branching for parallel work, and maintains a complete audit trail of project evolution.`,
      },
      {
        front: `What is "code review" and why does it matter?`,
        back: `Code review is the practice of having peers examine your work before it's finalized. It catches bugs early, shares knowledge across teams, enforces coding standards, and typically improves code quality by 30-50%.`,
      },
    ],
  }),

  quiz: (input) => ({
    questions: [
      {
        question: `Which of the following best describes the primary goal of ${input.skill}?`,
        options: [
          'Building efficient and maintainable solutions',
          'Memorizing syntax and rules',
          'Using the most advanced tools available',
          'Writing the shortest possible code',
        ],
        correctIndex: 0,
        explanation: `The primary goal of ${input.skill} is to create solutions that are both efficient and maintainable. While syntax and tools are important, they serve the higher goal of building quality solutions.`,
      },
      {
        question: `In ${input.skill}, what does "DRY" stand for?`,
        options: [
          "Don't Repeat Yourself",
          'Data Retrieval Yield',
          'Dynamic Resource Yielding',
          'Debug, Refactor, Yield',
        ],
        correctIndex: 0,
        explanation: `DRY (Don't Repeat Yourself) is a fundamental principle that reduces duplication. When you find yourself copying code, it's a signal to abstract the repeated logic into a reusable component.`,
      },
      {
        question: `A ${input.learnerLevel}-level practitioner of ${input.skill} should be able to:`,
        options: [
          'Apply core patterns independently',
          'Only follow tutorials step-by-step',
          'Architect enterprise-scale systems',
          'Teach advanced masterclasses',
        ],
        correctIndex: 0,
        explanation: `At the ${input.learnerLevel} level, you should be able to apply core patterns independently, understand common pitfalls, and solve standard problems without constant guidance.`,
      },
      {
        question: `What is the most effective way to learn ${input.skill}?`,
        options: [
          'Build real projects and learn from mistakes',
          'Read textbooks cover to cover',
          'Watch video courses passively',
          'Memorize all available documentation',
        ],
        correctIndex: 0,
        explanation: `Research consistently shows that active practice — building real projects, making mistakes, and iterating — is 3-5x more effective than passive learning methods like reading or watching videos.`,
      },
      {
        question: 'Which approach is best for debugging a complex issue?',
        options: [
          'Isolate the problem, reproduce it, then fix systematically',
          'Change random things until it works',
          'Rewrite everything from scratch',
          'Ignore it and hope it resolves itself',
        ],
        correctIndex: 0,
        explanation:
          'Systematic debugging involves isolating the issue, creating a minimal reproduction, understanding the root cause, and then applying a targeted fix. This approach is faster and more reliable than trial-and-error.',
      },
      {
        question: `Why are design patterns important in ${input.skill}?`,
        options: [
          'They provide proven solutions to common problems',
          'They make code look more professional',
          'They are required by all employers',
          'They always improve performance',
        ],
        correctIndex: 0,
        explanation:
          'Design patterns are tried-and-tested solutions to recurring problems. They provide a shared vocabulary for developers and help avoid reinventing the wheel. However, they should be applied judiciously, not forced onto every problem.',
      },
      {
        question: 'What is the purpose of refactoring?',
        options: [
          'Improving code structure without changing behavior',
          'Adding new features to existing code',
          'Fixing bugs in production',
          'Optimizing for maximum performance',
        ],
        correctIndex: 0,
        explanation:
          'Refactoring specifically means restructuring existing code to improve its readability, maintainability, or design — without altering its external behavior. It is a key practice for managing technical debt.',
      },
      {
        question: `When working on a ${input.skill} project, which should you prioritize first?`,
        options: [
          'Understanding the problem clearly before coding',
          'Writing code as fast as possible',
          'Choosing the newest framework',
          'Making the UI look perfect',
        ],
        correctIndex: 0,
        explanation:
          'Understanding the problem thoroughly before writing any code is the most important step. A well-understood problem leads to cleaner architecture, fewer rewrites, and faster overall delivery.',
      },
    ],
  }),

  'mind-map': (input) => ({
    root: input.skill,
    branches: [
      {
        label: 'Core Concepts',
        children: [
          { label: 'Fundamental principles' },
          { label: 'Key terminology' },
          { label: 'Mental models' },
          { label: 'Common patterns' },
        ],
      },
      {
        label: 'Tools & Environment',
        children: [
          { label: 'Development setup' },
          { label: 'Essential tools' },
          { label: 'Version control' },
          { label: 'Package management' },
        ],
      },
      {
        label: 'Best Practices',
        children: [
          { label: 'Code organization' },
          { label: 'Testing strategies' },
          { label: 'Documentation' },
          { label: 'Performance optimization' },
        ],
      },
      {
        label: 'Problem Solving',
        children: [
          { label: 'Debugging techniques' },
          { label: 'Error handling' },
          { label: 'Edge case analysis' },
          { label: 'Systematic approach' },
        ],
      },
      {
        label: 'Projects & Portfolio',
        children: [
          { label: 'Starter projects' },
          { label: 'Real-world applications' },
          { label: 'Open source contributions' },
          { label: 'Portfolio building' },
        ],
      },
      {
        label: 'Community & Growth',
        children: [
          { label: 'Online communities' },
          { label: 'Conferences & meetups' },
          { label: 'Mentorship' },
          { label: 'Continuous learning' },
        ],
      },
    ],
  }),

  notes: (input) => ({
    title: `${input.skill} — Comprehensive Study Notes`,
    sections: [
      {
        heading: 'Key Concepts & Definitions',
        bullets: [
          `${input.skill} is built on a foundation of core principles that guide all decision-making`,
          'Abstraction: Hiding complexity behind simple interfaces to manage cognitive load',
          'Composition: Building complex systems from smaller, well-defined, reusable components',
          'Encapsulation: Bundling data and methods together while restricting direct access',
          'Separation of Concerns: Each module should handle exactly one responsibility',
        ],
      },
      {
        heading: 'Current Learning Phase',
        bullets: [
          `Currently at ${input.learnerLevel} level — focus on applying concepts independently`,
          input.currentStepTitle
            ? `Active step: ${input.currentStepTitle} — ${input.currentStepDescription || 'Complete all exercises'}`
            : 'Follow your roadmap step-by-step for structured progress',
          'Goal: Build proof-of-work outputs (solved exercises, mini projects, reflections)',
          'Track your progress daily — consistency beats intensity for long-term retention',
        ],
      },
      {
        heading: 'Common Patterns & Anti-Patterns',
        bullets: [
          '✅ DO: Write self-documenting code with clear names and logical structure',
          '✅ DO: Test early and often — each test is an investment in future stability',
          '✅ DO: Refactor regularly to keep code maintainable as requirements evolve',
          '❌ AVOID: Premature optimization — make it work, then make it fast',
          "❌ AVOID: Copy-pasting solutions you don't understand — always learn why it works",
          '❌ AVOID: Skipping error handling — robust systems anticipate and handle failures gracefully',
        ],
      },
      {
        heading: 'Debugging Strategies',
        bullets: [
          'Read the error message carefully — it usually points to the exact issue',
          'Reproduce the bug consistently before attempting a fix',
          'Use print/log statements or a debugger to trace execution flow',
          'Binary search: Comment out half the code to narrow down the problem area',
          'Rubber duck debugging: Explain the problem out loud to clarify your thinking',
        ],
      },
      {
        heading: 'Practice Recommendations',
        bullets: [
          'Dedicate 25-minute focused sessions (Pomodoro technique) for deep practice',
          'Build one mini-project per week that applies current concepts',
          'Review and refactor your previous work with fresh eyes weekly',
          'Join a study group or community for accountability and peer learning',
          'Document your "aha moments" and common mistakes in a personal knowledge base',
        ],
      },
      {
        heading: 'Resources & Next Steps',
        bullets: [
          'Official documentation is always the most authoritative reference',
          'Interactive coding platforms (exercises, challenges) for hands-on practice',
          'Video tutorials for visual/conceptual learning, then apply immediately',
          'Open-source projects for real-world code reading and contribution practice',
          'Set a 90-day skill milestone and review your progress at checkpoints',
        ],
      },
    ],
  }),

  'summary-slides': (input) => ({
    slides: [
      {
        title: `Mastering ${input.skill}`,
        body: `A ${input.learnerLevel}-level learning journey designed to build practical, demonstrable competence through structured practice and real-world application.`,
        footer: 'Slide 1 of 8',
      },
      {
        title: 'Learning Philosophy',
        body: 'Learn by doing. Every concept should be reinforced with hands-on practice. Build small, functional projects rather than consuming passive content. Document your journey for future reference.',
        footer: 'Slide 2 of 8',
      },
      {
        title: 'Core Fundamentals',
        body: `The foundation of ${input.skill} rests on three pillars:\n\n1. Understanding core abstractions and mental models\n2. Mastering the tools and development environment\n3. Applying best practices consistently in every project`,
        footer: 'Slide 3 of 8',
      },
      {
        title: 'Current Focus Area',
        body: input.currentStepTitle
          ? `${input.currentStepTitle}\n\n${input.currentStepDescription || 'Complete all practice tasks before moving to the next phase. Quality over speed.'}`
          : `Focus on building strong fundamentals at the ${input.learnerLevel} level. Each concept builds on the previous one.`,
        footer: 'Slide 4 of 8',
      },
      {
        title: 'Practice Strategy',
        body: '• Week 1-2: Follow guided tutorials and reproduce examples\n• Week 3-4: Modify examples and solve practice challenges\n• Week 5-6: Build original mini-projects from scratch\n• Week 7-8: Contribute to real projects or build portfolio pieces',
        footer: 'Slide 5 of 8',
      },
      {
        title: 'Common Pitfalls to Avoid',
        body: '⚠️ Tutorial hell — watching without building\n⚠️ Perfectionism — shipping beats perfection\n⚠️ Isolation — learn with others for 90% better retention\n⚠️ Skipping fundamentals — shortcuts create knowledge gaps',
        footer: 'Slide 6 of 8',
      },
      {
        title: 'Measuring Progress',
        body: 'Track your growth with tangible outputs:\n\n✅ Projects completed and deployed\n✅ Problems solved independently\n✅ Concepts you can explain to others\n✅ Code reviews given and received\n✅ Your growing portfolio',
        footer: 'Slide 7 of 8',
      },
      {
        title: 'Next Steps',
        body: `Continue your ${input.skill} roadmap with AI-guided study sessions. Generate flashcards for retention, take quizzes to test understanding, and use the Mind Map to see the big picture.\n\nRemember: Consistency beats intensity. 30 minutes daily > 8 hours on weekends.`,
        footer: 'Slide 8 of 8',
      },
    ],
  }),

  'audio-script': (input) => ({
    title: `${input.skill} — Audio Learning Overview`,
    duration: '3 min',
    paragraphs: [
      `This is your quick ${input.skill} audio overview. It gives the shape of the roadmap without repeating every detail.`,
      (() => {
        const learnerLevelKey = String(input.learnerLevel || '').toLowerCase();
        if (learnerLevelKey === 'beginner') {
          return 'You are building the base now. Keep each session small, focus on fundamentals, and look for one clear win before moving on.';
        }
        if (learnerLevelKey === 'advanced') {
          return 'You already have the basics. Spend more time on depth, edge cases, and real-world application.';
        }
        return 'You are past the basics and ready to connect concepts. Focus on repetition, patterns, and practical use.';
      })(),
      input.currentStepTitle
        ? `Your next focus is "${input.currentStepTitle}". ${input.currentStepDescription || 'Use this step to build momentum with one concrete output.'}`
        : 'Work the next unfinished step in your roadmap and keep the output concrete.',
      input.focusAreas.length > 0
        ? `Focus areas: ${input.focusAreas.join(', ')}. Start with the first item and keep the rest in reserve.`
        : 'Stick to the highest-value concept in each session and avoid bouncing between topics.',
      'Close each session by shipping one artifact: notes, a solved exercise, or a working draft.',
    ],
  }),

  report: (input) => ({
    title: `${input.skill} — Learning Progress Report`,
    executive_summary: `This report analyzes your ${input.skill} learning trajectory at the ${input.learnerLevel} level. ${input.roadmapSummary || `The assessment covers your current standing, skill gaps, and personalized recommendations for accelerated growth.`} Your structured approach through the CollabLearn platform positions you well for measurable progress.`,
    sections: [
      {
        heading: 'Current Skill Assessment',
        content: `You are currently at the ${input.learnerLevel} level in ${input.skill}. ${input.currentStepTitle ? `Your active learning focus is "${input.currentStepTitle}" which involves ${input.currentStepDescription || 'building practical skills through hands-on exercises and real-world application'}.` : 'Based on your roadmap progression, you are building a solid foundation of core concepts that will support advanced learning.'} At this stage, the emphasis should be on consistent practice and building a portfolio of completed projects.`,
      },
      {
        heading: 'Strengths Identified',
        content: `Engaging with structured learning through CollabLearn demonstrates strong self-directed learning ability and commitment to growth. Your focus areas ${input.focusAreas.length > 0 ? '(' + input.focusAreas.join(', ') + ')' : ''} show strategic topic selection. The combination of AI-guided roadmaps and interactive study tools creates an effective multi-modal learning environment that leverages spaced repetition and active recall.`,
      },
      {
        heading: 'Areas for Improvement',
        content: `Based on your ${input.learnerLevel} level, key areas for growth include: deepening your understanding of core abstractions and design patterns, building confidence in debugging and problem-solving without external guidance, developing the ability to evaluate trade-offs between different approaches, and transitioning from following tutorials to independently designing and implementing solutions.`,
      },
      {
        heading: 'Learning Velocity Analysis',
        content: `Optimal learning at the ${input.learnerLevel} level typically requires 15-20 hours per week of focused practice. Studies show that distributed practice (daily sessions of 1-2 hours) produces 40% better retention than massed practice (weekend marathons). Track your daily practice time and aim for consistency over intensity.`,
      },
      {
        heading: 'Comparative Benchmarks',
        content: `Learners at the ${input.learnerLevel} level in ${input.skill} typically reach proficiency milestones within 3-6 months of consistent practice. Top performers share these habits: they build projects weekly, contribute to open source, participate in community discussions, and regularly review and refactor their previous work. Your use of AI-powered study tools gives you an advantage in efficient knowledge acquisition.`,
      },
    ],
    recommendations: [
      'Complete your current roadmap step with at least one concrete deliverable (project, exercise set, or written reflection)',
      'Use flashcards daily for 10 minutes to reinforce key concepts through spaced repetition',
      'Build one original mini-project per week that applies concepts from your current learning phase',
      'Schedule a weekly "refactor session" to improve code from previous weeks — this deepens understanding significantly',
      'Join at least one online community related to your skill and participate in discussions 2-3 times per week',
      'Set a 30-day milestone goal and track progress with specific, measurable outcomes',
    ],
  }),

  'infographic-data': (input) => ({
    title: `${input.skill} — Learning Dashboard`,
    stats: [
      { label: 'Current Skill', value: input.skill, icon: '🎯' },
      { label: 'Proficiency', value: toTitleCase(input.learnerLevel), icon: '📊' },
      { label: 'Focus Areas', value: `${input.focusAreas.length || 4} topics`, icon: '🔍' },
      { label: 'Active Phase', value: input.currentStepTitle || 'Fundamentals', icon: '📍' },
      { label: 'Optimal Study', value: '25 min/session', icon: '⏱️' },
      { label: 'Weekly Target', value: '5 projects', icon: '🏗️' },
      { label: 'Retention Method', value: 'Spaced Repetition', icon: '🧠' },
      { label: 'Practice Style', value: 'Learn → Build → Review', icon: '🔄' },
    ],
    facts: [
      'Active practice produces 3-5x better retention than passive reading',
      'The top 20% of concepts cover 80% of real-world use cases — focus there first',
      'Teaching others what you learn improves your own retention by up to 90%',
      'Daily 30-minute sessions outperform weekly 4-hour marathons by 40%',
      'Developers who write tests find 60% fewer bugs in production code',
      'Code review participation improves code quality by 30-50% on average',
      'Building projects is the #1 way employers evaluate technical candidates',
    ],
  }),

  'data-table': (input) => ({
    title: `${input.skill} — Learning Reference Guide`,
    columns: ['Topic', 'Description', 'Level', 'Priority', 'Time Estimate', 'Output'],
    rows: [
      [
        'Core Fundamentals',
        `Essential ${input.skill} building blocks and mental models`,
        'Beginner',
        '🔴 Critical',
        '2-3 weeks',
        'Notes & exercises',
      ],
      [
        'Development Environment',
        'Setting up tools, IDE, and workflow',
        'Beginner',
        '🔴 Critical',
        '1-2 days',
        'Working setup',
      ],
      [
        'Best Practices',
        'Code organization, naming, and structure',
        'Beginner',
        '🟠 High',
        '1-2 weeks',
        'Style guide',
      ],
      [
        'Problem Solving',
        'Debugging techniques and systematic thinking',
        'Intermediate',
        '🟠 High',
        '2-3 weeks',
        'Solved challenges',
      ],
      [
        'Design Patterns',
        `Common ${input.skill} patterns and when to use them`,
        'Intermediate',
        '🟡 Medium',
        '3-4 weeks',
        'Pattern examples',
      ],
      [
        'Testing & QA',
        'Unit tests, integration tests, and TDD basics',
        'Intermediate',
        '🟠 High',
        '2-3 weeks',
        'Test suite',
      ],
      [
        'Performance',
        'Optimization, profiling, and efficiency',
        'Advanced',
        '🟡 Medium',
        '2-3 weeks',
        'Benchmarks',
      ],
      [
        'Architecture',
        'System design and scalability patterns',
        'Advanced',
        '🟡 Medium',
        '4-6 weeks',
        'Design docs',
      ],
      [
        'Open Source',
        'Reading, contributing to, and maintaining projects',
        'Advanced',
        '🟢 Growth',
        'Ongoing',
        'Contributions',
      ],
      [
        'Portfolio Projects',
        `Real-world ${input.skill} applications for your portfolio`,
        'All Levels',
        '🔴 Critical',
        'Ongoing',
        'Deployed projects',
      ],
    ],
  }),
};

const normalizeStudioResult = (raw, tool) => {
  const safeRaw = raw && typeof raw === 'object' ? raw : {};
  switch (tool) {
    case 'flashcards':
      return {
        cards: Array.isArray(safeRaw.cards)
          ? safeRaw.cards.filter((c) => c && c.front && c.back).slice(0, 15)
          : [],
      };
    case 'quiz':
      return {
        questions: Array.isArray(safeRaw.questions)
          ? safeRaw.questions
              .filter((q) => q && q.question && Array.isArray(q.options))
              .slice(0, 12)
          : [],
      };
    case 'mind-map':
      return {
        root: sanitizeText(safeRaw.root, 'Topic'),
        branches: Array.isArray(safeRaw.branches) ? safeRaw.branches.slice(0, 8) : [],
      };
    case 'notes':
      return {
        title: sanitizeText(safeRaw.title, 'Study Notes'),
        sections: Array.isArray(safeRaw.sections) ? safeRaw.sections.slice(0, 8) : [],
      };
    case 'summary-slides':
      return {
        slides: Array.isArray(safeRaw.slides)
          ? safeRaw.slides.filter((s) => s && s.title).slice(0, 12)
          : [],
      };
    case 'audio-script':
      return {
        title: sanitizeText(safeRaw.title, 'Audio Overview'),
        duration: sanitizeText(safeRaw.duration, '3 min'),
        paragraphs: Array.isArray(safeRaw.paragraphs)
          ? safeRaw.paragraphs.filter(Boolean).slice(0, 10)
          : [],
      };
    case 'report':
      return {
        title: sanitizeText(safeRaw.title, 'Report'),
        executive_summary: sanitizeText(safeRaw.executive_summary),
        sections: Array.isArray(safeRaw.sections) ? safeRaw.sections.slice(0, 8) : [],
        recommendations: Array.isArray(safeRaw.recommendations)
          ? safeRaw.recommendations.slice(0, 6)
          : [],
      };
    case 'infographic-data':
      return {
        title: sanitizeText(safeRaw.title, 'Infographic'),
        stats: Array.isArray(safeRaw.stats) ? safeRaw.stats.slice(0, 10) : [],
        facts: Array.isArray(safeRaw.facts) ? safeRaw.facts.slice(0, 8) : [],
      };
    case 'data-table':
      return {
        title: sanitizeText(safeRaw.title, 'Reference Table'),
        columns: Array.isArray(safeRaw.columns) ? safeRaw.columns : [],
        rows: Array.isArray(safeRaw.rows) ? safeRaw.rows.slice(0, 15) : [],
      };
    default:
      return safeRaw;
  }
};

const generateStudioTool = async (req, res) => {
  try {
    const input = normalizeStudioInput(req.body || {});

    if (!input.skill) {
      return res.status(400).json({ success: false, message: 'Skill is required' });
    }
    if (!STUDIO_TOOLS.includes(input.tool)) {
      return res
        .status(400)
        .json({ success: false, message: `Invalid tool. Use one of: ${STUDIO_TOOLS.join(', ')}` });
    }

    const ctx = buildStudioContext(input);

    // Try AI first
    if (openaiClient || geminiModel) {
      try {
        const prompt = STUDIO_PROMPTS[input.tool](ctx);
        console.log(`[AI] Studio tool "${input.tool}" — calling ${AI_STUDIO_CONFIG.provider}...`);
        const responseText = await callAI(prompt, 'studio-tool');
        const parsed = parseJsonWithCleanup(responseText);
        const normalized = normalizeStudioResult(parsed, input.tool);
        console.log(`[AI] Studio tool "${input.tool}" generated successfully.`);
        return res.json({
          success: true,
          tool: input.tool,
          result: normalized,
          source: 'ai',
          provider: AI_STUDIO_CONFIG.provider,
        });
      } catch (error) {
        if (isAiTimeoutError(error)) {
          console.warn(
            `[AI] Studio tool "${input.tool}" timed out after ${error.timeoutMs || AI_PROVIDER_TIMEOUT_MS}ms, using fallback.`
          );
        } else {
          console.error(`[AI] Studio tool "${input.tool}" failed, using fallback:`, error.message);
        }
      }
    }

    // Fallback
    const fallbackResult = STUDIO_FALLBACKS[input.tool](input);
    return res.json({
      success: true,
      tool: input.tool,
      result: fallbackResult,
      source: 'basic-engine',
      provider: 'fallback',
    });
  } catch (error) {
    console.error('Studio tool error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate studio content' });
  }
};

module.exports = {
  aiPipelineService,
  chat,
  generateStudySession,
  generateRoadmap,
  listLearningPlans,
  getLearningPlan,
  updateLearningProgress,
  getStudioStatus,
  testStudioConnection,
  generateStudioTool,
};
