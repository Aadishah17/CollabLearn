const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  author: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
  },
  title: {
    type: String,
    required: true,
  },
  excerpt: {
    type: String,
    required: true,
  },
  tags: {
    type: [String],
  },
  stats: {
    comments: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  isHot: {
    type: Boolean,
    default: false,
  },
  authorRole: {
    type: String,
  },
  category: {
    type: String,
  },
  likedBy: [{ type: String }], // track userIds who liked
  comments: [
    {
      userId: String,
      author: String,
      text: String,
      createdAt: { type: Date, default: Date.now }
    }
  ],

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

// Indexes for faster sorting/filtering
postSchema.index({ timestamp: -1 });
postSchema.index({ userId: 1 });

module.exports = mongoose.model('Post', postSchema);
