const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildStudioStatusPayload,
  createStudioDiagnostics,
  detectAiIssueCode,
  resolveStudioHttpStatus,
} = require('../src/utils/aiStatus');

test('detectAiIssueCode identifies provider quota failures', () => {
  assert.equal(
    detectAiIssueCode('429 Resource exhausted: quota exceeded for requests'),
    'quota_exceeded'
  );
});

test('createStudioDiagnostics marks configured provider failures as degraded', () => {
  const diagnostics = createStudioDiagnostics({
    success: false,
    provider: 'gemini',
    configured: true,
    model: 'gemini-2.0-flash',
    latencyMs: 841,
    error: '429 Resource exhausted: quota exceeded',
  });

  assert.equal(diagnostics.liveStatus, 'degraded');
  assert.equal(diagnostics.quotaExceeded, true);
  assert.equal(diagnostics.available, false);
  assert.equal(diagnostics.issueCode, 'quota_exceeded');
});

test('buildStudioStatusPayload defaults configured remote providers to unknown until checked', () => {
  const payload = buildStudioStatusPayload({
    publicConfig: {
      provider: 'gemini',
      configured: true,
      modelCandidates: ['gemini-2.0-flash'],
      generationConfig: {},
    },
    diagnostics: null,
  });

  assert.equal(payload.ready, true);
  assert.equal(payload.liveStatus, 'unknown');
  assert.equal(payload.liveReady, false);
});

test('resolveStudioHttpStatus returns 429 for quota failures', () => {
  const diagnostics = createStudioDiagnostics({
    success: false,
    provider: 'gemini',
    configured: true,
    error: '429 Resource exhausted',
  });

  assert.equal(resolveStudioHttpStatus(diagnostics), 429);
});
