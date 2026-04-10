const test = require('node:test');
const assert = require('node:assert/strict');

const { getAiRequestProfile } = require('../src/utils/aiRequestProfiles');

test('roadmap profile trades creativity for reliability and stays under the browser budget', () => {
  const genericProfile = getAiRequestProfile('default', {
    defaultTimeoutMs: 9000,
    providerDefaultTemperature: 0.7,
    providerDefaultMaxOutputTokens: 2048
  });
  const roadmapProfile = getAiRequestProfile('roadmap', {
    defaultTimeoutMs: 9000,
    providerDefaultTemperature: 0.7,
    providerDefaultMaxOutputTokens: 2048
  });

  assert.equal(genericProfile.timeoutMs, 9000);
  assert.equal(genericProfile.temperature, 0.7);
  assert.equal(genericProfile.maxOutputTokens, 2048);

  assert.equal(roadmapProfile.timeoutMs, 12000);
  assert.equal(roadmapProfile.temperature, 0.35);
  assert.equal(roadmapProfile.maxOutputTokens, 1400);
  assert.equal(roadmapProfile.responseMimeType, 'application/json');
});

test('health-check profile is intentionally tiny for fast readiness checks', () => {
  const profile = getAiRequestProfile('health-check', {
    defaultTimeoutMs: 9000,
    providerDefaultTemperature: 0.7,
    providerDefaultMaxOutputTokens: 2048
  });

  assert.equal(profile.timeoutMs, 4000);
  assert.equal(profile.temperature, 0);
  assert.equal(profile.maxOutputTokens, 96);
});
