/**
 * Shared Model Schemas and Contracts for CollabLearn Web & Mobile
 */

const ROLES = ['user', 'mentor', 'admin'];
const LEARNER_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const MODULE_CONTENT_TYPES = ['richtext', 'pretext', 'video'];
const BOOKING_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];

const validateAuthLoginPayload = (payload = {}) => {
  const email = String(payload.email || '')
    .trim()
    .toLowerCase();
  const password = String(payload.password || '');
  if (!email || !email.includes('@')) {
    return { valid: false, error: 'Valid email address is required' };
  }
  if (!password || password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters' };
  }
  return { valid: true, data: { email, password, role: payload.role || 'user' } };
};

const validateRoadmapPayload = (payload = {}) => {
  const skill = String(payload.skill || '').trim();
  if (!skill) {
    return { valid: false, error: 'Skill is required' };
  }
  return {
    valid: true,
    data: {
      skill,
      learnerLevel: LEARNER_LEVELS.includes(payload.learnerLevel)
        ? payload.learnerLevel
        : 'Beginner',
      weeklyHours: Number(payload.weeklyHours) || 5,
      targetWeeks: Number(payload.targetWeeks) || 4,
      focusAreas: Array.isArray(payload.focusAreas) ? payload.focusAreas : [],
      savePlan: Boolean(payload.savePlan),
      planId: payload.planId || null,
    },
  };
};

const validateBookingPayload = (payload = {}) => {
  const { instructorId, skillId, date, startTime, endTime } = payload;
  if (!instructorId || !skillId || !date || !startTime || !endTime) {
    return {
      valid: false,
      error: 'instructorId, skillId, date, startTime, and endTime are required',
    };
  }
  return { valid: true, data: payload };
};

module.exports = {
  BOOKING_STATUSES,
  LEARNER_LEVELS,
  MODULE_CONTENT_TYPES,
  ROLES,
  validateAuthLoginPayload,
  validateBookingPayload,
  validateRoadmapPayload,
};
