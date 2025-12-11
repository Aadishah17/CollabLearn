const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // reference to User model
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    skill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Skill", // if you store skills separately
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number, // minutes
      required: true,
    },
    notes: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "ongoing", "completed"],
      default: "pending",
    },
    sessionDocuments: [{
      title: String,
      filename: String,
      originalName: String,
      uploadedBy: String, // 'instructor' or 'student'
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    sessionCount: {
      current: {
        type: Number,
        default: 1
      },
      total: {
        type: Number,
        default: 1
      }
    },
    sessionRating: {
      instructor: {
        rating: { type: Number, min: 1, max: 5 },
        review: String,
        ratedAt: Date
      },
      student: {
        rating: { type: Number, min: 1, max: 5 },
        review: String,
        ratedAt: Date
      }
    },
    courseCompleted: {
      type: Boolean,
      default: false
    },
    courseRating: {
      rating: { type: Number, min: 1, max: 5 },
      review: String,
      completedAt: Date,
      completedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    },
    completedAt: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
