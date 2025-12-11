const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Skill = require('../models/Skill');
const Booking = require('../models/Booking');

// Test endpoint
router.get('/test', (req, res) => {
  console.log('Dashboard test endpoint hit');
  res.json({ success: true, message: 'Dashboard route is working' });
});

// GET /api/dashboard/stats - Get dashboard statistics for current user
router.get('/stats', auth, async (req, res) => {
  console.log('Dashboard stats endpoint hit for user:', req.userId);
  
  try {
    const userId = req.userId;
    
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
      status: { $in: ['confirmed', 'pending'] }
    })
    .populate('student', 'name email')
    .populate('skill')
    .sort({ date: 1 });

    // Get learning bookings
    const learningBookings = await Booking.find({ 
      student: userId,
      status: { $in: ['confirmed', 'pending'] }
    })
    .populate('instructor', 'name email')
    .populate('skill')
    .sort({ date: 1 });

    // Calculate statistics
    const totalTeachingSessions = await Booking.countDocuments({ 
      instructor: userId, 
      status: 'confirmed' 
    });
    
    const totalLearningSessions = await Booking.countDocuments({ 
      student: userId, 
      status: 'confirmed' 
    });

    const upcomingTeachingSessions = teachingBookings.filter(booking => 
      new Date(booking.date) > new Date()
    );

    const upcomingLearningSessions = learningBookings.filter(booking => 
      new Date(booking.date) > new Date()
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
          badgesEarned: user.badges.length,
          totalTeachingSessions,
          totalLearningSessions,
          upcomingTeachingSessions: upcomingTeachingSessions.length,
          upcomingLearningSessions: upcomingLearningSessions.length
        },
        upcomingBookings: {
          teaching: upcomingTeachingSessions.slice(0, 5),
          learning: upcomingLearningSessions.slice(0, 5)
        },
        skills: {
          teaching: teachingSkills,
          learning: learningSkills
        },
        recentActivity: await getRecentActivity(userId)
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

    // Calculate student statistics
    const completedSessions = allBookings.filter(b => 
      b.status === 'confirmed' && new Date(b.date) < new Date()
    ).length;

    const totalSessions = allBookings.length;
    const averageRating = 4.5; // Mock rating - implement rating system
    const currentStreak = 7; // Mock streak - implement streak calculation

    res.json({
      success: true,
      data: {
        student: {
          id: student._id,
          name: student.name,
          email: student.email,
          avatar: student.getAvatarUrl(),
          bio: student.bio,
          joinDate: student.createdAt
        },
        stats: {
          totalSessions,
          completedSessions,
          averageRating,
          currentStreak
        },
        learningGoals: student.skillsSeeking.map(skill => ({
          skill: skill.name,
          progress: skill.seeking.progress || 0,
          target: 'Advanced', // Mock target
          currentInstructor: skill.seeking.currentInstructor
        })),
        sessionHistory: allBookings.map(booking => ({
          id: booking._id,
          date: booking.date,
          skill: booking.skill ? booking.skill.name : 'Unknown Skill',
          duration: booking.duration,
          status: booking.status,
          notes: booking.notes
        })),
        achievements: ['Quick Learner', 'Consistent Student'] // Mock achievements
      }
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

// Helper function to get recent activity
async function getRecentActivity(userId) {
  try {
    // Get recent completed bookings
    const recentBookings = await Booking.find({
      $or: [
        { instructor: userId },
        { student: userId }
      ],
      status: 'confirmed',
      date: { $lt: new Date() }
    })
    .populate('student', 'name')
    .populate('instructor', 'name')
    .populate('skill', 'name')
    .sort({ date: -1 })
    .limit(10);

    return recentBookings.map(booking => {
      const isTeaching = booking.instructor._id.toString() === userId;
      const skillName = booking.skill ? booking.skill.name : 'Unknown Skill';
      return {
        type: isTeaching ? 'teaching_completed' : 'learning_completed',
        description: `${isTeaching ? 'Taught' : 'Learned'} ${skillName}`,
        otherUser: isTeaching ? booking.student.name : booking.instructor.name,
        date: booking.date,
        skill: skillName
      };
    });
  } catch (error) {
    console.error('Recent activity error:', error);
    return [];
  }
}

module.exports = router;