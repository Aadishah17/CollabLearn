import test from 'node:test';
import assert from 'node:assert/strict';

import { clearSession, hasStoredSession, persistSession } from '../src/utils/session.js';

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
    },
    clear() {
      store.clear();
    }
  };
};

const withStorage = (callback) => {
  const originalLocalStorage = globalThis.localStorage;
  const originalWindow = globalThis.window;

  globalThis.localStorage = createLocalStorageMock();
  globalThis.window = { dispatchEvent() {} };

  try {
    callback(globalThis.localStorage);
  } finally {
    globalThis.localStorage = originalLocalStorage;
    globalThis.window = originalWindow;
  }
};

test('persistSession marks the session active even when no token is returned', () => {
  withStorage((storage) => {
    persistSession({
      user: {
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        role: 'user'
      }
    });

    assert.equal(storage.getItem('sessionActive'), 'true');
    assert.equal(storage.getItem('authMode'), 'cookie');
    assert.equal(hasStoredSession(), true);
  });
});

test('clearSession removes both token and cookie session hints', () => {
  withStorage((storage) => {
    persistSession({
      token: 'token-value',
      user: {
        name: 'Grace Hopper',
        email: 'grace@example.com',
        role: 'admin'
      }
    });

    clearSession();

    assert.equal(storage.getItem('token'), null);
    assert.equal(storage.getItem('sessionActive'), null);
    assert.equal(storage.getItem('authMode'), null);
    assert.equal(hasStoredSession(), false);
  });
});
