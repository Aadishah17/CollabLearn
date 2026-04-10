const test = require('node:test');
const assert = require('node:assert/strict');

const { createRateLimiter } = require('../src/middleware/rateLimit');

const makeResponse = () => {
  let statusCode = null;
  let payload = null;
  const headers = {};

  return {
    res: {
      setHeader(name, value) {
        headers[String(name).toLowerCase()] = value;
      },
      status(code) {
        statusCode = code;
        return {
          json(body) {
            payload = body;
          }
        };
      }
    },
    get statusCode() {
      return statusCode;
    },
    get payload() {
      return payload;
    },
    get headers() {
      return headers;
    }
  };
};

test('rate limiter blocks requests after the configured max', () => {
  let now = 0;
  const limiter = createRateLimiter({
    windowMs: 1000,
    max: 2,
    message: 'Too many requests.',
    nowProvider: () => now,
    keyGenerator: () => 'shared-key'
  });

  let nextCalls = 0;

  limiter({ ip: '127.0.0.1', baseUrl: '/api/auth' }, makeResponse().res, () => {
    nextCalls += 1;
  });
  limiter({ ip: '127.0.0.1', baseUrl: '/api/auth' }, makeResponse().res, () => {
    nextCalls += 1;
  });

  const blocked = makeResponse();
  limiter({ ip: '127.0.0.1', baseUrl: '/api/auth' }, blocked.res, () => {
    nextCalls += 1;
  });

  assert.equal(nextCalls, 2);
  assert.equal(blocked.statusCode, 429);
  assert.deepEqual(blocked.payload, {
    success: false,
    message: 'Too many requests.'
  });
});

test('rate limiter resets after the window expires', () => {
  let now = 0;
  const limiter = createRateLimiter({
    windowMs: 1000,
    max: 1,
    nowProvider: () => now,
    keyGenerator: () => 'shared-key'
  });

  let nextCalls = 0;
  limiter({ ip: '127.0.0.1', baseUrl: '/api/ai' }, { status() { throw new Error('should not block'); } }, () => {
    nextCalls += 1;
  });

  now = 1500;

  limiter({ ip: '127.0.0.1', baseUrl: '/api/ai' }, { status() { throw new Error('should not block'); } }, () => {
    nextCalls += 1;
  });

  assert.equal(nextCalls, 2);
});

test('rate limiter falls back to local counters when Redis is unavailable', async () => {
  let now = 0;
  const limiter = createRateLimiter({
    windowMs: 1000,
    max: 1,
    nowProvider: () => now,
    keyGenerator: () => 'shared-key',
    redisUrl: 'redis://127.0.0.1:1',
    logger: {
      warn() {},
      error() {},
      info() {}
    }
  });

  const first = makeResponse();
  let nextCalls = 0;

  await limiter({ ip: '127.0.0.1', baseUrl: '/api/auth' }, first.res, () => {
    nextCalls += 1;
  });

  const blocked = makeResponse();
  await limiter({ ip: '127.0.0.1', baseUrl: '/api/auth' }, blocked.res, () => {
    nextCalls += 1;
  });

  assert.equal(nextCalls, 1);
  assert.equal(blocked.statusCode, 429);
  assert.equal(blocked.payload.message, 'Too many requests. Please try again later.');
  assert.equal(blocked.headers['retry-after'], '1');
});
