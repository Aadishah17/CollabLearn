const mongoose = require('mongoose');

const learningStepSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 600
    },
    goals: [
      {
        type: String,
        trim: true,
        maxlength: 200
      }
    ],
    practiceTask: {
      type: String,
      trim: true,
      maxlength: 400,
      default: ''
    },
    estimatedHours: {
      type: Number,
      min: 1,
      max: 40,
      default: 4
    }
  },
  { _id: false }
);

const milestoneSchema = new mongoose.Schema(
  {
    week: {
      type: Number,
      min: 1,
      max: 52,
      default: 1
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    successCriteria: {
      type: String,
      required: true,
      trim: true,
      maxlength: 400
    }
  },
  { _id: false }
);

const resourceSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Video', 'Article', 'Course', 'Docs', 'Community', 'Practice'],
      default: 'Article'
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160
    },
    url: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 280,
      default: ''
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'],
      default: 'All Levels'
    }
  },
  { _id: false }
);

const learningPlanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    skill: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      index: true
    },
    learnerLevel: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner'
    },
    weeklyHours: {
      type: Number,
      min: 1,
      max: 40,
      default: 6
    },
    targetWeeks: {
      type: Number,
      min: 2,
      max: 52,
      default: 8
    },
    focusAreas: [
      {
        type: String,
        trim: true,
        maxlength: 80
      }
    ],
    plan: {
      summary: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: ''
      },
      steps: {
        type: [learningStepSchema],
        default: []
      },
      milestones: {
        type: [milestoneSchema],
        default: []
      },
      resources: {
        type: [resourceSchema],
        default: []
      },
      habits: [
        {
          type: String,
          trim: true,
          maxlength: 240
        }
      ],
      checkpoints: [
        {
          type: String,
          trim: true,
          maxlength: 240
        }
      ]
    },
    completedStepIndexes: [
      {
        type: Number,
        min: 0
      }
    ],
    progressPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    source: {
      type: String,
      enum: ['ai', 'fallback'],
      default: 'fallback'
    },
    lastProgressUpdate: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

learningPlanSchema.index({ user: 1, updatedAt: -1 });
learningPlanSchema.index({ user: 1, skill: 1, updatedAt: -1 });

module.exports = mongoose.model('LearningPlan', learningPlanSchema);
