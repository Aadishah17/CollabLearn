const mongoose = require('mongoose');

const resolveMongoUri = () => {
  const primary = String(process.env.MONGODB_URI || '').trim();
  const legacy = String(process.env.MONGO_URI || '').trim();
  return primary || legacy || 'mongodb://localhost:27017/collablearn';
};

const connectDB = async () => {
  try {
    const mongoUri = resolveMongoUri();
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000
    });
    console.log('MongoDB connected successfully');
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = {
  connectDB,
  resolveMongoUri
};
