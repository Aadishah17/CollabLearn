const TONE_CLASS_MAP = {
  emerald: 'border-emerald-500/45 text-emerald-200 bg-emerald-900/25',
  amber: 'border-amber-500/45 text-amber-200 bg-amber-900/25',
  blue: 'border-blue-500/45 text-blue-200 bg-blue-900/25',
  rose: 'border-rose-500/45 text-rose-200 bg-rose-900/25',
  zinc: 'border-white/15 text-zinc-200 bg-white/[0.04]',
};

export const formatProviderLabel = (provider) => {
  if (!provider) return 'Local learning engine';
  if (provider === 'local-basic-engine') return 'Local learning engine';
  if (provider === 'fallback') return 'Fallback planner';

  return String(provider)
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

export const getStudioModelLabel = (status) =>
  status?.diagnostics?.model || status?.modelCandidates?.[0] || status?.model || null;

export const getToneClasses = (tone = 'zinc') => TONE_CLASS_MAP[tone] || TONE_CLASS_MAP.zinc;

export const formatStatusTimestamp = (value) => {
  if (!value) return 'Not checked yet';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Not checked yet';
  }

  return date.toLocaleString();
};

export const getAiStatusMeta = (status) => {
  if (!status?.configured) {
    return {
      tone: 'amber',
      label: 'Learning engine offline',
      detail: 'No live AI provider is configured. The workspace will rely on the local planner.',
    };
  }

  if (status?.quotaExceeded) {
    return {
      tone: 'amber',
      label: 'AI quota exhausted',
      detail:
        'Gemini is configured, but the latest live check hit provider quota. Local fallback planning still works.',
    };
  }

  if (status?.liveStatus === 'available') {
    if (status?.provider === 'local-basic-engine') {
      return {
        tone: 'blue',
        label: 'Local engine active',
        detail:
          'Core roadmap generation is available locally even without an external AI provider.',
      };
    }

    return {
      tone: 'emerald',
      label: 'Learning engine live',
      detail: 'The primary AI provider responded successfully to the latest live check.',
    };
  }

  if (status?.liveStatus === 'degraded') {
    return {
      tone: 'amber',
      label: 'Learning engine degraded',
      detail:
        'The primary AI provider is configured, but the latest live check failed. The app may fall back to local planning.',
    };
  }

  if (status?.liveStatus === 'unknown') {
    return {
      tone: 'blue',
      label: 'Learning engine not verified',
      detail: 'The provider is configured, but no live verification result has been cached yet.',
    };
  }

  return {
    tone: 'amber',
    label: 'Learning engine unavailable',
    detail: 'The AI provider is currently unavailable.',
  };
};

export const getHealthStatusMeta = (health) => {
  const dbStatus = health?.dbStatus || health?.db || 'unknown';

  if (health?.success && health?.status === 'ok' && dbStatus === 'connected') {
    return {
      tone: 'emerald',
      label: 'Platform healthy',
      detail: 'The API and database are both responding normally.',
    };
  }

  if (health?.success && dbStatus === 'connecting') {
    return {
      tone: 'amber',
      label: 'Platform warming up',
      detail: 'The API is reachable, and the database is still reconnecting.',
    };
  }

  if (health?.success) {
    return {
      tone: 'amber',
      label: 'Platform degraded',
      detail: 'The API is reachable, but one or more services are not fully ready.',
    };
  }

  return {
    tone: 'rose',
    label: 'Platform offline',
    detail: 'The public status endpoint is not reachable right now.',
  };
};
