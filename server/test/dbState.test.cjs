const test = require('node:test');
const assert = require('node:assert/strict');

test('Mongo connection state redacts password in health metadata', () => {
  const originalMongoUri = process.env.MONGODB_URI;

  process.env.MONGODB_URI =
    'mongodb+srv://user:super-secret@example.mongodb.net/collablearn?appName=Cluster0';

  delete require.cache[require.resolve('../src/db.js')];
  const { getMongoConnectionState } = require('../src/db.js');
  const state = getMongoConnectionState();

  assert.equal(state.mongoUri.includes('super-secret'), false);
  assert.match(state.mongoUri, /mongodb\+srv:\/\/user:\*\*\*@/);

  process.env.MONGODB_URI = originalMongoUri;
});
