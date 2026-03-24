require('dotenv').config();

const mongoose = require('mongoose');
const { resolveMongoUri, buildMongoConnectOptions } = require('../src/db');
const User = require('../src/models/User');
const Skill = require('../src/models/Skill');
const Booking = require('../src/models/Booking');
const Post = require('../src/models/Post');
const LearningPlan = require('../src/models/LearningPlan');

const API_BASE_URL = String(process.env.API_BASE_URL || 'http://127.0.0.1:5001').replace(/\/$/, '');
const PASSWORD = 'TestPass123!';
const RUN_ID = `deep-${Date.now()}`;

const created = {
  userIds: [],
  skillIds: [],
  bookingIds: [],
  postIds: [],
  planIds: []
};

const notes = [];

const log = (message) => {
  console.log(`[deep-smoke] ${message}`);
};

const fail = (message, details) => {
  const error = new Error(message);
  error.details = details;
  throw error;
};

const request = async (path, { method = 'GET', token, body, expectedStatus, allowStatuses } = {}) => {
  const headers = {
    Accept: 'application/json'
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  const text = await response.text();
  let payload = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch (_error) {
      payload = text;
    }
  }

  const allowed = allowStatuses || (expectedStatus ? [expectedStatus] : [200]);
  if (!allowed.includes(response.status)) {
    fail(`Unexpected status for ${method} ${path}: ${response.status}`, payload);
  }

  return {
    status: response.status,
    payload
  };
};

const assert = (condition, message, details) => {
  if (!condition) {
    fail(message, details);
  }
};

const record = (label, value) => {
  notes.push(`${label}: ${value}`);
};

