const mongoose = require('mongoose');

const competitionSchema = new mongoose.Schema(
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
      enum: ['live', 'upcoming', 'archived'],
      default: 'upcoming',
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    sourceUrl: {
      type: String,
      required: true,
      trim: true,
    },
    timing: {
      startsAt: String,
      endsAt: String,
      timezone: String,
      label: String,
    },
    summary: {
      type: String,
      default: '',
    },
    prize: {
      type: String,
      default: '',
    },
    eligibility: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

competitionSchema.index({ status: 1 });

module.exports = mongoose.model('Competition', competitionSchema);
