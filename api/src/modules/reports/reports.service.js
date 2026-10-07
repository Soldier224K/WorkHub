const Booking = require('../bookings/booking.model');
const Space = require('../spaces/space.model');
const Transaction = require('../revenue/transaction.model');
const { BOOKING_STATUS } = require('../../config/constants');

const getUtilization = async ({ from, to, location }) => {
  const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const toDate = to ? new Date(to) : new Date();

  // Find spaces matching location
  const spaceMatch = {};
  if (location) {
    spaceMatch.location = new RegExp(`^${location}$`, 'i');
  }
  const spaces = await Space.find(spaceMatch);
  const spaceIds = spaces.map((s) => s._id);

  // Aggregation pipeline: compute total booked minutes per space
  const utilizationData = await Booking.aggregate([
    {
      $match: {
        resource: { $in: spaceIds },
        start: { $gte: fromDate, $lte: toDate },
        status: { $in: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.CHECKED_IN, BOOKING_STATUS.COMPLETED] },
      },
    },
    {
      $project: {
        resource: 1,
        durationMinutes: {
          $divide: [{ $subtract: ['$end', '$start'] }, 1000 * 60],
        },
      },
    },
    {
      $group: {
        _id: '$resource',
        totalBookedMinutes: { $sum: '$durationMinutes' },
        bookingCount: { $sum: 1 },
      },
    },
  ]);

  const daysInRange = Math.max(1, Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)));

  const spaceLookup = {};
  spaces.forEach((s) => {
    // Default 12 hours operating per day = 720 minutes
    const availableMinutes = daysInRange * 720;
    spaceLookup[s._id.toString()] = {
      id: s._id,
      name: s.name,
      type: s.type,
      location: s.location,
      capacity: s.capacity,
      availableMinutes,
      totalBookedMinutes: 0,
      bookingCount: 0,
      utilizationRate: 0,
    };
  });

  let grandTotalBooked = 0;
  let grandTotalAvailable = 0;

  utilizationData.forEach((row) => {
    const sId = row._id.toString();
    if (spaceLookup[sId]) {
      spaceLookup[sId].totalBookedMinutes = row.totalBookedMinutes;
      spaceLookup[sId].bookingCount = row.bookingCount;
      spaceLookup[sId].utilizationRate = Math.min(
        100,
        Math.round((row.totalBookedMinutes / spaceLookup[sId].availableMinutes) * 1000) / 10
      );
      grandTotalBooked += row.totalBookedMinutes;
    }
  });

  spaces.forEach((s) => {
    grandTotalAvailable += spaceLookup[s._id.toString()].availableMinutes;
  });

  const overallUtilization = grandTotalAvailable > 0
    ? Math.round((grandTotalBooked / grandTotalAvailable) * 1000) / 10
    : 0;

  return {
    period: { from: fromDate.toISOString(), to: toDate.toISOString(), days: daysInRange },
    overallUtilization,
    spaces: Object.values(spaceLookup),
  };
};

const getRevenue = async ({ from, to }) => {
  const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const toDate = to ? new Date(to) : new Date();

  const revenueData = await Transaction.aggregate([
    {
      $match: {
        createdAt: { $gte: fromDate, $lte: toDate },
      },
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          type: '$type',
        },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { '_id.date': 1 },
    },
  ]);

  // Aggregate summary
  let totalPayments = 0;
  let totalRefunds = 0;
  let totalPassRenewals = 0;
  let totalAmenityCharges = 0;

  const timelineMap = {};

  revenueData.forEach((item) => {
    const date = item._id.date;
    const type = item._id.type;
    const amount = item.totalAmount;

    if (!timelineMap[date]) {
      timelineMap[date] = { date, payments: 0, refunds: 0, passes: 0, amenities: 0, net: 0 };
    }

    if (type === 'booking_payment') {
      totalPayments += amount;
      timelineMap[date].payments += amount;
      timelineMap[date].net += amount;
    } else if (type === 'booking_refund') {
      totalRefunds += amount;
      timelineMap[date].refunds += amount;
      timelineMap[date].net -= amount;
    } else if (type === 'pass_renewal') {
      totalPassRenewals += amount;
      timelineMap[date].passes += amount;
      timelineMap[date].net += amount;
    } else if (type === 'amenity_charge') {
      totalAmenityCharges += amount;
      timelineMap[date].amenities += amount;
      timelineMap[date].net += amount;
    }
  });

  const netRevenue = totalPayments + totalPassRenewals + totalAmenityCharges - totalRefunds;

  return {
    summary: {
      totalPayments: Math.round(totalPayments * 100) / 100,
      totalRefunds: Math.round(totalRefunds * 100) / 100,
      totalPassRenewals: Math.round(totalPassRenewals * 100) / 100,
      totalAmenityCharges: Math.round(totalAmenityCharges * 100) / 100,
      netRevenue: Math.round(netRevenue * 100) / 100,
    },
    timeline: Object.values(timelineMap),
  };
};

const getHeatmap = async ({ location }) => {
  const match = {
    status: { $in: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.CHECKED_IN, BOOKING_STATUS.COMPLETED] },
  };

  if (location) {
    const spaces = await Space.find({ location: new RegExp(`^${location}$`, 'i') });
    match.resource = { $in: spaces.map((s) => s._id) };
  }

  // Database-side aggregation for Day of Week (1 = Sun ... 7 = Sat) and Hour (0-23)
  const heatmapAgg = await Booking.aggregate([
    { $match: match },
    {
      $project: {
        dayOfWeek: { $dayOfWeek: '$start' }, // 1=Sun, 2=Mon ... 7=Sat
        hour: { $hour: '$start' },
      },
    },
    {
      $group: {
        _id: { dayOfWeek: '$dayOfWeek', hour: '$hour' },
        count: { $sum: 1 },
      },
    },
  ]);

  // Construct complete 7 x 24 grid
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const grid = [];
  let maxCount = 0;

  for (let d = 1; d <= 7; d++) {
    for (let h = 0; h < 24; h++) {
      const matchItem = heatmapAgg.find((item) => item._id.dayOfWeek === d && item._id.hour === h);
      const count = matchItem ? matchItem.count : 0;
      if (count > maxCount) maxCount = count;
      grid.push({
        dayOfWeek: d,
        dayName: days[d - 1],
        hour: h,
        count,
        intensity: 0,
      });
    }
  }

  // Compute normalized intensity 0.0 - 1.0
  grid.forEach((cell) => {
    cell.intensity = maxCount > 0 ? Math.round((cell.count / maxCount) * 100) / 100 : 0;
  });

  return {
    location: location || 'All Locations',
    maxCount,
    grid,
  };
};

module.exports = {
  getUtilization,
  getRevenue,
  getHeatmap,
};
