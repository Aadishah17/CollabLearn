const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
        type: String,
        maxlength: [500, 'Description cannot exceed 500 characters'],
        default: ''
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    collaborators: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ['editor', 'viewer'],
            default: 'editor'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    // For the MVP, content can be a simple big string (e.g. HTML or stringified Delta from Quill)
    // or a more structured array of sections. Let's start flexible.
    content: {
        type: String,
        default: ''
    },
    visibility: {
        type: String,
        enum: ['public', 'private', 'link'],
        default: 'private'
    },
    tags: [{
        type: String,
        trim: true
    }],
    // Placeholder for future Quiz integration
    quizzes: [{
        title: String,
        questions: [{
            questionText: String,
            options: [String],
            correctAnswerIndex: Number
        }]
    }]
}, {
    timestamps: true
});

// Indexes for faster searching
moduleSchema.index({ owner: 1 });
moduleSchema.index({ 'collaborators.user': 1 });
moduleSchema.index({ visibility: 1 });
moduleSchema.index({ title: 'text', description: 'text', tags: 'text' }); // Text search

module.exports = mongoose.model('Module', moduleSchema);
