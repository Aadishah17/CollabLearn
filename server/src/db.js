const mongoose = require('mongoose');

const DEFAULT_LOCAL_MONGO_URI = 'mongodb://127.0.0.1:27017/collablearn';

const resolveMongoUri = () => {
  const primary = String(process.env.MONGODB_URI || '').trim();
  const legacy = String(process.env.MONGO_URI || '').trim();
  return primary || legacy || DEFAULT_LOCAL_MONGO_URI;
};

const buildMongoConnectOptions = (mongoUri) => {
  const options = {
    serverSelectionTimeoutMS: 10000
  };

  if (/^mongodb:\/\/(localhost|127\.0\.0\.1)(?::|\/)/i.test(String(mongoUri || '').trim())) {
    options.family = 4;
  }

  return options;
};

const connectDB = async () => {
  try {
    const mongoUri = resolveMongoUri();
    await mongoose.connect(mongoUri, buildMongoConnectOptions(mongoUri));
    console.log('MongoDB connected successfully');
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    console.error(
      `Resolved MongoDB URI: ${resolveMongoUri()}. If you are developing locally, make sure the MongoDB service is running on 127.0.0.1:27017.`
    );
    process.exit(1);
  }
};

module.exports = {
  buildMongoConnectOptions,
  connectDB,
  resolveMongoUri,
  DEFAULT_LOCAL_MONGO_URI
};
