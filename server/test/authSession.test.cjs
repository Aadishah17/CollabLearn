const test = require('node:test');
const assert = require('node:assert/strict');
const { after } = require('node:test');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const authConfig = require('../src/config/auth');
const auth = require('../src/middleware/auth');
const optionalAuth = require('../src/middleware/optionalAuth');
const authController = require('../src/controllers/authController');
const User = require('../src/models/User');
const Admin = require('../src/models/Admin');
const Setting = require('../src/models/Setting');

const originalEnv = {
  AUTH_COOKIE_NAME: process.env.AUTH_COOKIE_NAME,
  AUTH_COOKIE_DOMAIN: process.env.AUTH_COOKIE_DOMAIN,
  AUTH_COOKIE_MAX_AGE_MS: process.env.AUTH_COOKIE_MAX_AGE_MS,
  AUTH_COOKIE_PATH: process.env.AUTH_COOKIE_PATH,
  AUTH_COOKIE_SAMESITE: process.env.AUTH_COOKIE_SAMESITE,
  AUTH_COOKIE_SECURE: process.env.AUTH_COOKIE_SECURE,
  JWT_SECRET: process.env.JWT_SECRET,
  NODE_ENV: process.env.NODE_ENV
};

const restoreEnv = () => {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
};

const withEnv = async (overrides, fn) => {
  const previous = {};

  for (const [key, value] of Object.entries(overrides)) {
    previous[key] = process.env[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  try {
    return await fn();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
};

const withPatched = async (target, key, replacement, fn) => {
  const original = target[key];
  target[key] = replacement;

  try {
    return await fn();
  } finally {
    target[key] = original;
  }
};

const createFindByIdMock = (result) => () => ({
  select() {
    return Promise.resolve(result);
  }
});

const createResponse = () => {
  const state = {
    statusCode: 200,
    jsonBody: null,
    cookieArgs: null,
    clearCookieArgs: null
  };

  const res = {
    status(code) {
      state.statusCode = code;
      return res;
    },
    json(body) {
      state.jsonBody = body;
      return res;
    },
    cookie(...args) {
      state.cookieArgs = args;
      return res;
    },
    clearCookie(...args) {
      state.clearCookieArgs = args;
      return res;
    }
  };

  return { res, state };
};

test('resolveAuthCookieConfig honors env overrides', async () => {
  await withEnv(
    {
      AUTH_COOKIE_NAME: 'collab_session',
      AUTH_COOKIE_DOMAIN: 'example.com',
      AUTH_COOKIE_MAX_AGE_MS: '1234',
      AUTH_COOKIE_PATH: '/api',
      AUTH_COOKIE_SAMESITE: 'strict',
      AUTH_COOKIE_SECURE: 'false',
      NODE_ENV: 'development'
    },
    () => {
      const config = authConfig.resolveAuthCookieConfig();

      assert.equal(config.name, 'collab_session');
      assert.deepEqual(config.options, {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        path: '/api',
        domain: 'example.com',
        maxAge: 1234
      });
      assert.deepEqual(config.clearOptions, {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        path: '/api',
        domain: 'example.com'
      });
    }
  );
});

test('auth middleware prefers cookie auth but falls back to bearer tokens', async () => {
  await withEnv(
    {
      JWT_SECRET: 'test-secret',
      AUTH_COOKIE_NAME: 'collablearn_access_token'
    },
    async () => {
      const cookieToken = jwt.sign(
        { userId: 'cookie-user', email: 'cookie@example.com', role: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      const bearerToken = jwt.sign(
        { userId: 'bearer-user', email: 'bearer@example.com', role: 'admin', isSuperAdmin: true },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const req = {
        headers: {
          cookie: `collablearn_access_token=${cookieToken}`,
          authorization: `Bearer ${bearerToken}`
        },
        header(name) {
          return this.headers[String(name).toLowerCase()];
        }
      };

      let nextCalled = false;
      const { res } = createResponse();

      await withPatched(
        User,
        'findById',
        createFindByIdMock({
          _id: 'cookie-user',
          email: 'cookie@example.com',
          isActive: true
        }),
        async () => {
          await withPatched(Admin, 'findById', createFindByIdMock(null), async () => {
            await auth(req, res, () => {
              nextCalled = true;
            });
          });
        }
      );

      assert.equal(nextCalled, true);
      assert.equal(req.userId, 'cookie-user');
      assert.equal(req.userEmail, 'cookie@example.com');
      assert.equal(req.userRole, 'user');
      assert.equal(req.authSource, 'cookie');
    }
  );

  await withEnv(
    {
      JWT_SECRET: 'test-secret',
      AUTH_COOKIE_NAME: 'collablearn_access_token'
    },
    async () => {
      const bearerToken = jwt.sign(
        { userId: 'bearer-user', email: 'bearer@example.com', role: 'admin', isSuperAdmin: true },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const req = {
        headers: {
          cookie: 'collablearn_access_token=invalid-cookie-token',
          authorization: `Bearer ${bearerToken}`
        },
        header(name) {
          return this.headers[String(name).toLowerCase()];
        }
      };

      let nextCalled = false;
      const { res } = createResponse();

      await withPatched(User, 'findById', createFindByIdMock(null), async () => {
        await withPatched(
          Admin,
          'findById',
          createFindByIdMock({
            _id: 'bearer-user',
            email: 'bearer@example.com',
            isActive: true
          }),
          async () => {
            await auth(req, res, () => {
              nextCalled = true;
            });
          }
        );
      });

      assert.equal(nextCalled, true);
      assert.equal(req.userId, 'bearer-user');
      assert.equal(req.userEmail, 'bearer@example.com');
      assert.equal(req.userRole, 'admin');
      assert.equal(req.authSource, 'bearer');
    }
  );
});

test('optionalAuth accepts cookie sessions without forcing an error', async () => {
  await withEnv(
    {
      JWT_SECRET: 'test-secret',
      AUTH_COOKIE_NAME: 'collablearn_access_token'
    },
    async () => {
      const token = jwt.sign(
        { userId: 'opt-user', email: 'opt@example.com', role: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const req = {
        headers: {
          cookie: `collablearn_access_token=${token}`
        },
        header(name) {
          return this.headers[String(name).toLowerCase()];
        }
      };

      let nextCalled = false;

      await withPatched(
        User,
        'findById',
        createFindByIdMock({
          _id: 'opt-user',
          email: 'opt@example.com',
          isActive: true
        }),
        async () => {
          await withPatched(Admin, 'findById', createFindByIdMock(null), async () => {
            await optionalAuth(req, {}, () => {
              nextCalled = true;
            });
          });
        }
      );

      assert.equal(nextCalled, true);
      assert.equal(req.userId, 'opt-user');
      assert.equal(req.userEmail, 'opt@example.com');
      assert.equal(req.authSource, 'cookie');
    }
  );
});

test('auth middleware rejects tokens for deleted accounts with a 401', async () => {
  await withEnv(
    {
      JWT_SECRET: 'test-secret',
      AUTH_COOKIE_NAME: 'collablearn_access_token'
    },
    async () => {
      const token = jwt.sign(
        { userId: 'missing-user', email: 'missing@example.com', role: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const req = {
        headers: {
          authorization: `Bearer ${token}`
        },
        header(name) {
          return this.headers[String(name).toLowerCase()];
        }
      };

      let nextCalled = false;
      const { res, state } = createResponse();

      await withPatched(User, 'findById', createFindByIdMock(null), async () => {
        await withPatched(Admin, 'findById', createFindByIdMock(null), async () => {
          await auth(req, res, () => {
            nextCalled = true;
          });
        });
      });

      assert.equal(nextCalled, false);
      assert.equal(state.statusCode, 401);
      assert.deepEqual(state.jsonBody, {
        success: false,
        message: 'Session is no longer valid. Please login again.'
      });
    }
  );
});

test('login and logout use the httpOnly auth cookie', async () => {
  await withEnv(
    {
      JWT_SECRET: 'test-secret',
      AUTH_COOKIE_NAME: 'collablearn_access_token',
      AUTH_COOKIE_PATH: '/',
      AUTH_COOKIE_SAMESITE: 'lax',
      AUTH_COOKIE_SECURE: 'false'
    },
    async () => {
      const account = {
        _id: '66f000000000000000000001',
        email: 'learner@example.com',
        password: 'hashed-password',
        isActive: true,
        avatar: null,
        getAvatarUrl() {
          return 'https://example.com/avatar.png';
        }
      };

      const { res: loginRes, state: loginState } = createResponse();

      await withPatched(User, 'findOne', async () => account, async () => {
        await withPatched(Admin, 'findOne', async () => null, async () => {
          await withPatched(bcrypt, 'compare', async () => true, async () => {
            await authController.login(
              {
                body: {
                  email: 'learner@example.com',
                  password: 'correct-password'
                }
              },
              loginRes
            );
          });
        });
      });

      assert.equal(loginState.statusCode, 200);
      assert.equal(loginState.jsonBody.success, true);
      assert.equal(typeof loginState.jsonBody.token, 'string');
      assert.equal(loginState.jsonBody.token.split('.').length, 3);
      assert.equal(loginState.jsonBody.user.email, 'learner@example.com');
      assert.equal(loginState.cookieArgs[0], 'collablearn_access_token');
      assert.equal(loginState.cookieArgs[1], loginState.jsonBody.token);
      assert.deepEqual(loginState.cookieArgs[2], {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      const { res: logoutRes, state: logoutState } = createResponse();
      await authController.logout({}, logoutRes);

      assert.equal(logoutState.jsonBody.success, true);
      assert.equal(logoutState.clearCookieArgs[0], 'collablearn_access_token');
      assert.deepEqual(logoutState.clearCookieArgs[1], {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/'
      });
    }
  );
});

test('super admin login falls back to the matching user account when admin password does not match', async () => {
  await withEnv(
    {
      JWT_SECRET: 'test-secret',
      AUTH_COOKIE_NAME: 'collablearn_access_token',
      AUTH_COOKIE_PATH: '/',
      AUTH_COOKIE_SAMESITE: 'lax',
      AUTH_COOKIE_SECURE: 'false',
      SUPER_ADMIN_EMAILS: 'shahaadi285@gmail.com'
    },
    async () => {
      const userAccount = {
        _id: '66f000000000000000000010',
        email: 'shahaadi285@gmail.com',
        password: 'user-hash',
        isActive: true,
        name: 'Shahaadi',
        avatar: null,
        isPremium: false,
        getAvatarUrl() {
          return null;
        }
      };
      const adminAccount = {
        _id: '66f000000000000000000011',
        email: 'shahaadi285@gmail.com',
        password: 'admin-hash',
        isActive: true,
        createdAt: new Date('2026-01-01T00:00:00.000Z')
      };
      const compareCalls = [];
      const { res, state } = createResponse();

      await withPatched(Admin, 'findOne', async () => adminAccount, async () => {
        await withPatched(User, 'findOne', async () => userAccount, async () => {
          await withPatched(bcrypt, 'compare', async (plain, hashed) => {
            compareCalls.push([plain, hashed]);
            return hashed === 'user-hash';
          }, async () => {
            await authController.login(
              {
                body: {
                  email: 'shahaadi285@gmail.com',
                  password: 'correct-password',
                  role: 'admin'
                }
              },
              res
            );
          });
        });
      });

      assert.equal(state.statusCode, 200);
      assert.equal(state.jsonBody.success, true);
      assert.equal(state.jsonBody.user.email, 'shahaadi285@gmail.com');
      assert.equal(state.jsonBody.user.role, 'admin');
      assert.equal(state.jsonBody.user.isSuperAdmin, true);
      assert.equal(state.jsonBody.user.name, 'Shahaadi');
      assert.deepEqual(compareCalls, [
        ['correct-password', 'admin-hash'],
        ['correct-password', 'user-hash']
      ]);
    }
  );
});

test('register issues the same cookie-backed session as login', async () => {
  await withEnv(
    {
      JWT_SECRET: 'test-secret',
      AUTH_COOKIE_NAME: 'collablearn_access_token',
      AUTH_COOKIE_PATH: '/',
      AUTH_COOKIE_SAMESITE: 'lax',
      AUTH_COOKIE_SECURE: 'false'
    },
    async () => {
      const { res, state } = createResponse();

      await withPatched(User, 'findOne', async () => null, async () => {
        await withPatched(User.prototype, 'save', async function saveUser() {
          this._id = this._id || '66f000000000000000000002';
          return this;
        }, async () => {
          await withPatched(Setting, 'findOne', async () => ({
            select() {
              return this;
            },
            lean() {
              return Promise.resolve({ minPasswordLength: 6 });
            }
          }), async () => {
            await authController.register(
              {
                body: {
                  name: 'New Learner',
                  email: 'new-learner@example.com',
                  password: 'secret123'
                }
              },
              res
            );
          });
        });
      });

      assert.equal(state.statusCode, 201);
      assert.equal(state.jsonBody.success, true);
      assert.equal(state.jsonBody.user.email, 'new-learner@example.com');
      assert.equal(typeof state.jsonBody.token, 'string');
      assert.equal(state.cookieArgs[0], 'collablearn_access_token');
      assert.equal(state.cookieArgs[1], state.jsonBody.token);
    }
  );
});

after(() => {
  restoreEnv();
});
