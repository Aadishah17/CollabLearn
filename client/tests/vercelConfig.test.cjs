const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Vercel config supports SPA routes and backend proxy rewrites', () => {
  const configPath = path.join(__dirname, '..', 'vercel.json');
  const rawConfig = fs.readFileSync(configPath, 'utf8');
  const config = JSON.parse(rawConfig);

  assert.ok(Array.isArray(config.rewrites), 'rewrites array is required');
  assert.deepEqual(config.rewrites, [
    {
      source: '/api/(.*)',
      destination: 'https://collablearn-api.vercel.app/api/$1',
    },
    {
      source: '/uploads/(.*)',
      destination: 'https://collablearn-api.vercel.app/uploads/$1',
    },
    {
      source: '/(.*)',
      destination: '/index.html',
    },
  ]);
});
