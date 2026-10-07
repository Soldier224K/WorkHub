const { z } = require('zod');
const { SPACE_TYPES } = require('../../config/constants');

const layoutSchema = z.object({
  x: z.number().default(0),
  y: z.number().default(0),
  w: z.number().default(60),
  h: z.number().default(40),
  rot: z.number().default(0),
});

const operatingHoursSchema = z.object({
  open: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format HH:mm').default('08:00'),
  close: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format HH:mm').default('20:00'),
  days: z.array(z.number().min(0).max(6)).default([0, 1, 2, 3, 4, 5, 6]),
});

const createSpaceSchema = {
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100),
    type: z.enum(Object.values(SPACE_TYPES)),
    location: z.string().min(1, 'Location is required'),
    floor: z.number().int().default(1),
    capacity: z.number().int().min(1).default(1),
    hourlyRate: z.number().min(0),
    operatingHours: operatingHoursSchema.optional(),
    requiresApproval: z.boolean().default(false),
    features: z.array(z.string()).default([]),
    layout: layoutSchema.optional(),
  }),
};

const updateSpaceSchema = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid space ID'),
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    type: z.enum(Object.values(SPACE_TYPES)).optional(),
    location: z.string().min(1).optional(),
    floor: z.number().int().optional(),
    capacity: z.number().int().min(1).optional(),
    hourlyRate: z.number().min(0).optional(),
    operatingHours: operatingHoursSchema.optional(),
    requiresApproval: z.boolean().optional(),
    features: z.array(z.string()).optional(),
    layout: layoutSchema.optional(),
  }),
};

const getSpaceSchema = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid space ID'),
  }),
};

const listSpacesSchema = {
  query: z.object({
    location: z.string().optional(),
    type: z.enum(Object.values(SPACE_TYPES)).optional(),
    floor: z.coerce.number().int().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  }),
};

const availabilitySchema = {
  query: z.object({
    location: z.string().min(1, 'Location is required'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  }),
};

module.exports = {
  createSpaceSchema,
  updateSpaceSchema,
  getSpaceSchema,
  listSpacesSchema,
  availabilitySchema,
};
