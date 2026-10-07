const asyncHandler = require('../../shared/asyncHandler');
const { created, success } = require('../../shared/respond');
const { notifyMember } = require('./notify.service');
const Notification = require('./notification.model');

const sendNotification = asyncHandler(async (req, res) => {
  const notification = await notifyMember({
    memberId: req.body.memberId,
    title: req.body.title,
    body: req.body.body,
    channel: req.body.channel,
  });
  return created(res, notification);
});

const listNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ member: req.user.id })
    .sort({ sentAt: -1 })
    .limit(50);
  return success(res, notifications);
});

module.exports = {
  sendNotification,
  listNotifications,
};
