const asyncHandler = require('../../shared/asyncHandler');
const { success } = require('../../shared/respond');
const reportsService = require('./reports.service');

const getUtilization = asyncHandler(async (req, res) => {
  const result = await reportsService.getUtilization({
    from: req.query.from,
    to: req.query.to,
    location: req.query.location,
  });
  return success(res, result);
});

const getRevenue = asyncHandler(async (req, res) => {
  const result = await reportsService.getRevenue({
    from: req.query.from,
    to: req.query.to,
  });
  return success(res, result);
});

const getHeatmap = asyncHandler(async (req, res) => {
  const result = await reportsService.getHeatmap({
    location: req.query.location,
  });
  return success(res, result);
});

module.exports = {
  getUtilization,
  getRevenue,
  getHeatmap,
};
