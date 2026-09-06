const test = require('node:test');
const assert = require('node:assert/strict');
const { StorageService } = require('../src/services/storageService');

test('StorageService: defaults to disk provider when no cloud credentials provided', () => {
  const service = new StorageService();
  assert.equal(service.getProviderName(), 'disk');
});

test('StorageService: saves buffer to local disk and returns structured metadata', async () => {
  const service = new StorageService();
  const testBuffer = Buffer.from('hello collablearn');

  const uploadResult = await service.upload({
    buffer: testBuffer,
    filename: 'test-avatar.png',
    mimetype: 'image/png',
    folder: 'avatars',
  });

  assert.equal(uploadResult.provider, 'disk');
  assert.equal(uploadResult.size, testBuffer.length);
  assert.equal(uploadResult.mimetype, 'image/png');
  assert.match(uploadResult.url, /^\/uploads\/avatars\//);
  assert.ok(uploadResult.key);

  // Clean up
  await service.delete(uploadResult.key, 'avatars', 'disk');
});
