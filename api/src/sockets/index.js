const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const logger = require('../shared/logger');
const { setIo } = require('./emitters');

const initSockets = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(','),
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      credentials: true,
    },
  });

  // JWT handshake authentication
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) {
      return next(new Error('Authentication error: Missing token'));
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    logger.info({ socketId: socket.id, userId }, '🔌 Socket client connected');

    // Automatically join user's private member room
    socket.join(`member:${userId}`);

    // Join location room for real-time floor availability scrubbing
    socket.on('join:location', (location) => {
      if (location) {
        socket.join(`loc:${location}`);
        logger.debug({ socketId: socket.id, location }, 'Joined location room');
      }
    });

    socket.on('leave:location', (location) => {
      if (location) {
        socket.leave(`loc:${location}`);
        logger.debug({ socketId: socket.id, location }, 'Left location room');
      }
    });

    socket.on('disconnect', () => {
      logger.info({ socketId: socket.id, userId }, '🔌 Socket client disconnected');
    });
  });

  setIo(io);
  return io;
};

module.exports = { initSockets };
