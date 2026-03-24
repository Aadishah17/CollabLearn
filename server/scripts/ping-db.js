require('dotenv').config();

const mongoose = require('mongoose');
const { resolveMongoUri, buildMongoConnectOptions } = require('../src/db');

async function main() {
  const mongoUri = resolveMongoUri();

  try {
    await mongoose.connect(mongoUri, buildMongoConnectOptions(mongoUri));
    console.log(`MongoDB reachable at ${mongoUri}`);
    await mongoose.disconnect();
  } catch (error) {
    console.error(`MongoDB ping failed for ${mongoUri}`);
    console.error(error.message);
    process.exit(1);
  }
}

main();
