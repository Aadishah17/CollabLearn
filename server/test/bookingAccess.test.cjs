const test = require('node:test');
const assert = require('node:assert/strict');

const {
  canAccessBooking,
  canAccessUserScopedResource,
  getBookingParticipantRole,
  isValidBookingStatus,
  isValidParticipantRole
} = require('../src/utils/bookingAccess');

test('canAccessUserScopedResource allows owners and admins', () => {
  assert.equal(
    canAccessUserScopedResource({ requestedUserId: 'user-1', authUserId: 'user-1', authUserRole: 'user' }),
    true
  );
  assert.equal(
    canAccessUserScopedResource({ requestedUserId: 'user-1', authUserId: 'admin-1', authUserRole: 'admin' }),
    true
  );
  assert.equal(
    canAccessUserScopedResource({ requestedUserId: 'user-1', authUserId: 'user-2', authUserRole: 'user' }),
    false
  );
});

test('booking access helpers resolve participant roles correctly', () => {
  const booking = {
    instructor: 'teacher-1',
    student: 'student-1'
  };

  assert.equal(getBookingParticipantRole({ booking, userId: 'teacher-1' }), 'instructor');
  assert.equal(getBookingParticipantRole({ booking, userId: 'student-1' }), 'student');
  assert.equal(getBookingParticipantRole({ booking, userId: 'other-user' }), null);
  assert.equal(canAccessBooking({ booking, userId: 'teacher-1', userRole: 'user' }), true);
  assert.equal(canAccessBooking({ booking, userId: 'other-user', userRole: 'admin' }), true);
  assert.equal(canAccessBooking({ booking, userId: 'other-user', userRole: 'user' }), false);
});

test('booking validation helpers enforce allowed values', () => {
  assert.equal(isValidBookingStatus('confirmed'), true);
  assert.equal(isValidBookingStatus('invalid-status'), false);
  assert.equal(isValidParticipantRole('student'), true);
  assert.equal(isValidParticipantRole('guest'), false);
});
