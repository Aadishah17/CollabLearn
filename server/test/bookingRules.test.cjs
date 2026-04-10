const test = require('node:test');
const assert = require('node:assert/strict');

const { isOneToOneBooking, isSingleSessionCount } = require('../src/utils/bookingRules');

test('isOneToOneBooking only allows different instructor and student accounts', () => {
  assert.equal(isOneToOneBooking({ instructorId: 'teacher-1', studentId: 'student-1' }), true);
  assert.equal(isOneToOneBooking({ instructorId: 'same-user', studentId: 'same-user' }), false);
  assert.equal(isOneToOneBooking({ instructorId: '', studentId: 'student-1' }), false);
});

test('isSingleSessionCount only accepts a 1 of 1 session count', () => {
  assert.equal(isSingleSessionCount({ current: 1, total: 1 }), true);
  assert.equal(isSingleSessionCount({ current: 1, total: 3 }), false);
  assert.equal(isSingleSessionCount({ current: 0, total: 1 }), false);
});
