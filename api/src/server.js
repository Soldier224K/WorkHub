const http = require('http');
const env = require('./config/env');
const logger = require('./shared/logger');
const { connectDB, disconnectDB } = require('./config/db');
const { initFirebase } = require('./config/firebase');
const { initSockets } = require('./sockets');
const { startPassRenewalJob } = require('./jobs/passRenewal.job');
const { startNoShowSweeperJob } = require('./jobs/noShowSweeper.job');
const { startBookingReminderJob } = require('./jobs/bookingReminder.job');
const app = require('./app');

const startServer = async () => {
  try {
    logger.info('🚀 WorkHub Backend starting...');

    // 1. Database Connection
    await connectDB();

    // 2. Firebase Initialization
    initFirebase();

    // 3. HTTP Server
    const server = http.createServer(app);

    // 4. Socket.io Real-time Server
    const io = initSockets(server);

    // 5. Cron Jobs
    if (env.NODE_ENV !== 'test') {
      startPassRenewalJob();
      startNoShowSweeperJob();
      startBookingReminderJob();
      logger.info('⏰ Background cron sweepers initialized');
    }

    // 6. Listen
    server.listen(env.PORT, () => {
      logger.info(`✨ WorkHub Server listening on http://localhost:${env.PORT}`);
      logger.info(`📖 API Docs available at http://localhost:${env.PORT}/api/docs`);
    });

    // Graceful Shutdown
    const shutdown = async (signal) => {
      logger.info(`🛑 Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        logger.info('HTTP server closed.');
        await disconnectDB();
        process.exit(0);
      });

      // Force exit if not closed within 10s
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.fatal({ err: error }, '💥 Failed to boot WorkHub server');
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
