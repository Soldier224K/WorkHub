const { z } = require('zod');
const { PASS_PLANS } = require('../../config/constants');

const createPassSchema = {
  body: z.object({
    plan: z.enum(Object.values(PASS_PLANS)),
    price: z.number().min(0),
    renewDay: z.number().min(1).max(31).default(1),
    autoRenew: z.boolean().default(true),
    memberId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  }),
};

const getUserPassesSchema = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid member ID'),
  }),
};

module.exports = {
  createPassSchema,
  getUserPassesSchema,
};
