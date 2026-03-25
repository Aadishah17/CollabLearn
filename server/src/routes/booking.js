const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const auth = require('../middleware/auth');
const { validateBody, validateParams, schemas } = require('../middleware/validation');
const multer = require('multer');
const path = require('path');
const {
  canAccessBooking,
  canAccessUserScopedResource,
  getBookingParticipantRole,
  isValidBookingStatus,
  isValidParticipantRole
} = require('../utils/bookingAccess');

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/session-documents/');
  },
  filename(req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter(req, file, cb) {
    const allowedTypes = /pdf|doc|docx|txt|png|jpg|jpeg|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }

    cb(new Error('Only documents and images are allowed!'));
  }
});

router.use(auth);

const isAdmin = (req) => req.userRole === 'admin';

const isValidRating = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 1 && parsed <= 5;
};

const getAuthorizedBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    res.status(404).json({ message: 'Session not found' });
    return null;
  }

  if (!canAccessBooking({ booking, userId: req.userId, userRole: req.userRole })) {
    res.status(403).json({
      success: false,
      message: 'You are not authorized to access this session.'
    });
    return null;
  }

  return booking;
};

const ensureUserScopedAccess = (req, res) => {
  if (
    !canAccessUserScopedResource({
      requestedUserId: req.params.id,
      authUserId: req.userId,
      authUserRole: req.userRole
    })
  ) {
    res.status(403).json({
      success: false,
      message: 'You are not authorized to access these bookings.'
    });
    return false;
  }

  return true;
};

router.post('/', validateBody(schemas.booking.createBooking), async (req, res) => {
  try {
    const { instructor, student, skill, date, duration, notes } = req.body;

    const requesterIsParticipant =
      String(req.userId) === String(instructor) ||
      String(req.userId) === String(student) ||
      isAdmin(req);

    if (!requesterIsParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You can only create bookings for yourself.'
      });
    }

    const booking = new Booking({
      instructor,
      student,
      skill,
      date,
      duration,
      notes
    });

    await booking.save();
    res.status(201).json({
      success: true,
      message: 'Booking created successfully.',
      booking
    });
  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({ message: 'Error creating booking', error: error.message });
  }
});

router.get('/student/:id', validateParams(schemas.booking.bookingIdParam), async (req, res) => {
  try {
    if (!ensureUserScopedAccess(req, res)) {
      return;
    }

    const bookings = await Booking.find({ student: req.params.id })
      .populate('instructor', 'name email')
      .populate('skill', 'name description');

    const validBookings = bookings.filter(
      (booking) => booking.instructor && booking.skill && booking.instructor._id && booking.skill._id
    );

    res.json({ success: true, bookings: validBookings });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bookings', error: error.message });
  }
});

router.get('/instructor/:id', validateParams(schemas.booking.bookingIdParam), async (req, res) => {
  try {
    if (!ensureUserScopedAccess(req, res)) {
      return;
    }

    const bookings = await Booking.find({ instructor: req.params.id })
      .populate('student', 'name email')
      .populate('skill', 'name description');

    const validBookings = bookings.filter(
      (booking) => booking.student && booking.skill && booking.student._id && booking.skill._id
    );

    res.json({ success: true, bookings: validBookings });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bookings', error: error.message });
  }
});

router.patch('/:id', validateParams(schemas.booking.bookingIdParam), validateBody(schemas.booking.updateStatus), async (req, res) => {
  try {
    const booking = await getAuthorizedBooking(req, res);
    if (!booking) return;

    const { status } = req.body;
    if (!isValidBookingStatus(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking status.'
      });
    }

    booking.status = String(status).trim().toLowerCase();
    await booking.save();

    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ message: 'Error updating booking', error: error.message });
  }
});

