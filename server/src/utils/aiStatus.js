const normalizeStatusMessage = (value, fallback = '') => {
  const message = String(value || '')
    .replace(/\s+/g, ' ')
    .trim();

  return message ? message.slice(0, 240) : fallback;
};

const detectAiIssueCode = (message) => {
  const normalized = normalizeStatusMessage(message).toLowerCase();
  if (!normalized) return null;

  if (
    normalized.includes('429') ||
    normalized.includes('quota') ||
    normalized.includes('resource_exhausted')
  ) {
    return 'quota_exceeded';
  }

  if (normalized.includes('404') || normalized.includes('not found')) {
    return 'not_found';
  }

  if (
    normalized.includes('api key') ||
    normalized.includes('invalid key') ||
    normalized.includes('unauthorized') ||
    normalized.includes('forbidden') ||
    normalized.includes('permission denied')
  ) {
    return 'auth_error';
  }

  if (
    normalized.includes('timeout') ||
    normalized.includes('timed out') ||
    normalized.includes('deadline exceeded') ||
    normalized.includes('aborted')
  ) {
    return 'timeout';
  }

  return 'provider_error';
};

const createStudioDiagnostics = ({
  success,
  provider,
  configured,
  model,
  latencyMs,
  preview,
  error,
  checkedAt,
}) => {
  const issueMessage = normalizeStatusMessage(error || preview);
  const issueCode = success ? null : detectAiIssueCode(issueMessage);

  return {
    available: Boolean(success),
    liveStatus: success ? 'available' : configured ? 'degraded' : 'offline',
    issueCode,
    quotaExceeded: issueCode === 'quota_exceeded',
    fallbackActive: provider === 'local-basic-engine' || !success,
    checkedAt: checkedAt || new Date().toISOString(),
    latencyMs: Number.isFinite(latencyMs) ? latencyMs : null,
    provider: provider || null,
    configured: Boolean(configured),
    model: model || null,
    preview: normalizeStatusMessage(preview),
    error: success ? null : issueMessage || 'Unknown AI provider error',
  };
};

const buildStudioStatusPayload = ({ publicConfig, diagnostics }) => {
  const modelCandidates = Array.isArray(publicConfig?.modelCandidates)
    ? publicConfig.modelCandidates
    : [];

  const defaultLiveStatus = publicConfig?.configured
    ? publicConfig.provider === 'local-basic-engine'
      ? 'available'
      : 'unknown'
    : 'offline';

  return {
    success: true,
    ...publicConfig,
    ready: Boolean(publicConfig?.configured) && modelCandidates.length > 0,
    liveReady: diagnostics
      ? Boolean(diagnostics.available)
      : publicConfig?.provider === 'local-basic-engine',
    liveStatus: diagnostics?.liveStatus || defaultLiveStatus,
    fallbackActive: diagnostics
      ? Boolean(diagnostics.fallbackActive)
      : publicConfig?.provider === 'local-basic-engine',
    diagnostics: diagnostics || null,
    lastCheckedAt: diagnostics?.checkedAt || null,
    lastError: diagnostics?.error || null,
    quotaExceeded: diagnostics?.quotaExceeded || false,
  };
};

const resolveStudioHttpStatus = (diagnostics) => {
  if (!diagnostics || diagnostics.available) {
    return 200;
  }

  if (diagnostics.quotaExceeded) {
    return 429;
  }

  return 503;
};

module.exports = {
  buildStudioStatusPayload,
  createStudioDiagnostics,
  detectAiIssueCode,
  normalizeStatusMessage,
  resolveStudioHttpStatus,
};
