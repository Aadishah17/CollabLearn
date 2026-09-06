const test = require('node:test');
const assert = require('node:assert/strict');
const { AIPipelineService, aiPipelineService } = require('../src/services/aiPipelineService');

test('AIPipelineService: validateInput rejects invalid inputs and sanitizes roadmap parameters', () => {
  const pipeline = new AIPipelineService();

  assert.throws(() => pipeline.validateInput('roadmap', {}), {
    message: 'Skill or topic is required for roadmap generation',
  });

  assert.throws(() => pipeline.validateInput('roadmap', { skill: 'React', weeklyHours: -2 }), {
    message: 'weeklyHours must be a positive number',
  });

  const valid = pipeline.validateInput('roadmap', {
    skill: ' Python ',
    learnerLevel: 'Advanced',
    weeklyHours: 10,
    targetWeeks: 8,
    focusAreas: ['FastAPI', 'Pandas'],
    savePlan: true,
  });

  assert.equal(valid.skill, 'Python');
  assert.equal(valid.learnerLevel, 'Advanced');
  assert.equal(valid.weeklyHours, 10);
  assert.equal(valid.targetWeeks, 8);
  assert.deepEqual(valid.focusAreas, ['FastAPI', 'Pandas']);
  assert.equal(valid.savePlan, true);
});

test('AIPipelineService: buildPrompt produces structured instructions for roadmap and chat', () => {
  const pipeline = new AIPipelineService();

  const prompt = pipeline.buildPrompt('roadmap', {
    skill: 'Go Programming',
    learnerLevel: 'Beginner',
    weeklyHours: 5,
    targetWeeks: 4,
    focusAreas: ['Goroutines'],
  });

  assert.match(prompt, /Go Programming/);
  assert.match(prompt, /Goroutines/);
  assert.match(prompt, /Return ONLY valid, parseable JSON/);
});

test('AIPipelineService: validateStructuredOutput parses json and strips markdown fences', () => {
  const pipeline = new AIPipelineService();

  const rawJson = '```json\n{"title": "Test Path", "milestones": []}\n```';
  const parsed = pipeline.validateStructuredOutput('roadmap', rawJson);
  assert.equal(parsed.title, 'Test Path');
  assert.deepEqual(parsed.milestones, []);
});

test('AIPipelineService: normalizeResponse standardizes milestones and fallback metadata', () => {
  const pipeline = new AIPipelineService();

  const normalized = pipeline.normalizeResponse(
    'roadmap',
    {
      title: 'Docker Masterclass',
      milestones: [
        {
          title: 'Containers 101',
          keyTopics: ['images', 'layers'],
          practiceTasks: ['docker run'],
        },
      ],
    },
    { skill: 'Docker' }
  );

  assert.equal(normalized.title, 'Docker Masterclass');
  assert.equal(normalized.milestones.length, 1);
  assert.equal(normalized.milestones[0].milestoneNumber, 1);
  assert.equal(normalized.milestones[0].title, 'Containers 101');
});

test('AIPipelineService: executePipeline runs complete workflow with fallback when provider fails', async () => {
  const pipeline = new AIPipelineService();

  const result = await pipeline.executePipeline({
    type: 'roadmap',
    payload: {
      skill: 'Kubernetes',
      learnerLevel: 'Intermediate',
    },
    providerFn: async () => {
      throw new Error('Remote AI provider offline');
    },
    fallbackFn: async (input) => ({
      title: `${input.skill} Core Curriculum`,
      description: 'Heuristic roadmap generator',
      milestones: [
        {
          title: 'Pods & Services',
          summary: 'K8s primitives',
          keyTopics: ['pods', 'deployments'],
          practiceTasks: ['kubectl apply'],
        },
      ],
    }),
  });

  assert.equal(result.success, true);
  assert.equal(result.source, 'fallback');
  assert.equal(result.data.title, 'Kubernetes Core Curriculum');
  assert.equal(result.data.milestones.length, 1);
  assert.equal(result.data.milestones[0].title, 'Pods & Services');
});
