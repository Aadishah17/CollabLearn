const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const multer = require("multer");
const path = require("path");

// Configure multer for document uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/session-documents/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow common document types
    const allowedTypes = /pdf|doc|docx|txt|png|jpg|jpeg|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only documents and images are allowed!'));
    }
  }
});

// ✅ Create a booking
router.post("/", async (req, res) => {
  try {
    const { instructor, student, skill, date, duration, notes } = req.body;

    if (!instructor || !student || !skill || !date || !duration) {
      return res.status(400).json({ message: "Missing required booking fields." });
    }

    const booking = new Booking({
      instructor,
      student,
      skill,
      date,
      duration,
      notes,
    });

    await booking.save();
    res.status(201).json({
      success: true,
      message: "Booking created successfully.",
      booking,
    });
  } catch (error) {
    console.error("Booking creation error:", error);
    res.status(500).json({ message: "Error creating booking", error: error.message });
  }
});

// ✅ Get all bookings for a student
router.get("/student/:id", async (req, res) => {
  try {
    const bookings = await Booking.find({ student: req.params.id })
      .populate("instructor", 'name email')
      .populate("skill", "name description");
    
    // Filter out bookings with null populated fields
    const validBookings = bookings.filter(booking => 
      booking.instructor && booking.skill && booking.instructor._id && booking.skill._id
    );
    
    res.json({ success: true, bookings: validBookings });
  } catch (error) {
    res.status(500).json({ message: "Error fetching bookings", error: error.message });
  }
});

// ✅ Get all bookings for an instructor
router.get("/instructor/:id", async (req, res) => {
  try {
    const bookings = await Booking.find({ instructor: req.params.id })
      .populate("student", "name email")
      .populate("skill", "name description");
    
    // Filter out bookings with null populated fields
    const validBookings = bookings.filter(booking => 
      booking.student && booking.skill && booking.student._id && booking.skill._id
    );
    
    res.json({ success: true, bookings: validBookings });
  } catch (error) {
    res.status(500).json({ message: "Error fetching bookings", error: error.message });
  }
});

// ✅ Update booking status
router.patch("/:id", async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ message: "Error updating booking", error: error.message });
  }
});

// ✅ Get session details
router.get("/session/:id", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("instructor", 'name email')
      .populate("student", 'name email')
      .populate("skill", "name description");
    
    if (!booking) {
      return res.status(404).json({ message: "Session not found" });
    }
    
    // Check if populated fields are valid
    if (!booking.instructor || !booking.student || !booking.skill) {
      return res.status(400).json({ 
        message: "Session has invalid references",
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
    res.status(500).json({ message: "Error fetching session details", error: error.message });
  }
});

// ✅ Upload document to session (Updated endpoint for frontend compatibility)
router.post("/:id/upload-document", upload.single('document'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, uploadedBy } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Session not found" });
    }
    
    const document = {
      title: title || req.file.originalname,
      filename: req.file.filename,
      originalName: req.file.originalname,
      uploadedBy,
      uploadedAt: new Date()
    };
    
    booking.sessionDocuments.push(document);
    await booking.save();
    
    res.json({ 
      success: true, 
      message: "Document uploaded successfully",
      sessionDocuments: booking.sessionDocuments
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: "Error uploading document", error: error.message });
  }
});

// ✅ Delete document from session (Updated endpoint for frontend compatibility)
router.delete("/:id/delete-document/:docId", async (req, res) => {
  try {
    const { id, docId } = req.params;
    
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Session not found" });
    }
    
    // Find and remove the document by its _id
    const docIndex = booking.sessionDocuments.findIndex(doc => doc._id.toString() === docId);
    
    if (docIndex !== -1) {
      booking.sessionDocuments.splice(docIndex, 1);
      await booking.save();
      
      res.json({ 
        success: true, 
        message: "Document deleted successfully",
        sessionDocuments: booking.sessionDocuments
      });
    } else {
      res.status(404).json({ message: "Document not found" });
    }
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: "Error deleting document", error: error.message });
  }
});

// ✅ Complete session with rating
router.post("/:id/complete", async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, review, ratedBy, userType } = req.body;
    
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Session not found" });
    }
    
    // Update rating based on user type
    if (userType === 'instructor') {
      booking.ratings.instructorRating = {
        rating,
        review,
        ratedAt: new Date()
      };
    } else if (userType === 'student') {
      booking.ratings.studentRating = {
        rating,
        review,
        ratedAt: new Date()
      };
    }
    
    // Check if both have rated, then mark as completed
    const bothRated = booking.ratings.instructorRating?.rating && booking.ratings.studentRating?.rating;
    
    if (bothRated || req.body.forceComplete) {
      booking.status = 'completed';
      booking.completedAt = new Date();
    }
    
    await booking.save();
    
    res.json({ 
      success: true, 
      message: bothRated ? "Session completed successfully" : "Rating submitted, waiting for other participant",
      booking,
      requiresOtherRating: !bothRated && !req.body.forceComplete
    });
  } catch (error) {
    res.status(500).json({ message: "Error completing session", error: error.message });
  }
});

// ✅ Complete individual session (updated for frontend compatibility)
router.post("/:id/complete-session", async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, review, completedBy } = req.body;
    
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Session not found" });
    }
    
    // Mark session as completed
    booking.status = 'completed';
    booking.completedAt = new Date();
    
    // Add session rating if provided
    if (rating && completedBy) {
      const ratingField = completedBy === 'instructor' ? 'instructor' : 'student';
      booking.sessionRating[ratingField] = {
        rating,
        review: review || '',
        ratedAt: new Date()
      };
    }
    
    // Increment session count if needed
    if (booking.sessionCount && booking.sessionCount.current < booking.sessionCount.total) {
      booking.sessionCount.current += 1;
    }
    
    await booking.save();
    
    res.json({ 
      success: true, 
      message: "Session completed successfully",
      booking
    });
  } catch (error) {
    console.error('Session completion error:', error);
    res.status(500).json({ message: "Error completing session", error: error.message });
  }
});

// ✅ Complete entire course with rating
router.post("/complete-course", async (req, res) => {
  try {
    const { skillId, userId, rating, review } = req.body;
    
    // Find all sessions for this skill and user
    const sessions = await Booking.find({
      $or: [
        { instructor: userId, skill: skillId },
        { student: userId, skill: skillId }
      ]
    });
    
    if (sessions.length === 0) {
      return res.status(404).json({ message: "No sessions found for this course" });
    }
    
    // Update all sessions to completed and add course rating
    const updatePromises = sessions.map(session => {
      session.status = 'completed';
      session.courseCompleted = true;
      session.courseRating = {
        rating,
        review,
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
      message: "Course completed successfully",
      completedSessions: sessions.length
    });
  } catch (error) {
    res.status(500).json({ message: "Error completing course", error: error.message });
  }
});

// ✅ Update session count
router.patch("/:id/session-count", async (req, res) => {
  try {
    const { current, total } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { 
        "sessionCount.current": current,
        "sessionCount.total": total
      },
      { new: true }
    );
    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ message: "Error updating session count", error: error.message });
  }
});

// ✅ Delete document from session
router.delete("/:id/document/:docIndex", async (req, res) => {
  try {
    const { id, docIndex } = req.params;
    
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Session not found" });
    }
    
    if (docIndex >= 0 && docIndex < booking.sessionDocuments.length) {
      booking.sessionDocuments.splice(docIndex, 1);
      await booking.save();
      
      res.json({ 
        success: true, 
        message: "Document deleted successfully" 
      });
    } else {
      res.status(400).json({ message: "Invalid document index" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error deleting document", error: error.message });
  }
});

module.exports = router;
