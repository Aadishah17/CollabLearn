const mongoose = require('mongoose');

const simpleLinkSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const careerTrackSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'upcoming', 'archived'],
      default: 'active',
    },
    sourceUrl: {
      type: String,
      required: true,
      trim: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    timing: {
      durationWeeks: Number,
      pace: String,
      label: String,
    },
    roleSummary: {
      type: String,
      default: '',
    },
    hiringAdvice: {
      type: String,
      default: '',
    },
    linkedSkills: [
      {
        type: String,
        trim: true,
      },
    ],
    linkedCourses: [simpleLinkSchema],
    linkedModules: [simpleLinkSchema],
  },
  {
    timestamps: true,
  }
);

careerTrackSchema.index({ status: 1 });

module.exports = mongoose.model('CareerTrack', careerTrackSchema);
