const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' }); // Adjust path if needed, or rely on defaults

const User = require('../src/models/User');

const connectDB = async () => {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/collablearn';
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');
    } catch (err) {
        console.error('❌ Failed to connect to MongoDB:', err);
        process.exit(1);
    }
};

const makePremium = async () => {
    await connectDB();

    const targetName = 'aadi';

    try {
        // Find user by name (case-insensitive)
        const user = await User.findOne({ name: { $regex: new RegExp(targetName, 'i') } });

        if (!user) {
            console.log(`❌ User '${targetName}' not found.`);
            process.exit(1);
        }

        user.isPremium = true;
        await user.save();

        console.log(`✅ User '${user.name}' (${user.email}) is now a PREMIUM member.`);
    } catch (error) {
        console.error('❌ Error updating user:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

makePremium();
