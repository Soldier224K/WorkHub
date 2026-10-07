const { z } = require('zod');
const { BOOKING_STATUS } = require('../../config/constants');

const createBookingSchema = {
  body: z.object({
    resource: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid space ID'),
    start: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d{3})?Z?$/, 'Invalid ISO date')),
    end: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d{3})?Z?$/, 'Invalid ISO date')),
    notes: z.string().max(500).optional(),
  }),
};

const updateBookingSchema = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid booking ID'),
  }),
  body: z.object({
    status: z.enum(Object.values(BOOKING_STATUS)).optional(),
    notes: z.string().max(500).optional(),
  }),
};

const getBookingSchema = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid booking ID'),
  }),
};

const listBookingsSchema = {
  query: z.object({
    status: z.enum(Object.values(BOOKING_STATUS)).optional(),
    resource: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
};

module.exports = {
  createBookingSchema,
  updateBookingSchema,
  getBookingSchema,
  listBookingsSchema,
};