router.get('/session/:id', validateParams(schemas.booking.bookingIdParam), async (req, res) => {
  try {
    const booking = await getAuthorizedBooking(req, res);
    if (!booking) return;

    await booking.populate('instructor', 'name email');
    await booking.populate('student', 'name email');
    await booking.populate('skill', 'name description');

    if (!booking.instructor || !booking.student || !booking.skill) {
      return res.status(400).json({
        message: 'Session has invalid references',
        details: {
          hasInstructor: !!booking.instructor,
          hasStudent: !!booking.student,
          hasSkill: !!booking.skill
        }
      });
    }

    res.json({ success: true, session: booking });
  } catch (error) {
    console.error('Session fetch error:', error);
    res.status(500).json({ message: 'Error fetching session details', error: error.message });
  }
});

router.post('/:id/upload-document', validateParams(schemas.booking.bookingIdParam), upload.single('document'), validateBody(schemas.booking.uploadDocument), async (req, res) => {
  try {
    const booking = await getAuthorizedBooking(req, res);
    if (!booking) return;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const participantRole = getBookingParticipantRole({ booking, userId: req.userId });
    const requestedRole = String(req.body?.uploadedBy || '').trim().toLowerCase();
    const uploadedBy = isAdmin(req)
      ? (isValidParticipantRole(requestedRole) ? requestedRole : 'instructor')
      : participantRole;

    if (!uploadedBy) {
      return res.status(403).json({
        success: false,
        message: 'Only session participants can upload documents.'
      });
    }

    const document = {
      title: req.body?.title || req.file.originalname,
      filename: req.file.filename,
      originalName: req.file.originalname,
      uploadedBy,
      uploadedAt: new Date()
    };

    booking.sessionDocuments.push(document);
    await booking.save();

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      sessionDocuments: booking.sessionDocuments
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Error uploading document', error: error.message });
  }
});

