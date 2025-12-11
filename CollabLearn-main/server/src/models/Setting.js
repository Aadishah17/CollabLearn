const mongoose = require('mongoose');

// This schema uses a "singleton" pattern. There will only ever be one
// document in this collection, making it easy to find and update.
const settingsSchema = new mongoose.Schema({
    key: {
        type: String,
        default: 'main_settings',
        unique: true,
        required: true
    },
    siteName: {
        type: String,
        required: true,
        default: 'CollabLearn',
        trim: true
    },
    maintenanceMode: {
        type: Boolean,
        required: true,
        default: false
    },
    minPasswordLength: {
        type: Number,
        required: true,
        default: 8,
        min: 6,
        max: 16
    }
}, {
    timestamps: true // Adds createdAt and updatedAt timestamps
});

module.exports = mongoose.model('Setting', settingsSchema);

