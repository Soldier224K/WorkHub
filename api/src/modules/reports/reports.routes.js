const express = require('express');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const { ROLES } = require('../../config/constants');
const reportsController = require('./reports.controller');

const router = express.Router();

router.use(authenticate);
router.use(authorize(ROLES.MANAGER));

router.get('/utilization', reportsController.getUtilization);
router.get('/revenue', reportsController.getRevenue);
router.get('/heatmap', reportsController.getHeatmap);

module.exports = router;
