const normalizeSkillName = (value) =>
  String(value || '')
    .trim()
    .toLowerCase();

const toDate = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const isCompletedBooking = (booking, now = new Date()) => {
  const date = toDate(booking?.date);
  if (!date) return false;
  return booking?.status === 'completed' || (booking?.status === 'confirmed' && date < now);
};

const isUpcomingBooking = (booking, now = new Date()) => {
  const date = toDate(booking?.date);
  if (!date) return false;
  return ['pending', 'confirmed', 'ongoing'].includes(booking?.status) && date >= now;
};

const getUserAvatarUrl = (user) => {
  if (!user) return null;
  if (typeof user.getAvatarUrl === 'function') {
    return user.getAvatarUrl();
  }
  return user.avatarUrl || null;
};

const createLearningGoals = (skills = []) =>
  skills.map((skill) => ({
    id: String(skill?._id || ''),
    skill: skill?.name || 'Untitled skill',
    progress: Math.max(0, Math.min(100, Number(skill?.seeking?.progress || 0))),
    currentInstructor: skill?.seeking?.currentInstructor
      ? {
          id: String(
            skill.seeking.currentInstructor._id || skill.seeking.currentInstructor.id || ''
          ),
          name: skill.seeking.currentInstructor.name || 'Unknown instructor',
          email: skill.seeking.currentInstructor.email || '',
        }
      : null,
  }));

const calculateAverageLearningProgress = (skills = []) => {
  if (!skills.length) {
    return 0;
  }

  const total = skills.reduce(
    (sum, skill) => sum + Math.max(0, Math.min(100, Number(skill?.seeking?.progress || 0))),
    0
  );

  return Math.round(total / skills.length);
};

const buildStudentProgressLookup = (skills = []) => {
  const lookup = new Map();

  for (const skill of skills) {
    const userId = String(skill?.user || '');
    const skillName = normalizeSkillName(skill?.name);

    if (!userId || !skillName) {
      continue;
    }

    lookup.set(`${userId}:${skillName}`, {
      progress: Math.max(0, Math.min(100, Number(skill?.seeking?.progress || 0))),
      currentInstructor: skill?.seeking?.currentInstructor
        ? {
            id: String(
              skill.seeking.currentInstructor._id || skill.seeking.currentInstructor.id || ''
            ),
            name: skill.seeking.currentInstructor.name || 'Unknown instructor',
          }
        : null,
    });
  }

  return lookup;
};

const buildStudentSummaries = (
  teachingBookings = [],
  studentSeekingSkills = [],
  now = new Date()
) => {
  const progressLookup = buildStudentProgressLookup(studentSeekingSkills);
  const summaries = new Map();

  for (const booking of teachingBookings) {
    const student = booking?.student;
    if (!student?._id && !student?.id) {
      continue;
    }

    const studentId = String(student._id || student.id);
    const skillName = booking?.skill?.name || 'Session';
    const key = studentId;
    const date = toDate(booking?.date);

    if (!summaries.has(key)) {
      summaries.set(key, {
        student: {
          id: studentId,
          name: student?.name || 'Unknown student',
          email: student?.email || '',
          avatarUrl: getUserAvatarUrl(student),
        },
        totalSessions: 0,
        completedSessions: 0,
        upcomingSessions: 0,
        totalMinutes: 0,
        lastSessionAt: null,
        nextSessionAt: null,
        skillNames: new Set(),
        skillCounts: new Map(),
        upcomingSkillName: null,
      });
    }

    const summary = summaries.get(key);
    summary.totalSessions += 1;
    summary.totalMinutes += Number(booking?.duration || 0);
    summary.skillNames.add(skillName);
    summary.skillCounts.set(skillName, (summary.skillCounts.get(skillName) || 0) + 1);

    if (isCompletedBooking(booking, now)) {
      summary.completedSessions += 1;
      if (!summary.lastSessionAt || (date && date > summary.lastSessionAt)) {
        summary.lastSessionAt = date;
      }
    }

    if (isUpcomingBooking(booking, now)) {
      summary.upcomingSessions += 1;
      if (!summary.nextSessionAt || (date && date < summary.nextSessionAt)) {
        summary.nextSessionAt = date;
        summary.upcomingSkillName = skillName;
      }
    }
  }

  return Array.from(summaries.values())
    .map((summary) => {
      let focusSkillName = summary.upcomingSkillName;

      if (!focusSkillName) {
        focusSkillName =
          Array.from(summary.skillCounts.entries()).sort((left, right) => {
            if (right[1] !== left[1]) {
              return right[1] - left[1];
            }
            return left[0].localeCompare(right[0]);
          })[0]?.[0] || null;
      }

      const progressSignal = focusSkillName
        ? progressLookup.get(`${summary.student.id}:${normalizeSkillName(focusSkillName)}`)
        : null;

      return {
        student: summary.student,
        totalSessions: summary.totalSessions,
        completedSessions: summary.completedSessions,
        upcomingSessions: summary.upcomingSessions,
        totalMinutes: summary.totalMinutes,
        completionRate: summary.totalSessions
          ? Math.round((summary.completedSessions / summary.totalSessions) * 100)
          : 0,
        nextSessionAt: summary.nextSessionAt ? summary.nextSessionAt.toISOString() : null,
        lastSessionAt: summary.lastSessionAt ? summary.lastSessionAt.toISOString() : null,
        sharedSkills: Array.from(summary.skillNames).sort(),
        focusSkill: focusSkillName
          ? {
              name: focusSkillName,
              progress: progressSignal?.progress ?? null,
              currentInstructor: progressSignal?.currentInstructor || null,
            }
          : null,
      };
    })
    .sort((left, right) => {
      if (left.nextSessionAt && right.nextSessionAt) {
        return new Date(left.nextSessionAt) - new Date(right.nextSessionAt);
      }
      if (left.nextSessionAt) return -1;
      if (right.nextSessionAt) return 1;
      return right.completedSessions - left.completedSessions;
    });
};

