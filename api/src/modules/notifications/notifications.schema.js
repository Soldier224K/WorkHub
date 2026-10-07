const { z } = require('zod');
const { NOTIFICATION_CHANNELS } = require('../../config/constants');

const sendNotificationSchema = {
  body: z.object({
    memberId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid member ID'),
    title: z.string().min(1, 'Title is required'),
    body: z.string().min(1, 'Body is required'),
    channel: z.enum(Object.values(NOTIFICATION_CHANNELS)).default(NOTIFICATION_CHANNELS.IN_APP),
  }),
};

module.exports = {
  sendNotificationSchema,
};
