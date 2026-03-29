const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Skill = require('../models/Skill');
const Booking = require('../models/Booking');
const {
  buildRecentActivity,
  buildStudentDetailsPayload,
  buildStudentSummaries,
  calculateAverageLearningProgress,
  isCompletedBooking,
  isUpcomingBooking,
} = require('../utils/dashboardMetrics');

// GET /api/dashboard/stats - Get dashboard statistics for current user
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const now = new Date();

    // Get user with skills
    const user = await User.findById(userId)
      .select('-password')
      .populate('skillsOffering')
      .populate('skillsSeeking');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get teaching bookings
    const teachingBookings = await Booking.find({ 
      instructor: userId,
      status: { $in: ['confirmed', 'pending', 'completed', 'ongoing'] }
    })
    .populate('student', 'name email avatar bio totalSessions')
    .populate('skill')
    .sort({ date: 1 });

    // Get learning bookings
    const learningBookings = await Booking.find({ 
      student: userId,
      status: { $in: ['confirmed', 'pending', 'completed', 'ongoing'] }
    })
    .populate('instructor', 'name email avatar bio totalSessions')
    .populate('skill')
    .sort({ date: 1 });

    const upcomingTeachingSessions = teachingBookings.filter((booking) =>
      isUpcomingBooking(booking, now),
    );

    const upcomingLearningSessions = learningBookings.filter((booking) =>
      isUpcomingBooking(booking, now),
    );

    // Get skills being taught
    const teachingSkills = await Skill.find({ 
      user: userId, 
      isOffering: true
    });

    // Get skills being learned
    const learningSkills = await Skill.find({ 
      user: userId, 
      isSeeking: true
    }).populate('seeking.currentInstructor', 'name');

    const studentIds = Array.from(
      new Set(
        teachingBookings
          .map((booking) => booking?.student?._id)
          .filter(Boolean)
          .map((id) => String(id)),
      ),
    );

    const studentSeekingSkills = studentIds.length
      ? await Skill.find({
          user: { $in: studentIds },
          isSeeking: true,
        }).populate('seeking.currentInstructor', 'name email')
      : [];

    const studentSummaries = buildStudentSummaries(teachingBookings, studentSeekingSkills, now);
    const recentActivity = buildRecentActivity(
      [...teachingBookings, ...learningBookings],
      userId,
      now,
    );
    const totalTeachingSessions = teachingBookings.filter((booking) =>
      isCompletedBooking(booking, now),
    ).length;
    const totalLearningSessions = learningBookings.filter((booking) =>
      isCompletedBooking(booking, now),
    ).length;

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.getAvatarUrl(),
          bio: user.bio,
          rating: user.rating,
          totalSessions: user.totalSessions,
          badges: user.badges,
          joinDate: user.createdAt,
          isPremium: user.isPremium || false
        },
        stats: {
          totalSessions: user.totalSessions,
          averageRating: user.rating.average,
          skillsTeaching: teachingSkills.length,
          skillsLearning: learningSkills.length,
          badgesEarned: user.badges.length,
          totalTeachingSessions,
          totalLearningSessions,
          upcomingTeachingSessions: upcomingTeachingSessions.length,
          upcomingLearningSessions: upcomingLearningSessions.length,
          averageLearningProgress: calculateAverageLearningProgress(learningSkills),
          studentsSupported: studentSummaries.length,
        },
        upcomingBookings: {
          teaching: upcomingTeachingSessions.slice(0, 5),
          learning: upcomingLearningSessions.slice(0, 5)
        },
        skills: {
          teaching: teachingSkills,
          learning: learningSkills
        },
        studentSummaries,
        recentActivity,
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/dashboard/student/:studentId - Get detailed student information
router.get('/student/:studentId', auth, async (req, res) => {
  try {
    const instructorId = req.userId;
    const studentId = req.params.studentId;

    // Verify that the requesting user is teaching this student
    const teachingRelationship = await Booking.findOne({
      instructor: instructorId,
      student: studentId,
      status: { $in: ['confirmed', 'pending'] }
    });

    if (!teachingRelationship) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this student\'s information'
      });
    }

    // Get student details
    const student = await User.findById(studentId)
      .select('-password')
      .populate('skillsSeeking');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get all bookings between instructor and student
    const allBookings = await Booking.find({
      $or: [
        { instructor: instructorId, student: studentId },
        { instructor: studentId, student: instructorId }
      ]
    })
      .populate('skill', 'name')
      .sort({ date: -1 });

    const learningSkills = await Skill.find({
      user: studentId,
      isSeeking: true,
    }).populate('seeking.currentInstructor', 'name email');

    res.json({
      success: true,
      data: buildStudentDetailsPayload({
        student,
        bookings: allBookings,
        learningSkills,
      }),
    });

  } catch (error) {
    console.error('Student details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
