const Notification = require('./notification.model');
const Member = require('../members/member.model');
const { sendPushNotification } = require('../../config/firebase');
const { NOTIFICATION_CHANNELS, NOTIFICATION_STATUS } = require('../../config/constants');
const logger = require('../../shared/logger');

const notifyMember = async ({ memberId, title, body, channel = NOTIFICATION_CHANNELS.IN_APP, data = {} }) => {
  try {
    const member = await Member.findById(memberId);
    if (!member) return null;

    const notification = await Notification.create({
      member: memberId,
      title,
      body,
      channel,
      status: NOTIFICATION_STATUS.SENT,
    });

    if (channel === NOTIFICATION_CHANNELS.PUSH || member.deviceTokens?.length > 0) {
      await sendPushNotification({
        tokens: member.deviceTokens || [],
        title,
        body,
        data,
      });
    }

    return notification;
  } catch (err) {
    logger.error({ err, memberId }, 'Failed to dispatch notification');
    return null;
  }
};

module.exports = {
  notifyMember,
};
