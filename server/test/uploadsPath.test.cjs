const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const storageModulePath = require.resolve('../src/config/storage.js');

const withEnv = async (overrides, callback) => {
  const previous = {};

  for (const [key, value] of Object.entries(overrides)) {
    previous[key] = process.env[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  delete require.cache[storageModulePath];

  try {
    await callback(require('../src/config/storage.js'));
  } finally {
    delete require.cache[storageModulePath];

    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
};

test('storage paths switch to /tmp on Vercel', async () => {
  await withEnv(
    { VERCEL: '1' },
    ({ uploadsPath, avatarUploadsPath, sessionDocumentUploadsPath }) => {
      assert.equal(uploadsPath, path.join('/tmp', 'collablearn-uploads'));
      assert.equal(avatarUploadsPath, path.join('/tmp', 'collablearn-uploads', 'avatars'));
      assert.equal(
        sessionDocumentUploadsPath,
        path.join('/tmp', 'collablearn-uploads', 'session-documents')
      );
    }
  );
});

test('storage paths stay in the repo outside serverless runtimes', async () => {
  await withEnv({ VERCEL: undefined, NETLIFY: undefined }, ({ uploadsPath }) => {
    assert.match(uploadsPath, /server[\\/]uploads$/);
  });
});
