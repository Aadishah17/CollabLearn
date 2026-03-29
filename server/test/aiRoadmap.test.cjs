const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const aiRoutes = require('../src/routes/ai');
const dashboardRoutes = require('../src/routes/dashboard');
const authMiddleware = require('../src/middleware/auth');
const aiController = require('../src/controllers/aiController');
const LearningPlan = require('../src/models/LearningPlan');

const originalJwtSecret = process.env.JWT_SECRET;

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

const createResponse = () => {
  const state = {
    statusCode: 200,
    jsonBody: null
  };

  const res = {
    status(code) {
      state.statusCode = code;
      return res;
    },
    json(body) {
      state.jsonBody = body;
      return res;
    }
  };

  return { res, state };
};

test.after(() => {
  if (originalJwtSecret === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = originalJwtSecret;
  }
});

test('POST /studio-test is protected by auth middleware', () => {
  const routeLayer = aiRoutes.stack.find(
    (layer) => layer.route?.path === '/studio-test' && layer.route.methods.post
  );

  assert.ok(routeLayer, 'Expected /studio-test route to be registered');
  assert.equal(routeLayer.route.stack[0].handle, authMiddleware);
  assert.equal(routeLayer.route.stack[1].handle, aiController.testStudioConnection);
});

test('dashboard router no longer exposes the debug test endpoint', () => {
  const testRoute = dashboardRoutes.stack.find((layer) => layer.route?.path === '/test');

  assert.equal(testRoute, undefined);
});

test('generateRoadmap updates an existing plan and normalizes fallback source values', async () => {
  await withEnv({ JWT_SECRET: 'test-roadmap-secret' }, async () => {
    const token = jwt.sign(
      { userId: 'user-123', email: 'learner@example.com' },
      process.env.JWT_SECRET
    );

    const req = {
      body: {
        skill: 'TypeScript',
        learnerLevel: 'Beginner',
        weeklyHours: 4,
        targetWeeks: 6,
        focusAreas: ['types', 'tooling'],
        savePlan: true,
        planId: '507f1f77bcf86cd799439011'
      },
      header(name) {
        return name === 'Authorization' ? `Bearer ${token}` : null;
      }
    };

    const { res, state } = createResponse();
    const existingPlan = {
      _id: '507f1f77bcf86cd799439011',
      async save() {
        this.saved = true;
        return this;
      }
    };

    await withPatched(LearningPlan, 'findOne', async (query) => {
      assert.deepEqual(query, {
        _id: '507f1f77bcf86cd799439011',
        user: 'user-123'
      });
      return existingPlan;
    }, async () => {
      await withPatched(LearningPlan, 'create', async () => {
        throw new Error('create should not be called when updating an existing plan');
      }, async () => {
        await aiController.generateRoadmap(req, res);
      });
    });

    assert.equal(state.statusCode, 200);
    assert.equal(state.jsonBody.success, true);
    assert.equal(state.jsonBody.source, 'fallback');
    assert.equal(state.jsonBody.savedPlanId, '507f1f77bcf86cd799439011');
    assert.equal(existingPlan.saved, true);
    assert.equal(existingPlan.source, 'fallback');
    assert.equal(existingPlan.skill, 'TypeScript');
    assert.equal(existingPlan.progressPercentage, 0);
    assert.deepEqual(existingPlan.completedStepIndexes, []);
  });
});
