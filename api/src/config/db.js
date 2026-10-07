const mongoose = require('mongoose');
const env = require('./env');
const logger = require('../shared/logger');

let isConnected = false;

const connectDB = async (customUri = null) => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uri = customUri || env.MONGO_URI;

  try {
    const conn = await mongoose.connect(uri, {
      autoIndex: true, // Builds indexes including unique partial indexes
    });

    isConnected = true;
    logger.info(`📦 MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn.connection;
  } catch (error) {
    logger.error({ err: error }, '❌ MongoDB connection error:');
    throw error;
  }
};

const disconnectDB = async () => {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  logger.info('📦 MongoDB Disconnected');
};

module.exports = { connectDB, disconnectDB };
