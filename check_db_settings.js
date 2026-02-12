const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/collablearn';

async function check() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');
        
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));
        
        const settings = await db.collection('settings').find({}).toArray();
        console.log('Settings:', JSON.stringify(settings, null, 2));
        
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

check();
