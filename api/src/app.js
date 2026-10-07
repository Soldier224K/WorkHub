const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const env = require('./config/env');
const requestId = require('./middleware/requestId');
const { apiLimiter } = require('./middleware/rateLimit');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');
const { setupSwagger } = require('./config/swagger');

// Import Module Routes
const authRoutes = require('./modules/auth/auth.routes');
const membersRoutes = require('./modules/members/members.routes');
const spacesRoutes = require('./modules/spaces/spaces.routes');
const bookingRoutes = require('./modules/bookings/booking.routes');
const amenitiesRoutes = require('./modules/amenities/amenities.routes');
const passesRoutes = require('./modules/passes/passes.routes');
const guestsRoutes = require('./modules/guests/guests.routes');
const qrRoutes = require('./modules/qr/qr.routes');
const reportsRoutes = require('./modules/reports/reports.routes');
const notificationsRoutes = require('./modules/notifications/notifications.routes');

const app = express();

// Security Middlewares
app.use(helmet({
  contentSecurityPolicy: false, // Allows Swagger UI and local development
}));

app.use(cors({
  origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(','),
  credentials: true,
}));

// Request Tracking & Parsing
app.use(requestId);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    environment: env.NODE_ENV,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Mount Swagger Documentation
setupSwagger(app);

// Mount API Endpoints (v1)
const v1Router = express.Router();
v1Router.use(apiLimiter);
v1Router.use('/auth', authRoutes);
v1Router.use('/members', membersRoutes);
v1Router.use('/spaces', spacesRoutes);
v1Router.use('/bookings', bookingRoutes);
v1Router.use('/amenities', amenitiesRoutes);
v1Router.use('/passes', passesRoutes);
v1Router.use('/guests', guestsRoutes);
v1Router.use('/qr', qrRoutes);
v1Router.use('/reports', reportsRoutes);
v1Router.use('/notifications', notificationsRoutes);

app.use('/api/v1', v1Router);

// Serve Static Frontend if built (Unified Single-Service Deployment)
const webDistPath = path.resolve(__dirname, '../../web/dist');
if (fs.existsSync(webDistPath)) {
  app.use(express.static(webDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(webDistPath, 'index.html'));
  });
}

// 404 & Global Error Handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
