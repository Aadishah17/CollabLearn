const mongoose = require('mongoose');

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
const SKILL_DURATIONS = ['30 minutes', '1 hour', '1.5 hours', '2 hours', '2.5 hours', '3 hours'];
const SKILL_CATEGORIES = [
  'Programming',
  'Design',
  'Data Science',
  'Marketing',
  'Language',
  'Music',
  'Art',
  'Business',
  'Writing',
  'Photography',
  'Fitness',
  'Cooking',
  'Drawing',
  'Art & Craft',
  'Cybersecurity',
  'Quality Assurance',
  'Academics',
  'Lifestyle',
  'Gaming',
  'Other'
];
const BOOKING_STATUSES = ['pending', 'confirmed', 'cancelled', 'ongoing', 'completed'];
const PARTICIPANT_ROLES = ['student', 'instructor'];

const isPlainObject = (value) =>
  Object.prototype.toString.call(value) === '[object Object]';

const validators = {
  string(options = {}) {
    return { type: 'string', ...options };
  },

  number(options = {}) {
    return { type: 'number', ...options };
  },

  boolean(options = {}) {
    return { type: 'boolean', ...options };
  },

  date(options = {}) {
    return { type: 'date', ...options };
  },

  objectId(options = {}) {
    return { type: 'objectId', ...options };
  },

  array(options = {}) {
    return { type: 'array', ...options };
  },

  mixed(options = {}) {
    return { type: 'mixed', ...options };
  },

  oneOf(values, options = {}) {
    return { type: 'enum', values, ...options };
  }
};

const createError = (location, field, message) => ({
  location,
  field,
  message
});

const skipOptionalValue = (rule, value) => {
  if (rule.required) {
    return false;
  }

  return value === undefined || value === null;
};

const validateString = (value, rule, location, field) => {
  if (value === undefined || value === null) {
    return { skip: true };
  }

  let nextValue = value;
  if (typeof nextValue !== 'string') {
    if (rule.coerce === false) {
      return {
        error: createError(location, field, 'must be a string')
      };
    }

    if (['number', 'boolean', 'bigint'].includes(typeof nextValue)) {
      nextValue = String(nextValue);
    } else {
      return {
        error: createError(location, field, 'must be a string')
      };
    }
  }

  if (rule.trim !== false) {
    nextValue = nextValue.trim();
  }

  if (nextValue.length === 0) {
    return rule.allowEmpty
      ? { value: '' }
      : rule.required
        ? { error: createError(location, field, 'is required') }
        : { skip: true };
  }

  if (typeof rule.minLength === 'number' && nextValue.length < rule.minLength) {
    return {
      error: createError(location, field, `must be at least ${rule.minLength} characters long`)
    };
  }

  if (typeof rule.maxLength === 'number' && nextValue.length > rule.maxLength) {
    return {
      error: createError(location, field, `must be at most ${rule.maxLength} characters long`)
    };
  }

  if (rule.pattern && !rule.pattern.test(nextValue)) {
    return {
      error: createError(location, field, 'has an invalid format')
    };
  }

  if (Array.isArray(rule.values) && rule.values.length > 0 && !rule.values.includes(nextValue)) {
    return {
      error: createError(location, field, `must be one of: ${rule.values.join(', ')}`)
    };
  }

  if (typeof rule.transform === 'function') {
    nextValue = rule.transform(nextValue, { location, field });
  }

  return { value: nextValue };
};

