const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    instructor: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Visual Design', 'Content Creation', 'Productivity', 'Other']
    },
    thumbnailUrl: {
        type: String,
        default: 'https://via.placeholder.com/300x200?text=Course+Thumbnail'
    },
    videoUrl: {
        type: String,
        required: true // In a real app, this might be optional until content is uploaded
    },
    difficulty: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced'],
        default: 'Beginner'
    },
    duration: {
        type: String, // e.g., "2h 30m"
        default: '1h'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Course', courseSchema);
