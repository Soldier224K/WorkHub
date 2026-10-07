const express = require('express');
const validate = require('../../middleware/validate');
const { authLimiter } = require('../../middleware/rateLimit');
const { registerSchema, loginSchema, refreshSchema } = require('./auth.schema');
const authController = require('./auth.controller');

const router = express.Router();

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authLimiter, validate(refreshSchema), authController.refresh);
router.post('/logout', authController.logout);

module.exports = router;
