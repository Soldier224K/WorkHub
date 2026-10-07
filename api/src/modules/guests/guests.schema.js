const { z } = require('zod');

const inviteGuestSchema = {
  body: z.object({
    bookingId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid booking ID'),
    name: z.string().min(1, 'Guest name is required'),
    email: z.string().email('Invalid guest email address'),
  }),
};

const getBookingGuestsSchema = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid booking ID'),
  }),
};

const getGuestPassSchema = {
  params: z.object({
    token: z.string().min(10, 'Token is required'),
  }),
};

module.exports = {
  inviteGuestSchema,
  getBookingGuestsSchema,
  getGuestPassSchema,
};
