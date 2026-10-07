const { z } = require('zod');
const { ROLES } = require('../../config/constants');

const registerSchema = {
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    company: z.string().optional(),
    role: z.enum(Object.values(ROLES)).optional().default(ROLES.MEMBER),
  }),
};

const loginSchema = {
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
};

const refreshSchema = {
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
};

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
};
