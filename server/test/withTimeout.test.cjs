const test = require('node:test');
const assert = require('node:assert/strict');

const { TimeoutError, withTimeout } = require('../src/utils/withTimeout');

test('withTimeout resolves successful work before the timeout', async () => {
  const result = await withTimeout(
    () => Promise.resolve('ok'),
    { timeoutMs: 20, message: 'timed out' }
  );

  assert.equal(result, 'ok');
});

test('withTimeout rejects slow work with a TimeoutError', async () => {
  await assert.rejects(
    withTimeout(
      () => new Promise(() => {}),
      { timeoutMs: 20, message: 'timed out' }
    ),
    (error) => {
      assert.ok(error instanceof TimeoutError);
      assert.equal(error.message, 'timed out');
      assert.equal(error.code, 'timeout');
      return true;
    }
  );
});
