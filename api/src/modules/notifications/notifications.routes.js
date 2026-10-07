const express = require('express');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const validate = require('../../middleware/validate');
const { ROLES } = require('../../config/constants');
const { sendNotificationSchema } = require('./notifications.schema');
const notificationsController = require('./notifications.controller');

const router = express.Router();

router.use(authenticate);

router.get('/', notificationsController.listNotifications);
router.post(
  '/send',
  authorize(ROLES.MANAGER),
  validate(sendNotificationSchema),
  notificationsController.sendNotification
);

module.exports = router;
