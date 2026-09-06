const test = require('node:test');
const assert = require('node:assert/strict');

test('Vercel API entrypoint exports a request handler', async () => {
  delete require.cache[require.resolve('../api/index.js')];
  const handler = require('../api/index.js');
  assert.equal(typeof handler, 'function');
});

test('Vercel API entrypoint initializes app before handling requests', async () => {
  const apiEntryPath = require.resolve('../api/index.js');
  const appModulePath = require.resolve('../src/index.js');
  const originalAppModule = require.cache[appModulePath];
  const calls = [];
  const stubHandler = (req, res) => {
    calls.push(`handler:${req.url}`);
    res.handled = true;
    return 'ok';
  };

  stubHandler.initializeApp = async () => {
    calls.push('init');
    return true;
  };

  delete require.cache[apiEntryPath];
  require.cache[appModulePath] = {
    id: appModulePath,
    filename: appModulePath,
    loaded: true,
    exports: stubHandler,
  };

  try {
    const handler = require('../api/index.js');
    const response = {};
    const result = await handler({ url: '/api/auth/login' }, response);

    assert.equal(result, 'ok');
    assert.equal(response.handled, true);
    assert.deepEqual(calls, ['init', 'handler:/api/auth/login']);
  } finally {
    delete require.cache[apiEntryPath];
    if (originalAppModule) {
      require.cache[appModulePath] = originalAppModule;
    } else {
      delete require.cache[appModulePath];
    }
  }
});

test('Vercel API entrypoint returns 503 when init fails outside health route', async () => {
  const apiEntryPath = require.resolve('../api/index.js');
  const appModulePath = require.resolve('../src/index.js');
  const originalAppModule = require.cache[appModulePath];
  const stubHandler = () => {
    throw new Error('App handler should not run when init fails');
  };
  const headers = {};
  let body = '';

  stubHandler.initializeApp = async () => null;

  delete require.cache[apiEntryPath];
  require.cache[appModulePath] = {
    id: appModulePath,
    filename: appModulePath,
    loaded: true,
    exports: stubHandler,
  };

  try {
    const handler = require('../api/index.js');
    await handler(
      { url: '/api/auth/login' },
      {
        setHeader(name, value) {
          headers[name] = value;
        },
        end(chunk) {
          body += chunk;
        },
      }
    );

    assert.equal(headers['Content-Type'], 'application/json; charset=utf-8');
    assert.match(body, /Database unavailable/i);
  } finally {
    delete require.cache[apiEntryPath];
    if (originalAppModule) {
      require.cache[appModulePath] = originalAppModule;
    } else {
      delete require.cache[appModulePath];
    }
  }
});