const buildRecentActivity = (bookings = [], userId, now = new Date()) =>
  bookings
    .filter((booking) => isCompletedBooking(booking, now))
    .sort((left, right) => new Date(right.date) - new Date(left.date))
    .slice(0, 10)
    .map((booking) => {
      const instructorId = String(
        booking?.instructor?._id || booking?.instructor?.id || booking?.instructor || ''
      );
      const isTeaching = instructorId === String(userId);

      return {
        id: String(booking?._id || ''),
        type: isTeaching ? 'teaching_completed' : 'learning_completed',
        description: `${isTeaching ? 'Completed a teaching session' : 'Completed a learning session'} in ${booking?.skill?.name || 'Unknown skill'}`,
        otherUser: isTeaching
          ? booking?.student?.name || 'Unknown student'
          : booking?.instructor?.name || 'Unknown instructor',
        date: toDate(booking?.date)?.toISOString() || null,
        skill: booking?.skill?.name || 'Unknown skill',
      };
    });

const buildStudentDetailsPayload = ({
  student,
  bookings = [],
  learningSkills = [],
  now = new Date(),
}) => {
  const completedBookings = bookings.filter((booking) => isCompletedBooking(booking, now));
  const upcomingBookings = bookings.filter((booking) => isUpcomingBooking(booking, now));
  const totalMinutes = bookings.reduce((sum, booking) => sum + Number(booking?.duration || 0), 0);
  const sortedByDateDesc = [...bookings].sort(
    (left, right) => new Date(right.date) - new Date(left.date)
  );
  const lastSessionAt = completedBookings
    .map((booking) => toDate(booking?.date))
    .filter(Boolean)
    .sort((left, right) => right - left)[0];
  const nextSessionAt = upcomingBookings
    .map((booking) => toDate(booking?.date))
    .filter(Boolean)
    .sort((left, right) => left - right)[0];

  return {
    student: {
      id: String(student?._id || student?.id || ''),
      name: student?.name || 'Unknown student',
      email: student?.email || '',
      avatarUrl: getUserAvatarUrl(student),
      bio: student?.bio || '',
      joinDate: toDate(student?.createdAt)?.toISOString() || null,
    },
    stats: {
      totalSessions: bookings.length,
      completedSessions: completedBookings.length,
      upcomingSessions: upcomingBookings.length,
      totalMinutes,
      totalHours: Math.round((totalMinutes / 60) * 10) / 10,
      completionRate: bookings.length
        ? Math.round((completedBookings.length / bookings.length) * 100)
        : 0,
      lastSessionAt: lastSessionAt ? lastSessionAt.toISOString() : null,
      nextSessionAt: nextSessionAt ? nextSessionAt.toISOString() : null,
    },
    learningGoals: createLearningGoals(learningSkills),
    sessionHistory: sortedByDateDesc.map((booking) => ({
      id: String(booking?._id || ''),
      date: toDate(booking?.date)?.toISOString() || null,
      skill: booking?.skill?.name || 'Unknown skill',
      duration: Number(booking?.duration || 0),
      status: booking?.status || 'pending',
      notes: booking?.notes || '',
      rating:
        booking?.sessionRating?.instructor?.rating ||
        booking?.sessionRating?.student?.rating ||
        booking?.courseRating?.rating ||
        null,
    })),
  };
};

module.exports = {
  buildRecentActivity,
  buildStudentDetailsPayload,
  buildStudentSummaries,
  calculateAverageLearningProgress,
  createLearningGoals,
  isCompletedBooking,
  isUpcomingBooking,
};
