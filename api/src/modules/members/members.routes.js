const express = require('express');
const authenticate = require('../../middleware/authenticate');
const validate = require('../../middleware/validate');
const { patchDeviceSchema } = require('./members.schema');
const membersController = require('./members.controller');

const router = express.Router();

router.use(authenticate);

router.get('/me', membersController.getMe);
router.patch('/me/device', validate(patchDeviceSchema), membersController.updateDevice);

module.exports = router;
