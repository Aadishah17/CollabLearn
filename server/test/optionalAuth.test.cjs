const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const optionalAuth = require('../src/middleware/optionalAuth');
const User = require('../src/models/User');
const Admin = require('../src/models/Admin');

const originalJwtSecret = process.env.JWT_SECRET;

const withPatched = async (target, key, replacement, fn) => {
  const original = target[key];
  target[key] = replacement;

  try {
    return await fn();
  } finally {
    target[key] = original;
  }
};

const createFindByIdMock = (result) => () => ({
  select() {
    return Promise.resolve(result);
  },
});

test.after(() => {
  if (originalJwtSecret === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = originalJwtSecret;
  }
});

test('optionalAuth attaches user data when the bearer token is valid', async () => {
  process.env.JWT_SECRET = 'test-secret-for-optional-auth';
  const token = jwt.sign(
    { userId: 'user-123', email: 'learner@example.com' },
    process.env.JWT_SECRET
  );

  const req = {
    header(name) {
      return name === 'Authorization' ? `Bearer ${token}` : null;
    },
  };

  let nextCalled = false;
  await withPatched(
    User,
    'findById',
    createFindByIdMock({
      _id: 'user-123',
      email: 'learner@example.com',
      isActive: true,
    }),
    async () => {
      await withPatched(Admin, 'findById', createFindByIdMock(null), async () => {
        await optionalAuth(req, {}, () => {
          nextCalled = true;
        });
      });
    }
  );

  assert.equal(nextCalled, true);
  assert.equal(req.userId, 'user-123');
  assert.equal(req.userEmail, 'learner@example.com');
});

test('optionalAuth ignores invalid configuration and continues without auth context', () => {
  process.env.JWT_SECRET = 'your-secret-key-change-this';
  const token = jwt.sign({ userId: 'user-123' }, 'different-secret');

  const req = {
    header(name) {
      return name === 'Authorization' ? `Bearer ${token}` : null;
    },
  };

  let nextCalled = false;
  optionalAuth(req, {}, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.userId, undefined);
});
