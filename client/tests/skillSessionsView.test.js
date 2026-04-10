import test from 'node:test';
import assert from 'node:assert/strict';

import { deriveSkillSessionView } from '../src/utils/skillSessionsView.js';

const fixedNow = new Date('2026-03-28T00:00:00.000Z');

const createBooking = ({
  id,
  skillId = 'skill-1',
  skillName = 'React',
  date,
  status = 'pending',
  duration = 60,
  student = { _id: 'student-1', name: 'Student One' },
  instructor = { _id: 'instructor-1', name: 'Instructor One' },
  sessionDocuments = [],
}) => ({
  _id: id,
  date,
  status,
  duration,
  student,
  instructor,
  skill: {
    _id: skillId,
    name: skillName,
  },
  sessionDocuments,
});

test('deriveSkillSessionView prefers instructor-side bookings for the selected skill', () => {
  const bookings = [
    createBooking({
      id: 'other-skill',
      skillId: 'skill-2',
      date: '2026-04-12T10:00:00.000Z',
    }),
    createBooking({
      id: 'later-session',
      date: '2026-04-12T10:00:00.000Z',
      student: { _id: 'student-2', name: 'Student Two' },
    }),
    createBooking({
      id: 'first-session',
      date: '2026-03-30T10:00:00.000Z',
      sessionDocuments: [{ _id: 'doc-1', title: 'Prep sheet' }],
    }),
    createBooking({
      id: 'completed-session',
      date: '2026-03-20T10:00:00.000Z',
      status: 'completed',
    }),
  ];

  const view = deriveSkillSessionView({
    currentUserId: 'instructor-1',
    skillId: 'skill-1',
    instructorBookings: bookings,
    studentBookings: [],
    now: fixedNow,
  });

  assert.equal(view.userRole, 'instructor');
  assert.deepEqual(
    view.sessions.map((session) => session._id),
    ['completed-session', 'first-session', 'later-session'],
  );
  assert.equal(view.resourceHostSessionId, 'first-session');
  assert.equal(view.sharedDocuments[0].title, 'Prep sheet');
  assert.equal(view.stats.totalSessions, 3);
  assert.equal(view.stats.completedSessions, 1);
  assert.equal(view.stats.upcomingSessions, 2);
  assert.equal(view.stats.uniqueParticipantCount, 2);
});

test('deriveSkillSessionView falls back to student-side bookings when the user is learning', () => {
  const view = deriveSkillSessionView({
    currentUserId: 'student-9',
    skillId: 'skill-7',
    instructorBookings: [],
    studentBookings: [
      createBooking({
        id: 'learning-session',
        skillId: 'skill-7',
        skillName: 'System Design',
        date: '2026-04-02T09:30:00.000Z',
        status: 'confirmed',
        student: { _id: 'student-9', name: 'Ada' },
        instructor: { _id: 'mentor-2', name: 'Grace' },
      }),
    ],
    now: fixedNow,
  });

  assert.equal(view.userRole, 'student');
  assert.equal(view.sessions.length, 1);
  assert.equal(view.primaryParticipant.name, 'Grace');
  assert.equal(view.stats.totalSessions, 1);
  assert.equal(view.stats.upcomingSessions, 1);
});

test('deriveSkillSessionView returns an empty view when no bookings match the selected skill', () => {
  const view = deriveSkillSessionView({
    currentUserId: 'user-1',
    skillId: 'skill-missing',
    instructorBookings: [
      createBooking({
        id: 'other-skill',
        skillId: 'skill-live',
        date: '2026-04-12T10:00:00.000Z',
      }),
    ],
    studentBookings: [],
    now: fixedNow,
  });

  assert.equal(view.userRole, null);
  assert.deepEqual(view.sessions, []);
  assert.equal(view.resourceHostSessionId, null);
  assert.equal(view.stats.totalSessions, 0);
});
