const mongoose = require('mongoose');
const path = require('path');

// ============= USER SCHEMA =============
const userSchema = new mongoose.Schema({
  // ===== BASIC INFO (Required for signup) =====
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },

  // ===== PROFILE INFO =====
  avatar: {
    type: {
      type: String,
      enum: ['default', 'upload', 'url', 'base64'],
      default: 'default'
    },
    url: {
      type: String,
      default: ''
    },
    filename: {
      type: String,
      default: ''
    },
    uploadDate: {
      type: Date,
      default: null
    }
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: ''
  },

  // ===== SKILLS REFERENCE =====
  // Skills are now stored in separate Skill model
  // Use virtual populate to access user's skills

  // ===== RATINGS & STATISTICS =====
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  totalSessions: {
    type: Number,
    default: 0,
    min: 0
  },
  badges: [String],

  // ===== SUBSCRIPTION =====
  isPremium: {
    type: Boolean,
    default: false
  },

  // ===== STATUS =====
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true  // Automatically adds createdAt and updatedAt
});

// ============= INDEXES FOR PERFORMANCE =============
userSchema.index({ 'rating.average': -1 });

// ============= VIRTUAL POPULATE FOR SKILLS =============
userSchema.virtual('skillsOffering', {
  ref: 'Skill',
  localField: '_id',
  foreignField: 'user',
  match: { isOffering: true, isActive: true }
});

userSchema.virtual('skillsSeeking', {
  ref: 'Skill',
  localField: '_id',
  foreignField: 'user',
  match: { isSeeking: true, isActive: true }
});

userSchema.virtual('allSkills', {
  ref: 'Skill',
  localField: '_id',
  foreignField: 'user',
  match: { isActive: true }
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

// ============= AVATAR UTILITIES =============
const normalizeUploadFilename = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';

  const withoutQuery = raw.split('?')[0].split('#')[0];
  const normalized = withoutQuery.replace(/\\/g, '/');

  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    try {
      const parsed = new URL(normalized);
      return path.basename(parsed.pathname || '');
    } catch (_error) {
      return path.basename(normalized);
    }
  }

  return path.basename(normalized);
};

// Helper method to get avatar URL
userSchema.methods.getAvatarUrl = function() {
  if (!this.avatar) {
    return null;
  }
  
  switch (this.avatar.type) {
    case 'upload': {
      const normalizedFilename = normalizeUploadFilename(this.avatar.filename);
      if (normalizedFilename) {
        return `/uploads/avatars/${normalizedFilename}`;
      }

      if (this.avatar.url && String(this.avatar.url).startsWith('/uploads/')) {
        return this.avatar.url;
      }
      return null;
    }
    case 'url':
      return this.avatar.url;
    case 'base64':
      // Do not expose base64 avatar data via the backend. Treat as if no avatar.
      return null;
    case 'default':
    default:
      return null;
  }
};

// Helper method to set avatar
userSchema.methods.setAvatar = function(avatarData) {
  // If no avatar data or explicit default, clear avatar
  if (!avatarData || avatarData === 'default' || avatarData === '') {
    this.avatar = {
      type: 'default',
      url: '',
      filename: '',
      uploadDate: null
    };
    return;
  }

  // If a base64 string is provided, do NOT store it. Replace with default.
  if (typeof avatarData === 'string' && avatarData.startsWith('data:image/')) {
    // Intentionally drop base64 payloads from the backend to avoid large data storage
    this.avatar = {
      type: 'default',
      url: '',
      filename: '',
      uploadDate: null
    };
    return;
  }

  if (typeof avatarData === 'string') {
    const trimmedAvatarData = avatarData.trim();

    if (trimmedAvatarData.startsWith('/uploads/') || trimmedAvatarData.startsWith('uploads/')) {
      const filename = normalizeUploadFilename(trimmedAvatarData);
      this.avatar = {
        type: 'upload',
        url: filename ? `/uploads/avatars/${filename}` : '',
        filename,
        uploadDate: new Date()
      };
    } else if (trimmedAvatarData.startsWith('http://') || trimmedAvatarData.startsWith('https://')) {
      // External URL
      this.avatar = {
        type: 'url',
        url: trimmedAvatarData,
        filename: '',
        uploadDate: new Date()
      };
    } else {
      // Local file path/filename
      const filename = normalizeUploadFilename(trimmedAvatarData);
      this.avatar = {
        type: 'upload',
        url: filename ? `/uploads/avatars/${filename}` : '',
        filename,
        uploadDate: new Date()
      };
    }
  } else if (typeof avatarData === 'object') {
    // Full avatar object: sanitize base64 if present
    const type = avatarData.type || 'default';
    if (type === 'base64' && avatarData.url && String(avatarData.url).startsWith('data:image/')) {
      // Drop base64 payload
      this.avatar = {
        type: 'default',
        url: '',
        filename: '',
        uploadDate: null
      };
    } else {
      const normalizedType = type === 'upload' ? 'upload' : type;
      const normalizedFilename =
        normalizedType === 'upload'
          ? normalizeUploadFilename(avatarData.filename || avatarData.url || '')
          : '';

      this.avatar = {
        type: normalizedType,
        url:
          normalizedType === 'upload'
            ? normalizedFilename
              ? `/uploads/avatars/${normalizedFilename}`
              : ''
            : avatarData.url || '',
        filename: normalizedFilename,
        uploadDate: avatarData.uploadDate || new Date()
      };
    }
  }
};

// ============= SANITIZE BASE64 AVATARS BEFORE PERSISTING =============
// Prevent storing base64 avatar payloads in DB for both save and findOneAndUpdate flows.
userSchema.pre('save', function(next) {
  try {
    if (this.avatar && this.avatar.type === 'base64' && this.avatar.url && String(this.avatar.url).startsWith('data:image/')) {
      this.avatar = {
        type: 'default',
        url: '',
        filename: '',
        uploadDate: null
      };
    }
  } catch (e) {
    // Non-fatal; continue
  }
  next();
});

// Handle updates performed with findOneAndUpdate / findByIdAndUpdate
userSchema.pre('findOneAndUpdate', function(next) {
  try {
    const update = this.getUpdate() || {};

    // Check direct avatar replacement in $set or top-level
    const applySanitize = (avatarVal) => {
      if (!avatarVal) return avatarVal;
      if (typeof avatarVal === 'string' && String(avatarVal).startsWith('data:image/')) {
        return { type: 'default', url: '', filename: '', uploadDate: null };
      }
      if (typeof avatarVal === 'object') {
        if (avatarVal.type === 'base64' && avatarVal.url && String(avatarVal.url).startsWith('data:image/')) {
          return { type: 'default', url: '', filename: '', uploadDate: null };
        }
      }
      return avatarVal;
    };

    if (update.$set && update.$set.avatar) {
      update.$set.avatar = applySanitize(update.$set.avatar);
    }
    if (update.avatar) {
      update.avatar = applySanitize(update.avatar);
    }

    this.setUpdate(update);
  } catch (e) {
    // continue even if sanitation fails
  }
  next();
});

// Virtual for backward compatibility
userSchema.virtual('avatarUrl').get(function() {
  return this.getAvatarUrl();
});

// ============= EXPORT MODEL =============
module.exports = mongoose.model('User', userSchema);
