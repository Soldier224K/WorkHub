const express = require('express');
const authenticate = require('../../middleware/authenticate');
const validate = require('../../middleware/validate');
const { createPassSchema, getUserPassesSchema } = require('./passes.schema');
const passesController = require('./passes.controller');

const router = express.Router();

router.use(authenticate);

router.post('/', validate(createPassSchema), passesController.createPass);
router.get('/', passesController.listPasses);
router.get('/user/:id', validate(getUserPassesSchema), passesController.getPassesByUser);

module.exports = router;
