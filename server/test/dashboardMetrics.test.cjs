const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildRecentActivity,
  buildStudentDetailsPayload,
  buildStudentSummaries,
  calculateAverageLearningProgress,
} = require('../src/utils/dashboardMetrics');

test('buildStudentSummaries returns deterministic progress and schedule data', () => {
  const now = new Date('2026-03-28T12:00:00.000Z');
  const teachingBookings = [
    {
      _id: 'booking-1',
      student: { _id: 'student-1', name: 'Ada Lovelace', email: 'ada@example.com' },
      skill: { name: 'React' },
      duration: 60,
      status: 'completed',
      date: '2026-03-20T10:00:00.000Z',
    },
    {
      _id: 'booking-2',
      student: { _id: 'student-1', name: 'Ada Lovelace', email: 'ada@example.com' },
      skill: { name: 'React' },
      duration: 90,
      status: 'confirmed',
      date: '2026-04-02T10:00:00.000Z',
    },
    {
      _id: 'booking-3',
      student: { _id: 'student-2', name: 'Grace Hopper', email: 'grace@example.com' },
      skill: { name: 'Node.js' },
      duration: 45,
      status: 'confirmed',
      date: '2026-04-05T15:00:00.000Z',
    },
  ];

  const studentSeekingSkills = [
    {
      user: 'student-1',
      name: 'React',
      seeking: { progress: 72, currentInstructor: { _id: 'teacher-1', name: 'Mentor One' } },
    },
  ];

  const summaries = buildStudentSummaries(teachingBookings, studentSeekingSkills, now);

  assert.equal(summaries.length, 2);
  assert.equal(summaries[0].student.name, 'Ada Lovelace');
  assert.equal(summaries[0].completedSessions, 1);
  assert.equal(summaries[0].upcomingSessions, 1);
  assert.equal(summaries[0].focusSkill.name, 'React');
  assert.equal(summaries[0].focusSkill.progress, 72);
  assert.equal(summaries[0].completionRate, 50);
  assert.deepEqual(summaries[0].sharedSkills, ['React']);
});

test('buildStudentDetailsPayload computes live metrics without mock values', () => {
  const now = new Date('2026-03-28T12:00:00.000Z');
  const payload = buildStudentDetailsPayload({
    student: {
      _id: 'student-1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      bio: 'Frontend learner',
      createdAt: '2025-01-10T00:00:00.000Z',
    },
    bookings: [
      {
        _id: 'booking-1',
        skill: { name: 'React' },
        duration: 60,
        status: 'completed',
        date: '2026-03-10T10:00:00.000Z',
        notes: 'Strong progress',
      },
      {
        _id: 'booking-2',
        skill: { name: 'React' },
        duration: 90,
        status: 'confirmed',
        date: '2026-04-01T10:00:00.000Z',
        notes: 'Next lesson',
      },
    ],
    learningSkills: [
      {
        _id: 'goal-1',
        name: 'React',
        seeking: { progress: 65, currentInstructor: { _id: 'teacher-1', name: 'Mentor One' } },
      },
    ],
    now,
  });

  assert.equal(payload.stats.totalSessions, 2);
  assert.equal(payload.stats.completedSessions, 1);
  assert.equal(payload.stats.upcomingSessions, 1);
  assert.equal(payload.stats.totalHours, 2.5);
  assert.equal(payload.stats.completionRate, 50);
  assert.equal(payload.learningGoals[0].progress, 65);
  assert.equal(payload.sessionHistory[0].id, 'booking-2');
});

test('buildRecentActivity reflects completed teaching and learning sessions', () => {
  const now = new Date('2026-03-28T12:00:00.000Z');
  const bookings = [
    {
      _id: 'booking-1',
      instructor: { _id: 'teacher-1', name: 'Mentor One' },
      student: { _id: 'student-1', name: 'Ada Lovelace' },
      skill: { name: 'React' },
      status: 'completed',
      date: '2026-03-20T10:00:00.000Z',
    },
    {
      _id: 'booking-2',
      instructor: { _id: 'mentor-2', name: 'Mentor Two' },
      student: { _id: 'teacher-1', name: 'Teacher User' },
      skill: { name: 'Node.js' },
      status: 'completed',
      date: '2026-03-18T10:00:00.000Z',
    },
  ];

  const activity = buildRecentActivity(bookings, 'teacher-1', now);

  assert.equal(activity.length, 2);
  assert.equal(activity[0].type, 'teaching_completed');
  assert.equal(activity[0].otherUser, 'Ada Lovelace');
  assert.equal(activity[1].type, 'learning_completed');
  assert.equal(activity[1].otherUser, 'Mentor Two');
});

test('calculateAverageLearningProgress returns a rounded average', () => {
  const average = calculateAverageLearningProgress([
    { seeking: { progress: 40 } },
    { seeking: { progress: 61 } },
    { seeking: { progress: 59 } },
  ]);

  assert.equal(average, 53);
});
