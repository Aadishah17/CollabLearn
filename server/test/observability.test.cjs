const test = require('node:test');
const assert = require('node:assert/strict');
const {
  getSystemReadiness,
  logAiTelemetry,
  requestObservability,
} = require('../src/middleware/observability');

test('requestObservability assigns a unique X-Request-Id if none provided', () => {
  const req = {
    header: () => null,
    method: 'GET',
    url: '/api/health',
  };

  const headers = {};
  const res = {
    setHeader: (name, val) => {
      headers[name] = val;
    },
    on: () => {},
  };

  let nextCalled = false;
  requestObservability(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.ok(req.requestId);
  assert.equal(headers['X-Request-Id'], req.requestId);
});

test('requestObservability preserves existing incoming X-Request-Id', () => {
  const customId = 'custom-trace-id-12345';
  const req = {
    header: (name) => (name.toLowerCase() === 'x-request-id' ? customId : null),
    method: 'POST',
    url: '/api/auth/login',
  };

  const headers = {};
  const res = {
    setHeader: (name, val) => {
      headers[name] = val;
    },
    on: () => {},
  };

  requestObservability(req, res, () => {});

  assert.equal(req.requestId, customId);
  assert.equal(headers['X-Request-Id'], customId);
});

test('getSystemReadiness returns service status object', () => {
  const readiness = getSystemReadiness();
  assert.equal(typeof readiness.ready, 'boolean');
  assert.ok(readiness.services.mongodb);
  assert.ok(readiness.services.aiProvider);
});
