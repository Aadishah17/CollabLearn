const test = require('node:test');
const assert = require('node:assert/strict');

const requireAdmin = require('../src/middleware/requireAdmin');

test('requireAdmin blocks non-admin requests', () => {
  const req = { userRole: 'user' };
  let statusCode = null;
  let payload = null;
  let nextCalled = false;

  const res = {
    status(code) {
      statusCode = code;
      return {
        json(body) {
          payload = body;
        },
      };
    },
  };

  requireAdmin(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(statusCode, 403);
  assert.deepEqual(payload, {
    success: false,
    message: 'Admin access required.',
  });
});

test('requireAdmin allows admin requests', () => {
  const req = { userRole: 'admin' };
  let nextCalled = false;

  requireAdmin(req, {}, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
});
