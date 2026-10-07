const { z } = require('zod');
const { AMENITY_KINDS } = require('../../config/constants');

const createAmenitySchema = {
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    kind: z.enum(Object.values(AMENITY_KINDS)),
    location: z.string().min(1, 'Location is required'),
    unitPrice: z.number().min(0),
    units: z.string().default('unit'),
  }),
};

const getAmenitySchema = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid amenity ID'),
  }),
};

const listAmenitiesSchema = {
  query: z.object({
    location: z.string().optional(),
    kind: z.enum(Object.values(AMENITY_KINDS)).optional(),
  }),
};

module.exports = {
  createAmenitySchema,
  getAmenitySchema,
  listAmenitiesSchema,
};
