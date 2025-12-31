const mongoose = require('mongoose');

// ============= AVAILABILITY SCHEMA =============
const availabilitySchema = new mongoose.Schema({
  // ===== USER REFERENCE =====
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // ===== AVAILABILITY DETAILS =====
  day: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    required: true
  },
  startTime: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        // Validate time format (HH:MM)
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Start time must be in HH:MM format'
    }
  },
  endTime: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        // Validate time format (HH:MM)
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'End time must be in HH:MM format'
    }
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  timezone: {
    type: String,
    default: 'UTC',
    required: true
  },

  // ===== METADATA =====
  notes: {
    type: String,
    maxlength: [200, 'Notes cannot exceed 200 characters']
  }
}, {
  timestamps: true
});

// ============= INDEXES FOR PERFORMANCE =============
availabilitySchema.index({ userId: 1, day: 1 });
availabilitySchema.index({ userId: 1, isAvailable: 1 });

// ============= VALIDATION =====
availabilitySchema.pre('save', function(next) {
  // Ensure end time is after start time
  const start = this.startTime.split(':').map(Number);
  const end = this.endTime.split(':').map(Number);
  const startMinutes = start[0] * 60 + start[1];
  const endMinutes = end[0] * 60 + end[1];
  
  if (startMinutes >= endMinutes) {
    return next(new Error('End time must be after start time'));
  }
  
  next();
});

// ============= STATIC METHODS =============
availabilitySchema.statics.getUserAvailability = async function(userId) {
  return await this.find({ userId, isAvailable: true })
    .sort({ day: 1, startTime: 1 });
};

availabilitySchema.statics.getDayAvailability = async function(userId, day) {
  return await this.find({ userId, day, isAvailable: true })
    .sort({ startTime: 1 });
};

// ============= EXPORT MODEL =============
module.exports = mongoose.model('Availability', availabilitySchema);