router.delete('/:id/delete-document/:docId', validateParams({
  id: schemas.booking.bookingIdParam.id,
  docId: schemas.booking.documentIdParam.docId
}), async (req, res) => {
  try {
    const booking = await getAuthorizedBooking(req, res);
    if (!booking) return;

    const docIndex = booking.sessionDocuments.findIndex((doc) => doc._id.toString() === req.params.docId);

    if (docIndex === -1) {
      return res.status(404).json({ message: 'Document not found' });
    }

    booking.sessionDocuments.splice(docIndex, 1);
    await booking.save();

    res.json({
      success: true,
      message: 'Document deleted successfully',
      sessionDocuments: booking.sessionDocuments
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Error deleting document', error: error.message });
  }
});

router.post('/:id/complete', validateParams(schemas.booking.bookingIdParam), validateBody(schemas.booking.completeBooking), async (req, res) => {
  try {
    const booking = await getAuthorizedBooking(req, res);
    if (!booking) return;

    const participantRole = getBookingParticipantRole({ booking, userId: req.userId });
    const requestedRole = String(req.body?.userType || '').trim().toLowerCase();
    const effectiveRole = isAdmin(req)
      ? (isValidParticipantRole(requestedRole) ? requestedRole : null)
      : participantRole;

    if (!effectiveRole) {
      return res.status(400).json({
        success: false,
        message: 'A valid participant role is required to complete the session.'
      });
    }

    const { rating, review } = req.body;
    if (!isValidRating(rating)) {
      return res.status(400).json({
        success: false,
        message: 'A rating between 1 and 5 is required.'
      });
    }

    booking.sessionRating[effectiveRole] = {
      rating: Number(rating),
      review: String(review || '').trim(),
      ratedAt: new Date()
    };

    const bothRated =
      booking.sessionRating.instructor?.rating &&
      booking.sessionRating.student?.rating;

    if (bothRated || req.body.forceComplete) {
      booking.status = 'completed';
      booking.completedAt = new Date();
    }

    await booking.save();

    res.json({
      success: true,
      message: bothRated ? 'Session completed successfully' : 'Rating submitted, waiting for other participant',
      booking,
      requiresOtherRating: !bothRated && !req.body.forceComplete
    });
  } catch (error) {
    res.status(500).json({ message: 'Error completing session', error: error.message });
  }
});

router.post('/:id/complete-session', validateParams(schemas.booking.bookingIdParam), validateBody(schemas.booking.completeSession), async (req, res) => {
  try {
    const booking = await getAuthorizedBooking(req, res);
    if (!booking) return;

    const participantRole = getBookingParticipantRole({ booking, userId: req.userId });
    const requestedRole = String(req.body?.completedBy || '').trim().toLowerCase();
    const effectiveRole = isAdmin(req)
      ? (isValidParticipantRole(requestedRole) ? requestedRole : null)
      : participantRole;

    booking.status = 'completed';
    booking.completedAt = new Date();

    if (req.body.rating !== undefined) {
      if (!effectiveRole || !isValidRating(req.body.rating)) {
        return res.status(400).json({
          success: false,
          message: 'A valid participant role and rating between 1 and 5 are required.'
        });
      }

      booking.sessionRating[effectiveRole] = {
        rating: Number(req.body.rating),
        review: String(req.body.review || '').trim(),
        ratedAt: new Date()
      };
    }

    if (booking.sessionCount && booking.sessionCount.current < booking.sessionCount.total) {
      booking.sessionCount.current += 1;
    }

    await booking.save();

    res.json({
      success: true,
      message: 'Session completed successfully',
      booking
    });
  } catch (error) {
    console.error('Session completion error:', error);
    res.status(500).json({ message: 'Error completing session', error: error.message });
  }
});

router.post('/complete-course', validateBody(schemas.booking.completeCourse), async (req, res) => {
  try {
    const { skillId, userId, rating, review } = req.body;

    if (
      !canAccessUserScopedResource({
        requestedUserId: userId,
        authUserId: req.userId,
        authUserRole: req.userRole
      })
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to complete this course.'
      });
    }

    if (!skillId || !userId || !isValidRating(rating)) {
      return res.status(400).json({
        success: false,
        message: 'Skill, user, and a rating between 1 and 5 are required.'
      });
    }

    const sessions = await Booking.find({
      $or: [
        { instructor: userId, skill: skillId },
        { student: userId, skill: skillId }
      ]
    });

    if (sessions.length === 0) {
      return res.status(404).json({ message: 'No sessions found for this course' });
    }

    const updatePromises = sessions.map((session) => {
      session.status = 'completed';
      session.courseCompleted = true;
      session.courseRating = {
        rating: Number(rating),
        review: String(review || '').trim(),
        completedAt: new Date(),
        completedBy: userId
      };

      if (!session.completedAt) {
        session.completedAt = new Date();
      }

      return session.save();
    });

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: 'Course completed successfully',
      completedSessions: sessions.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Error completing course', error: error.message });
  }
});

router.patch('/:id/session-count', validateParams(schemas.booking.bookingIdParam), validateBody(schemas.booking.sessionCount), async (req, res) => {
  try {
    const booking = await getAuthorizedBooking(req, res);
    if (!booking) return;

    const current = Number(req.body?.current);
    const total = Number(req.body?.total);

    if (!Number.isInteger(current) || !Number.isInteger(total) || current < 0 || total < 1 || current > total) {
      return res.status(400).json({
        success: false,
        message: 'Session counts must be valid integers and current cannot exceed total.'
      });
    }

    booking.sessionCount.current = current;
    booking.sessionCount.total = total;
    await booking.save();

    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ message: 'Error updating session count', error: error.message });
  }
});

router.delete('/:id/document/:docIndex', validateParams({
  id: schemas.booking.bookingIdParam.id,
  docIndex: schemas.booking.documentIndexParam.docIndex
}), async (req, res) => {
  try {
    const booking = await getAuthorizedBooking(req, res);
    if (!booking) return;

    const docIndex = Number(req.params.docIndex);
    if (!Number.isInteger(docIndex) || docIndex < 0 || docIndex >= booking.sessionDocuments.length) {
      return res.status(400).json({ message: 'Invalid document index' });
    }

    booking.sessionDocuments.splice(docIndex, 1);
    await booking.save();

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting document', error: error.message });
  }
});

module.exports = router;