const validateNumber = (value, rule, location, field) => {
  if (value === undefined || value === null) {
    return { skip: true };
  }

  let nextValue = value;
  if (typeof nextValue === 'string') {
    nextValue = nextValue.trim();
  }

  if (typeof nextValue === 'string' && nextValue.length === 0) {
    return rule.required
      ? { error: createError(location, field, 'is required') }
      : { skip: true };
  }

  if (typeof nextValue === 'boolean') {
    nextValue = Number(nextValue);
  }

  if (typeof nextValue !== 'number') {
    nextValue = Number(nextValue);
  }

  if (!Number.isFinite(nextValue)) {
    return {
      error: createError(location, field, 'must be a valid number')
    };
  }

  if (rule.integer && !Number.isInteger(nextValue)) {
    return {
      error: createError(location, field, 'must be an integer')
    };
  }

  if (typeof rule.min === 'number' && nextValue < rule.min) {
    return {
      error: createError(location, field, `must be greater than or equal to ${rule.min}`)
    };
  }

  if (typeof rule.max === 'number' && nextValue > rule.max) {
    return {
      error: createError(location, field, `must be less than or equal to ${rule.max}`)
    };
  }

  return { value: nextValue };
};

const validateBoolean = (value, rule, location, field) => {
  if (value === undefined || value === null) {
    return { skip: true };
  }

  if (typeof value === 'boolean') {
    return { value };
  }

  if (typeof value === 'number') {
    if (value === 1) return { value: true };
    if (value === 0) return { value: false };
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      return rule.required
        ? { error: createError(location, field, 'is required') }
        : { skip: true };
    }

    if (['true', '1', 'yes', 'on'].includes(normalized)) {
      return { value: true };
    }

    if (['false', '0', 'no', 'off'].includes(normalized)) {
      return { value: false };
    }
  }

  return {
    error: createError(location, field, 'must be a boolean value')
  };
};

const validateDate = (value, rule, location, field) => {
  if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
    return { skip: true };
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return { value };
  }

  const nextValue = new Date(value);
  if (Number.isNaN(nextValue.getTime())) {
    return {
      error: createError(location, field, 'must be a valid date')
    };
  }

  return { value: nextValue };
};

const validateObjectId = (value, rule, location, field) => {
  if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
    return { skip: true };
  }

  const nextValue = String(value).trim();
  if (!nextValue) {
    return rule.required
      ? { error: createError(location, field, 'is required') }
      : { skip: true };
  }

  if (!mongoose.Types.ObjectId.isValid(nextValue)) {
    return {
      error: createError(location, field, 'must be a valid ObjectId')
    };
  }

  return { value: nextValue };
};

const validateArray = (value, rule, location, field) => {
  if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
    return { skip: true };
  }

  if (!Array.isArray(value)) {
    return {
      error: createError(location, field, 'must be an array')
    };
  }

  const items = [];
  for (let index = 0; index < value.length; index += 1) {
    const rawItem = value[index];
    if (!rule.item) {
      items.push(rawItem);
      continue;
    }

    const result = validateValue(rawItem, rule.item, location, `${field}[${index}]`);
    if (result.error) {
      return { error: result.error };
    }

    if (result.skip) {
      continue;
    }

    items.push(result.value);
  }

  if (typeof rule.minItems === 'number' && items.length < rule.minItems) {
    return {
      error: createError(location, field, `must contain at least ${rule.minItems} items`)
    };
  }

  if (typeof rule.maxItems === 'number' && items.length > rule.maxItems) {
    return {
      error: createError(location, field, `must contain at most ${rule.maxItems} items`)
    };
  }

  if (rule.unique) {
    const seen = new Set();
    const uniqueItems = [];
    for (const item of items) {
      const key = typeof item === 'string' ? item : JSON.stringify(item);
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      uniqueItems.push(item);
    }
    return { value: uniqueItems };
  }

  return { value: items };
};

const validateMixed = (value, rule, location, field) => {
  if (value === undefined || value === null) {
    return rule.required
      ? { error: createError(location, field, 'is required') }
      : { skip: true };
  }

  if (typeof rule.predicate === 'function' && !rule.predicate(value)) {
    return {
      error: createError(location, field, rule.message || 'is invalid')
    };
  }

  if (typeof rule.transform === 'function') {
    return { value: rule.transform(value, { location, field }) };
  }

  return { value };
};

