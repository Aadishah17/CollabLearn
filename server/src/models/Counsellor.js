const mongoose = require('mongoose');

const ctaSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    target: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const counsellorSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
    },
    specialties: [
      {
        type: String,
        trim: true,
      },
    ],
    cta: ctaSchema,
    sourceUrl: {
      type: String,
      required: true,
      trim: true,
    },
    responseTime: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Counsellor', counsellorSchema);
