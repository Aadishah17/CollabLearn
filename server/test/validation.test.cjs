const test = require('node:test');
const assert = require('node:assert/strict');

const { validateBody, validateParams, schemas } = require('../src/middleware/validation');

const makeResponse = () => {
  let statusCode = null;
  let payload = null;

  return {
    res: {
      status(code) {
        statusCode = code;
        return {
          json(body) {
            payload = body;
          },
        };
      },
    },
    get statusCode() {
      return statusCode;
    },
    get payload() {
      return payload;
    },
  };
};

test('auth register validation trims and normalizes the payload', () => {
  const req = {
    body: {
      name: '  Amina  ',
      email: ' AMINA@Example.COM ',
      password: 'secret123',
    },
  };

  let nextCalled = false;
  const { res } = makeResponse();

  validateBody(schemas.auth.register)(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.deepEqual(req.body, {
    name: 'Amina',
    email: 'amina@example.com',
    password: 'secret123',
  });
});

test('booking validation coerces booking fields and preserves compatible types', () => {
  const req = {
    body: {
      instructor: '507f1f77bcf86cd799439011',
      student: '507f1f77bcf86cd799439012',
      skill: '507f1f77bcf86cd799439013',
      date: '2026-03-25T10:30:00.000Z',
      duration: '60',
      notes: '  Please focus on debugging  ',
    },
  };

  let nextCalled = false;
  const { res } = makeResponse();

  validateBody(schemas.booking.createBooking)(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.body.duration, 60);
  assert.ok(req.body.date instanceof Date);
  assert.equal(req.body.notes, 'Please focus on debugging');
});

test('validation middleware rejects invalid object ids with a consistent error shape', () => {
  const req = { params: { id: 'not-an-object-id' } };
  const blocked = makeResponse();

  validateParams(schemas.posts.postIdParam)(req, blocked.res, () => {
    throw new Error('should not continue');
  });

  assert.equal(blocked.statusCode, 400);
  assert.equal(blocked.payload.success, false);
  assert.equal(blocked.payload.message, 'Validation failed');
  assert.equal(blocked.payload.errors[0].field, 'id');
});

test('post validation trims tags and rejects missing required text', () => {
  const req = {
    body: {
      title: '  Shipping the beta  ',
      excerpt: '  A practical write-up on the release process.  ',
      tags: ['  launch  ', ' release ', 'launch', ''],
    },
  };

  let nextCalled = false;
  const { res } = makeResponse();

  validateBody(schemas.posts.createPost)(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.deepEqual(req.body.tags, ['launch', 'release']);
  assert.equal(req.body.title, 'Shipping the beta');
  assert.equal(req.body.excerpt, 'A practical write-up on the release process.');
});
