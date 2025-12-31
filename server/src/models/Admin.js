const mongoose = require('mongoose');

// ============= ADMIN SCHEMA =============
const adminSchema = new mongoose.Schema({
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
  role: {
    type: String,
    default: 'admin',
    immutable: true // This ensures the role cannot be changed after creation
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true  // Automatically adds createdAt and updatedAt
});

// ============= INDEX FOR PERFORMANCE =============
adminSchema.index({ email: 1 });

// ============= EXPORT MODEL =============
module.exports = mongoose.model('Admin', adminSchema);