const validateEnum = (value, rule, location, field) => {
  if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
    return { skip: true };
  }

  const normalized = typeof value === 'string' ? value.trim() : String(value).trim();
  if (!normalized) {
    return rule.required
      ? { error: createError(location, field, 'is required') }
      : { skip: true };
  }

  if (!rule.values.includes(normalized)) {
    return {
      error: createError(location, field, `must be one of: ${rule.values.join(', ')}`)
    };
  }

  return { value: normalized };
};

function validateValue(value, rule, location, field) {
  const nextRule = rule || validators.mixed();

  switch (nextRule.type) {
    case 'string':
      return validateString(value, nextRule, location, field);
    case 'number':
      return validateNumber(value, nextRule, location, field);
    case 'boolean':
      return validateBoolean(value, nextRule, location, field);
    case 'date':
      return validateDate(value, nextRule, location, field);
    case 'objectId':
      return validateObjectId(value, nextRule, location, field);
    case 'array':
      return validateArray(value, nextRule, location, field);
    case 'enum':
      return validateEnum(value, nextRule, location, field);
    case 'mixed':
    default:
      return validateMixed(value, nextRule, location, field);
  }
}

function validateLocation(location, schema = {}) {
  return (req, res, next) => {
    const source = isPlainObject(req[location]) ? req[location] : {};
    const normalized = { ...source };
    const errors = [];

    for (const [field, rule] of Object.entries(schema)) {
      const result = validateValue(source[field], rule, location, field);
      if (result.error) {
        errors.push(result.error);
        continue;
      }

      if (result.skip) {
        delete normalized[field];
        continue;
      }

      normalized[field] = result.value;
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    req[location] = normalized;
    return next();
  };
}

const validateBody = (schema) => validateLocation('body', schema);
const validateParams = (schema) => validateLocation('params', schema);
const validateQuery = (schema) => validateLocation('query', schema);

const schemas = {
  auth: {
    register: {
      name: validators.string({ required: true, minLength: 2, maxLength: 50 }),
      email: validators.string({
        required: true,
        maxLength: 254,
        transform: (value) => value.toLowerCase(),
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      }),
      password: validators.string({ required: true, minLength: 6, maxLength: 128 })
    },
    login: {
      email: validators.string({
        required: true,
        maxLength: 254,
        transform: (value) => value.toLowerCase(),
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      }),
      password: validators.string({ required: true, minLength: 1, maxLength: 128 }),
      role: validators.oneOf(['user', 'admin'])
    },
    googleLogin: {
      token: validators.string({ required: true, minLength: 1, maxLength: 8192 })
    },
    updateProfile: {
      name: validators.string({ minLength: 2, maxLength: 50 }),
      bio: validators.string({ maxLength: 500, allowEmpty: true }),
      avatar: validators.mixed(),
      isPremium: validators.boolean()
    },
    userIdParam: {
      userId: validators.objectId({ required: true })
    }
  },

  skills: {
    skillIdParam: {
      skillId: validators.objectId({ required: true })
    },
    postSkill: {
      title: validators.string({ required: true, minLength: 1, maxLength: 140 }),
      description: validators.string({ required: true, minLength: 1, maxLength: 300 }),
      skills: validators.string({ required: true, minLength: 1, maxLength: 50 }),
      timePerHour: validators.oneOf(SKILL_DURATIONS),
      price: validators.string({ maxLength: 32 }),
      subCategory: validators.string({ maxLength: 100 })
    },
    addOffering: {
      name: validators.string({ required: true, minLength: 1, maxLength: 50 }),
      level: validators.oneOf(SKILL_LEVELS),
      description: validators.string({ maxLength: 300, allowEmpty: true }),
      category: validators.oneOf(SKILL_CATEGORIES),
      subCategory: validators.string({ maxLength: 100, allowEmpty: true }),
      tags: validators.array({
        item: validators.string({ maxLength: 32 }),
        maxItems: 12,
        unique: true
      }),
      duration: validators.oneOf(SKILL_DURATIONS),
      price: validators.number({ min: 0, max: 100000, integer: false })
    },
    updateOffering: {
      level: validators.oneOf(SKILL_LEVELS),
      description: validators.string({ maxLength: 300, allowEmpty: true }),
      duration: validators.oneOf(SKILL_DURATIONS),
      price: validators.number({ min: 0, max: 100000, integer: false })
    },
    addSeeking: {
      name: validators.string({ required: true, minLength: 1, maxLength: 50 }),
      preferredSchedule: validators.array({
        item: validators.mixed({
          predicate: isPlainObject,
          message: 'must be a plain object'
        }),
        maxItems: 14
      }),
      category: validators.oneOf(SKILL_CATEGORIES),
      subCategory: validators.string({ maxLength: 100, allowEmpty: true }),
      tags: validators.array({
        item: validators.string({ maxLength: 32 }),
        maxItems: 12,
        unique: true
      })
    },
    updateSeeking: {
      progress: validators.number({ integer: true, min: 0, max: 100 }),
      preferredSchedule: validators.array({
        item: validators.mixed({
          predicate: isPlainObject,
          message: 'must be a plain object'
        }),
        maxItems: 14
      })
    }
  },

  posts: {
    postIdParam: {
      id: validators.objectId({ required: true })
    },
    createPost: {
      title: validators.string({ required: true, minLength: 1, maxLength: 140 }),
      excerpt: validators.string({ required: true, minLength: 1, maxLength: 2400 }),
      category: validators.string({ maxLength: 80 }),
      tags: validators.array({
        item: validators.string({ maxLength: 32 }),
        maxItems: 8,
        unique: true
      })
    },
    comment: {
      text: validators.string({ required: true, minLength: 1, maxLength: 1200 })
    }
  },

  booking: {
    bookingIdParam: {
      id: validators.objectId({ required: true })
    },
    documentIdParam: {
      docId: validators.objectId({ required: true })
    },
    documentIndexParam: {
      docIndex: validators.number({ required: true, integer: true, min: 0 })
    },
    createBooking: {
      instructor: validators.objectId({ required: true }),
      student: validators.objectId({ required: true }),
      skill: validators.objectId({ required: true }),
      date: validators.date({ required: true }),
      duration: validators.number({ required: true, integer: true, min: 1, max: 24 * 60 }),
      notes: validators.string({ maxLength: 2000, allowEmpty: true })
    },
    updateStatus: {
      status: validators.oneOf(BOOKING_STATUSES)
    },
    uploadDocument: {
      title: validators.string({ maxLength: 255 }),
      uploadedBy: validators.oneOf(PARTICIPANT_ROLES)
    },
    completeSession: {
      completedBy: validators.oneOf(PARTICIPANT_ROLES),
      rating: validators.number({ integer: true, min: 1, max: 5 }),
      review: validators.string({ maxLength: 2000, allowEmpty: true })
    },
    completeBooking: {
      userType: validators.oneOf(PARTICIPANT_ROLES),
      rating: validators.number({ required: true, integer: true, min: 1, max: 5 }),
      review: validators.string({ maxLength: 2000, allowEmpty: true }),
      forceComplete: validators.boolean()
    },
    completeCourse: {
      skillId: validators.objectId({ required: true }),
      userId: validators.objectId({ required: true }),
      rating: validators.number({ required: true, integer: true, min: 1, max: 5 }),
      review: validators.string({ maxLength: 2000, allowEmpty: true })
    },
    sessionCount: {
      current: validators.number({ required: true, integer: true, min: 0 }),
      total: validators.number({ required: true, integer: true, min: 1 })
    }
  }
};

module.exports = {
  validators,
  validateBody,
  validateParams,
  validateQuery,
  validateRequest: validateLocation,
  schemas
};
