const { z } = require('zod');

const patchDeviceSchema = {
  body: z.object({
    token: z.string().min(10, 'FCM device token is required'),
  }),
};

module.exports = {
  patchDeviceSchema,
};
