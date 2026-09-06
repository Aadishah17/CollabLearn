const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const db = require('../src/db');

const originalConnect = mongoose.connect;

test.after(() => {
  mongoose.connect = originalConnect;
});

test('connectDB reports a degraded state instead of exiting when Mongo is unavailable', async () => {
  mongoose.connect = async () => {
    throw new Error('Mongo is down');
  };

  const result = await db.connectDB({
    maxAttempts: 1,
    retryDelayMs: 1,
    maxRetryDelayMs: 1,
    logger: {
      info() {},
      warn() {},
      error() {},
    },
  });

  assert.equal(result, null);

  const state = db.getMongoConnectionState();
  assert.equal(state.status, 'degraded');
  assert.equal(state.lastError, 'Mongo is down');
  assert.equal(state.attempts, 1);
});

test('connectDB resolves to the active mongoose connection when Mongo is available', async () => {
  mongoose.connect = async () => mongoose.connection;

  const result = await db.connectDB({
    maxAttempts: 1,
    retryDelayMs: 1,
    maxRetryDelayMs: 1,
    logger: {
      info() {},
      warn() {},
      error() {},
    },
  });

  assert.equal(result, mongoose.connection);

  const state = db.getMongoConnectionState();
  assert.equal(state.status, 'connected');
  assert.equal(state.lastError, null);
});
