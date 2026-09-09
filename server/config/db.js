const mongoose = require('mongoose');
// Ensure .env is loaded before we read MONGO_URI (app.js requires this file first)
require('./env');
const logger = require('../utils/logger');

// Retry with backoff instead of crashing the whole process on a transient
// DNS / network blip. The API keeps serving (routes that don't touch the DB
// still work) and reconnects automatically once Mongo is reachable.
const connectDB = async (attempt = 1) => {
  const maxDelay = 30000;
  const MONGO_URI =
    process.env.MONGO_URI || 'mongodb://localhost:27017/bijakbeli';
  try {
    const conn = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    const delay = Math.min(1000 * 2 ** (attempt - 1), maxDelay);
    logger.error(
      `MongoDB Connection Error (attempt ${attempt}): ${error.message}. Retrying in ${delay / 1000}s`
    );
    setTimeout(() => connectDB(attempt + 1), delay);
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

module.exports = connectDB;
