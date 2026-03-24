import test from 'node:test';
import assert from 'node:assert/strict';

import {
  formatProviderLabel,
  getAiStatusMeta,
  getHealthStatusMeta,
  getStudioModelLabel,
} from '../src/utils/status.js';

test('formatProviderLabel humanizes configured providers', () => {
  assert.equal(formatProviderLabel('gemini'), 'Gemini');
  assert.equal(formatProviderLabel('local-basic-engine'), 'Local learning engine');
});

test('getAiStatusMeta flags quota exhaustion as degraded but recoverable', () => {
  const meta = getAiStatusMeta({
    configured: true,
    provider: 'gemini',
    liveStatus: 'degraded',
    quotaExceeded: true,
  });

  assert.deepEqual(meta, {
    tone: 'amber',
    label: 'AI quota exhausted',
    detail:
      'Gemini is configured, but the latest live check hit provider quota. Local fallback planning still works.',
  });
});

test('getHealthStatusMeta marks connected services as healthy', () => {
  const meta = getHealthStatusMeta({
    success: true,
    status: 'ok',
    dbStatus: 'connected',
  });

  assert.deepEqual(meta, {
    tone: 'emerald',
    label: 'Platform healthy',
    detail: 'The API and database are both responding normally.',
  });
});

test('getStudioModelLabel prefers diagnostics over model candidates', () => {
  assert.equal(
    getStudioModelLabel({
      diagnostics: { model: 'gemini-2.0-flash' },
      modelCandidates: ['fallback-model'],
    }),
    'gemini-2.0-flash'
  );
});
