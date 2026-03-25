import test from 'node:test';
import assert from 'node:assert/strict';

import { requestJson } from '../src/services/apiClient.js';

const createLocalStorageMock = () => {
  const store = new Map();

  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    }
  };
};

const withEnvironment = async (callback) => {
  const originalLocalStorage = globalThis.localStorage;
  const originalFetch = globalThis.fetch;

  globalThis.localStorage = createLocalStorageMock();

  try {
    await callback();
  } finally {
    globalThis.localStorage = originalLocalStorage;
    globalThis.fetch = originalFetch;
  }
};

test('requestJson includes credentials and bearer auth when present', async () => {
  await withEnvironment(async () => {
    globalThis.localStorage.setItem('token', 'secret-token');

    let capturedRequest = null;
    globalThis.fetch = async (_url, options) => {
      capturedRequest = options;
      return {
        ok: true,
        headers: {
          get: () => 'application/json'
        },
        json: async () => ({ success: true, received: true }),
        text: async () => JSON.stringify({ success: true, received: true })
      };
    };

    const payload = await requestJson('/api/example', {
      method: 'POST',
      auth: true,
      body: { hello: 'world' }
    });

    assert.equal(payload.received, true);
    assert.equal(capturedRequest.credentials, 'include');
    assert.equal(capturedRequest.headers.Authorization, 'Bearer secret-token');
    assert.equal(capturedRequest.body, JSON.stringify({ hello: 'world' }));
  });
});

test('requestJson omits bearer auth when no token is stored', async () => {
  await withEnvironment(async () => {
    let capturedRequest = null;
    globalThis.fetch = async (_url, options) => {
      capturedRequest = options;
      return {
        ok: true,
        headers: {
          get: () => 'application/json'
        },
        json: async () => ({ success: true }),
        text: async () => JSON.stringify({ success: true })
      };
    };

    await requestJson('/api/example', { auth: true });

    assert.equal(capturedRequest.credentials, 'include');
    assert.equal(Object.hasOwn(capturedRequest.headers, 'Authorization'), false);
  });
});