const cleanup = async () => {
  try {
    await mongoose.connect(resolveMongoUri(), buildMongoConnectOptions(resolveMongoUri()));

    if (created.planIds.length > 0) {
      await LearningPlan.deleteMany({ _id: { $in: created.planIds } });
    }

    if (created.postIds.length > 0) {
      await Post.deleteMany({ _id: { $in: created.postIds } });
    }

    if (created.bookingIds.length > 0) {
      await Booking.deleteMany({ _id: { $in: created.bookingIds } });
    }

    if (created.skillIds.length > 0) {
      await Skill.deleteMany({ _id: { $in: created.skillIds } });
    }

    if (created.userIds.length > 0) {
      await User.deleteMany({ _id: { $in: created.userIds } });
    }
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
};

async function main() {
  const mentorEmail = `${RUN_ID}-mentor@example.com`;
  const studentEmail = `${RUN_ID}-student@example.com`;
  const skillName = `Node API Smoke ${RUN_ID}`;

  log(`Base URL: ${API_BASE_URL}`);

  const health = await request('/api/health');
  assert(health.payload?.success === true, 'Health endpoint did not report success', health.payload);
  assert(health.payload?.dbStatus === 'connected', 'Database is not connected', health.payload);

  const studioStatus = await request('/api/ai/studio-status');
  assert(studioStatus.payload?.provider, 'AI status payload is missing provider', studioStatus.payload);
  record('ai_provider', studioStatus.payload.provider);
  record('ai_live_status', studioStatus.payload.liveStatus || 'unknown');

  const studioTest = await request('/api/ai/studio-test', {
    method: 'POST',
    allowStatuses: [200, 429]
  });
  record('ai_test_status', studioTest.status);
  if (studioTest.status === 429) {
    record('ai_test_note', 'quota limited');
  }

  const unauthorizedUsers = await request('/api/users', {
    allowStatuses: [401, 403]
  });
  assert([401, 403].includes(unauthorizedUsers.status), 'Unauthenticated /api/users should be blocked');

  const unauthorizedPost = await request('/api/posts', {
    method: 'POST',
    body: {
      title: 'Should fail',
      excerpt: 'Should fail'
    },
    allowStatuses: [401, 403]
  });
  assert([401, 403].includes(unauthorizedPost.status), 'Unauthenticated post creation should be blocked');

  const unauthorizedBooking = await request('/api/booking', {
    method: 'POST',
    body: {},
    allowStatuses: [401, 403]
  });
  assert([401, 403].includes(unauthorizedBooking.status), 'Unauthenticated booking creation should be blocked');

  const unauthorizedAiChat = await request('/api/ai/chat', {
    method: 'POST',
    body: { message: 'hello' },
    allowStatuses: [401, 403]
  });
  assert([401, 403].includes(unauthorizedAiChat.status), 'Unauthenticated AI chat should be blocked');

  const registerMentor = await request('/api/auth/register', {
    method: 'POST',
    expectedStatus: 201,
    body: {
      name: 'Deep Mentor',
      email: mentorEmail,
      password: PASSWORD
    }
  });
  const mentorToken = registerMentor.payload?.token;
  const mentorId = registerMentor.payload?.user?.id;
  assert(mentorToken && mentorId, 'Mentor registration did not return token/user', registerMentor.payload);
  created.userIds.push(mentorId);

  const registerStudent = await request('/api/auth/register', {
    method: 'POST',
    expectedStatus: 201,
    body: {
      name: 'Deep Student',
      email: studentEmail,
      password: PASSWORD
    }
  });
  const studentToken = registerStudent.payload?.token;
  const studentId = registerStudent.payload?.user?.id;
  assert(studentToken && studentId, 'Student registration did not return token/user', registerStudent.payload);
  created.userIds.push(studentId);

  const loginMentor = await request('/api/auth/login', {
    method: 'POST',
    body: {
      email: mentorEmail,
      password: PASSWORD,
      role: 'user'
    }
  });
  assert(loginMentor.payload?.success === true, 'Mentor login failed', loginMentor.payload);

  const me = await request('/api/auth/me', {
    token: mentorToken
  });
  assert(me.payload?.user?.email === mentorEmail, 'Authenticated profile lookup returned wrong user', me.payload);

  const users = await request('/api/users', {
    token: mentorToken
  });
  assert(Array.isArray(users.payload), 'Authenticated /api/users should return an array', users.payload);

  const messages = await request('/api/messages/smoke-chat', {
    token: mentorToken
  });
  assert(Array.isArray(messages.payload), 'Authenticated messages lookup should return an array', messages.payload);

  const addSkill = await request('/api/skills/offering', {
    method: 'POST',
    token: mentorToken,
    expectedStatus: 201,
    body: {
      name: skillName,
      level: 'Intermediate',
      description: 'Deep smoke mentor offering',
      category: 'Programming',
      duration: '1 hour',
      price: 0
    }
  });
  const skillId = addSkill.payload?.skill?._id;
  assert(skillId, 'Skill offering creation did not return skill id', addSkill.payload);
  created.skillIds.push(skillId);

  const postSkill = await request('/api/skills/post', {
    method: 'POST',
    token: mentorToken,
    body: {
      title: `Offer ${skillName}`,
      description: 'Deep smoke posted offering',
      skills: skillName,
      timePerHour: '1 hour',
      price: '0'
    }
  });
  assert(postSkill.payload?.success === true, 'Posting skill offering failed', postSkill.payload);

  const searchSkills = await request(`/api/skills/search?q=${encodeURIComponent(skillName)}&type=offering`);
  const foundSkill = Array.isArray(searchSkills.payload?.data)
    ? searchSkills.payload.data.find((item) => item && item._id === skillId)
    : null;
  assert(foundSkill, 'Posted skill was not returned by search', searchSkills.payload);

  const createBooking = await request('/api/booking', {
    method: 'POST',
    token: studentToken,
    expectedStatus: 201,
    body: {
      instructor: mentorId,
      student: studentId,
      skill: skillId,
      date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      duration: 60,
      notes: 'Deep smoke booking'
    }
  });
  const bookingId = createBooking.payload?.booking?._id;
  assert(bookingId, 'Booking creation did not return booking id', createBooking.payload);
  created.bookingIds.push(bookingId);

  const studentBookings = await request(`/api/booking/student/${studentId}`, {
    token: studentToken
  });
  assert(
    Array.isArray(studentBookings.payload?.bookings) &&
      studentBookings.payload.bookings.some((booking) => booking && booking._id === bookingId),
    'Student booking list is missing the new booking',
    studentBookings.payload
  );

  const instructorBookings = await request(`/api/booking/instructor/${mentorId}`, {
    token: mentorToken
  });
  assert(
    Array.isArray(instructorBookings.payload?.bookings) &&
      instructorBookings.payload.bookings.some((booking) => booking && booking._id === bookingId),
    'Instructor booking list is missing the new booking',
    instructorBookings.payload
  );

  const updateBooking = await request(`/api/booking/${bookingId}`, {
    method: 'PATCH',
    token: mentorToken,
    body: {
      status: 'confirmed'
    }
  });
  assert(updateBooking.payload?.booking?.status === 'confirmed', 'Booking status did not update', updateBooking.payload);

  const completeStudent = await request(`/api/booking/${bookingId}/complete`, {
    method: 'POST',
    token: studentToken,
    body: {
      rating: 5,
      review: 'Useful session',
      userType: 'student'
    }
  });
  assert(
    completeStudent.payload?.requiresOtherRating === true,
    'Student completion should wait for the other participant',
    completeStudent.payload
  );

  const completeMentor = await request(`/api/booking/${bookingId}/complete`, {
    method: 'POST',
    token: mentorToken,
    body: {
      rating: 5,
      review: 'Great learner',
      userType: 'instructor'
    }
  });
  assert(
    completeMentor.payload?.booking?.status === 'completed',
    'Booking should be marked completed after both ratings',
    completeMentor.payload
  );

  const sessionDetails = await request(`/api/booking/session/${bookingId}`, {
    token: mentorToken
  });
  assert(sessionDetails.payload?.session?._id === bookingId, 'Booking session lookup failed', sessionDetails.payload);

  const createPost = await request('/api/posts', {
    method: 'POST',
    token: mentorToken,
    expectedStatus: 201,
    body: {
      title: `Smoke Post ${RUN_ID}`,
      excerpt: 'Verifying authenticated community posting.',
      category: 'Testing',
      tags: ['qa', 'smoke']
    }
  });
  const postId = createPost.payload?._id;
  assert(postId, 'Post creation did not return a post id', createPost.payload);
  created.postIds.push(postId);
  assert(
    createPost.payload?.userId === mentorId,
    'Post ownership was not derived from the authenticated user',
    createPost.payload
  );

  const likePost = await request(`/api/posts/${postId}/like`, {
    method: 'POST',
    token: studentToken
  });
  assert(likePost.payload?.stats?.likes === 1, 'Post like did not increment correctly', likePost.payload);

  const commentPost = await request(`/api/posts/${postId}/comment`, {
    method: 'POST',
    token: studentToken,
    body: {
      text: 'Deep smoke comment'
    }
  });
  assert(commentPost.payload?.stats?.comments === 1, 'Post comment did not increment correctly', commentPost.payload);

  const listPosts = await request('/api/posts?page=1&limit=10');
  assert(
    Array.isArray(listPosts.payload?.posts) &&
      listPosts.payload.posts.some((post) => post && post._id === postId),
    'Post list is missing the new post',
    listPosts.payload
  );

  const roadmap = await request('/api/ai/roadmap', {
    method: 'POST',
    token: mentorToken,
    body: {
      skill: 'JavaScript Testing',
      learnerLevel: 'Beginner',
      weeklyHours: 4,
      targetWeeks: 6,
      focusAreas: ['API testing', 'debugging'],
      savePlan: true
    }
  });
  assert(roadmap.payload?.success === true, 'AI roadmap generation failed', roadmap.payload);
  assert(Array.isArray(roadmap.payload?.roadmap?.steps) && roadmap.payload.roadmap.steps.length > 0, 'AI roadmap returned no steps', roadmap.payload);
  if (roadmap.payload?.savedPlanId) {
    created.planIds.push(roadmap.payload.savedPlanId);
  }

  const plans = await request('/api/ai/plans', {
    token: mentorToken
  });
  assert(Array.isArray(plans.payload?.plans), 'Learning plans endpoint did not return plans', plans.payload);
  const savedPlan = Array.isArray(plans.payload?.plans)
    ? plans.payload.plans.find((plan) => String(plan._id) === String(roadmap.payload?.savedPlanId))
    : null;
  assert(savedPlan, 'Saved roadmap plan not found in plan list', plans.payload);

  const updateProgress = await request(`/api/ai/plans/${savedPlan._id}/progress`, {
    method: 'PATCH',
    token: mentorToken,
    body: {
      completedStepIndexes: [0]
    }
  });
  assert(updateProgress.payload?.progressPercentage >= 0, 'Learning progress update failed', updateProgress.payload);

  const deletePost = await request(`/api/posts/${postId}`, {
    method: 'DELETE',
    token: mentorToken
  });
  assert(deletePost.payload?.success === true, 'Post deletion failed', deletePost.payload);

  log('Deep API smoke test passed.');
  notes.forEach((entry) => console.log(`  - ${entry}`));
}

main()
  .catch(async (error) => {
    console.error('[deep-smoke] FAILURE:', error.message);
    if (error.details !== undefined) {
      console.error(JSON.stringify(error.details, null, 2));
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    await cleanup();
  });
