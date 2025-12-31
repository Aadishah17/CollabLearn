const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

// Define specific versions and binaries to avoid downloading issues if possible
// behavior: { downloadSystem: 'curl' } may help in some envs
const startServer = async () => {
    try {
        console.log('Starting MongoDB Memory Server...');
        const mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();

        console.log(`InMemory Mongo URI: ${uri}`);
        process.env.MONGODB_URI = uri;

        // Now require index.js which will connect using this URI
        require('./index');

    } catch (err) {
        console.error('Failed to start memory server:', err);
        process.exit(1);
    }
};

startServer();
