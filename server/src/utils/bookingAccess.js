const BOOKING_STATUSES = new Set(['pending', 'confirmed', 'cancelled', 'ongoing', 'completed']);
const PARTICIPANT_ROLES = new Set(['student', 'instructor']);

const normalizeId = (value) => {
  if (!value) return '';
  if (typeof value === 'object' && value._id) {
    return String(value._id);
  }

  return String(value);
};

const canAccessUserScopedResource = ({ requestedUserId, authUserId, authUserRole }) =>
  authUserRole === 'admin' || normalizeId(requestedUserId) === normalizeId(authUserId);

const getBookingParticipantRole = ({ booking, userId }) => {
  if (!booking) return null;

  if (normalizeId(booking.instructor) === normalizeId(userId)) {
    return 'instructor';
  }

  if (normalizeId(booking.student) === normalizeId(userId)) {
    return 'student';
  }

  return null;
};

const canAccessBooking = ({ booking, userId, userRole }) =>
  userRole === 'admin' || Boolean(getBookingParticipantRole({ booking, userId }));

const isValidBookingStatus = (status) =>
  BOOKING_STATUSES.has(
    String(status || '')
      .trim()
      .toLowerCase()
  );

const isValidParticipantRole = (role) =>
  PARTICIPANT_ROLES.has(
    String(role || '')
      .trim()
      .toLowerCase()
  );

module.exports = {
  canAccessBooking,
  canAccessUserScopedResource,
  getBookingParticipantRole,
  isValidBookingStatus,
  isValidParticipantRole,
};
