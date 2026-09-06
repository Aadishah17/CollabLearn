const ACTIVE_UPCOMING_STATUSES = new Set(['pending', 'confirmed', 'ongoing']);

const normalizeId = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    return value._id || value.id || '';
  }

  return '';
};

const compareByDate = (left, right) => {
  const leftTime = new Date(left?.date || 0).getTime();
  const rightTime = new Date(right?.date || 0).getTime();
  return leftTime - rightTime;
};

const getUniqueParticipantCount = (sessions, role) => {
  const field = role === 'instructor' ? 'student' : 'instructor';
  return new Set(sessions.map((session) => normalizeId(session?.[field])).filter(Boolean)).size;
};

const findResourceHostSession = (sessions) =>
  sessions.find(
    (session) => Array.isArray(session?.sessionDocuments) && session.sessionDocuments.length > 0
  ) ||
  sessions[0] ||
  null;

const countUpcomingSessions = (sessions, now) =>
  sessions.filter((session) => {
    const timestamp = new Date(session?.date || 0).getTime();
    return (
      Number.isFinite(timestamp) &&
      timestamp >= now.getTime() &&
      ACTIVE_UPCOMING_STATUSES.has(session?.status)
    );
  }).length;

const summarizeSessions = (sessions, role, now) => ({
  totalSessions: sessions.length,
  completedSessions: sessions.filter((session) => session?.status === 'completed').length,
  upcomingSessions: countUpcomingSessions(sessions, now),
  uniqueParticipantCount: getUniqueParticipantCount(sessions, role),
});

const filterBookingsForSkill = (bookings, skillId) =>
  (Array.isArray(bookings) ? bookings : [])
    .filter((booking) => normalizeId(booking?.skill) === skillId)
    .sort(compareByDate);

export const deriveSkillSessionView = ({
  currentUserId,
  skillId,
  instructorBookings = [],
  studentBookings = [],
  now = new Date(),
}) => {
  const normalizedSkillId = normalizeId(skillId);
  if (!normalizedSkillId || !normalizeId(currentUserId)) {
    return {
      userRole: null,
      sessions: [],
      sharedDocuments: [],
      resourceHostSessionId: null,
      primaryParticipant: null,
      stats: summarizeSessions([], null, now),
    };
  }

  const teachingSessions = filterBookingsForSkill(instructorBookings, normalizedSkillId);
  const learningSessions = filterBookingsForSkill(studentBookings, normalizedSkillId);
  const userRole = teachingSessions.length
    ? 'instructor'
    : learningSessions.length
      ? 'student'
      : null;
  const sessions = userRole === 'instructor' ? teachingSessions : learningSessions;
  const resourceHostSession = findResourceHostSession(sessions);
  const primaryParticipant =
    userRole === 'instructor' ? sessions[0]?.student || null : sessions[0]?.instructor || null;

  return {
    userRole,
    sessions,
    sharedDocuments: Array.isArray(resourceHostSession?.sessionDocuments)
      ? resourceHostSession.sessionDocuments
      : [],
    resourceHostSessionId: resourceHostSession?._id || null,
    primaryParticipant,
    stats: summarizeSessions(sessions, userRole, now),
  };
};

export const getBookingStatusTone = (status) => {
  switch (status) {
    case 'completed':
      return 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200';
    case 'confirmed':
      return 'border-sky-400/30 bg-sky-500/10 text-sky-200';
    case 'ongoing':
      return 'border-violet-400/30 bg-violet-500/10 text-violet-200';
    case 'cancelled':
      return 'border-zinc-500/30 bg-zinc-500/10 text-zinc-300';
    case 'pending':
    default:
      return 'border-amber-400/30 bg-amber-500/10 text-amber-200';
  }
};
