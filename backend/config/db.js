const mongoose = require('mongoose');
const memoryStore = require('../models/memoryStore');
const seedDatabase = require('../utils/seedData');

let dbStatus = 'disconnected';

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/medischedule';
  
  try {
    console.log(`📡 Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000 // Fast 3-second timeout for local dev check
    });
    dbStatus = 'connected';
    memoryStore.isUsingMemory = false;
    console.log('✅ Connected to MongoDB successfully.');
    await seedDatabase();
  } catch (err) {
    dbStatus = 'development-fallback';
    memoryStore.isUsingMemory = true;
    console.warn(`⚠️ MongoDB unavailable (${err.message}).`);
    console.log('⚡ Switching seamlessly to Development Fallback Mode (In-Memory Database) for zero-friction execution!');
    await seedDatabase();
  }
};

const getDbStatus = () => {
  if (mongoose.connection.readyState === 1 && !memoryStore.isUsingMemory) {
    return 'connected';
  }
  return 'development-fallback';
};

module.exports = connectDB;
module.exports.getDbStatus = getDbStatus;

