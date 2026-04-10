const normalizeNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeFocusAreas = (focusAreas) =>
  String(focusAreas || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const normalizePlanId = (planId) => {
  const value = String(planId || '').trim();
  return value || null;
};

export const buildRoadmapRequestPayload = (formState, savedPlanId = null) => {
  const payload = {
    skill: String(formState?.skill || '').trim(),
    learnerLevel: formState?.learnerLevel || 'Beginner',
    weeklyHours: normalizeNumber(formState?.weeklyHours, 6),
    targetWeeks: normalizeNumber(formState?.targetWeeks, 8),
    focusAreas: normalizeFocusAreas(formState?.focusAreas),
    savePlan: true
  };

  const normalizedPlanId = normalizePlanId(savedPlanId);
  if (normalizedPlanId) {
    payload.planId = normalizedPlanId;
  }

  return payload;
};

export const createSavedPlanSnapshot = ({
  planId,
  formState,
  roadmap,
  source = null,
  provider = null,
  model = null,
  completedStepIndexes = []
}) => {
  const normalizedPlanId = normalizePlanId(planId);
  if (!normalizedPlanId) {
    return null;
  }

  const normalizedStepIndexes = Array.from(
    new Set(
      completedStepIndexes
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value >= 0)
    )
  ).sort((a, b) => a - b);

  return {
    _id: normalizedPlanId,
    skill: String(formState?.skill || '').trim(),
    learnerLevel: formState?.learnerLevel || 'Beginner',
    weeklyHours: normalizeNumber(formState?.weeklyHours, 6),
    targetWeeks: normalizeNumber(formState?.targetWeeks, 8),
    focusAreas: normalizeFocusAreas(formState?.focusAreas),
    plan: roadmap || null,
    completedStepIndexes: normalizedStepIndexes,
    progressPercentage: 0,
    source: source || 'fallback',
    provider: provider || (source === 'ai' ? 'local-basic-engine' : 'fallback'),
    model: model || null,
    updatedAt: new Date().toISOString()
  };
};

export const upsertSavedPlanSnapshot = (savedPlans, nextPlan) => {
  if (!nextPlan?._id) {
    return savedPlans;
  }

  const nextPlanId = String(nextPlan._id);
  const existingPlan = savedPlans.find((plan) => String(plan?._id) === nextPlanId);

  return [
    {
      ...(existingPlan || {}),
      ...nextPlan
    },
    ...savedPlans.filter((plan) => String(plan?._id) !== nextPlanId)
  ];
};

export const applySavedPlanProgress = (savedPlans, planId, completedStepIndexes, totalSteps) => {
  const normalizedPlanId = normalizePlanId(planId);
  if (!normalizedPlanId) {
    return savedPlans;
  }

  const normalizedStepIndexes = Array.from(
    new Set(
      (Array.isArray(completedStepIndexes) ? completedStepIndexes : [])
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value >= 0)
    )
  ).sort((a, b) => a - b);

  const safeTotalSteps = Math.max(0, Number(totalSteps) || 0);
  const progressPercentage =
    safeTotalSteps > 0
      ? Math.round((normalizedStepIndexes.length / safeTotalSteps) * 100)
      : 0;

  return savedPlans.map((plan) =>
    String(plan?._id) === normalizedPlanId
      ? {
          ...plan,
          completedStepIndexes: normalizedStepIndexes,
          progressPercentage
        }
      : plan
  );
};
