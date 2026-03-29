import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applySavedPlanProgress,
  buildRoadmapRequestPayload,
  createSavedPlanSnapshot,
  upsertSavedPlanSnapshot
} from '../src/utils/aiLearningRoadmap.js';

test('buildRoadmapRequestPayload includes planId and normalizes form values', () => {
  const payload = buildRoadmapRequestPayload(
    {
      skill: '  React  ',
      learnerLevel: 'Intermediate',
      weeklyHours: '12',
      targetWeeks: '6',
      focusAreas: 'Portfolio, interview prep, ,  '
    },
    '  plan-123  '
  );

  assert.deepEqual(payload, {
    skill: 'React',
    learnerLevel: 'Intermediate',
    weeklyHours: 12,
    targetWeeks: 6,
    focusAreas: ['Portfolio', 'interview prep'],
    savePlan: true,
    planId: 'plan-123'
  });
});

test('createSavedPlanSnapshot and upsertSavedPlanSnapshot keep the saved plan list deduplicated', () => {
  const snapshot = createSavedPlanSnapshot({
    planId: 'plan-123',
    formState: {
      skill: 'React',
      learnerLevel: 'Intermediate',
      weeklyHours: 12,
      targetWeeks: 6,
      focusAreas: 'Portfolio, interview prep'
    },
    roadmap: {
      summary: 'A focused learning roadmap'
    },
    source: 'ai',
    provider: 'gemini',
    model: 'gemini-2.0-flash',
    completedStepIndexes: [2, 0, 2]
  });

  assert.equal(snapshot._id, 'plan-123');
  assert.equal(snapshot.progressPercentage, 0);
  assert.deepEqual(snapshot.completedStepIndexes, [0, 2]);
  assert.equal(snapshot.provider, 'gemini');
  assert.match(snapshot.updatedAt, /^\d{4}-\d{2}-\d{2}T/);

  const nextPlans = upsertSavedPlanSnapshot(
    [
      {
        _id: 'plan-123',
        skill: 'Old React',
        extraField: true
      },
      {
        _id: 'plan-456',
        skill: 'Next.js'
      }
    ],
    snapshot
  );

  assert.equal(nextPlans.length, 2);
  assert.equal(nextPlans[0]._id, 'plan-123');
  assert.equal(nextPlans[0].skill, 'React');
  assert.equal(nextPlans[0].extraField, true);
  assert.equal(nextPlans[1]._id, 'plan-456');
});

test('applySavedPlanProgress updates only the targeted saved plan snapshot', () => {
  const nextPlans = applySavedPlanProgress(
    [
      {
        _id: 'plan-123',
        completedStepIndexes: [],
        progressPercentage: 0
      },
      {
        _id: 'plan-456',
        completedStepIndexes: [0],
        progressPercentage: 50
      }
    ],
    'plan-123',
    [2, 0, 2],
    4
  );

  assert.deepEqual(nextPlans[0].completedStepIndexes, [0, 2]);
  assert.equal(nextPlans[0].progressPercentage, 50);
  assert.deepEqual(nextPlans[1].completedStepIndexes, [0]);
  assert.equal(nextPlans[1].progressPercentage, 50);
});
