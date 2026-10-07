const Space = require('./space.model');
const Booking = require('../bookings/booking.model');
const ApiError = require('../../shared/ApiError');
const { ERROR_CODES, SLOT_CONFIG } = require('../../config/constants');
const { formatDateToSlotKey } = require('../../shared/slots');

const listSpaces = async ({ location, type, floor, page = 1, limit = 50 }) => {
  const query = {};
  if (location) query.location = new RegExp(`^${location}$`, 'i');
  if (type) query.type = type;
  if (floor !== undefined) query.floor = floor;

  const skip = (page - 1) * limit;

  const [spaces, total] = await Promise.all([
    Space.find(query).sort({ floor: 1, name: 1 }).skip(skip).limit(limit),
    Space.countDocuments(query),
  ]);

  return {
    spaces,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getSpaceById = async (id) => {
  const space = await Space.findById(id);
  if (!space) {
    throw ApiError.notFound('Space not found', ERROR_CODES.NOT_FOUND);
  }
  return space;
};

const createSpace = async (data) => {
  const space = await Space.create(data);
  return space;
};

const updateSpace = async (id, data) => {
  const space = await Space.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!space) {
    throw ApiError.notFound('Space not found', ERROR_CODES.NOT_FOUND);
  }
  return space;
};

const getAvailability = async ({ location, date, memberId = null }) => {
  // Parse date window
  const startOfDay = new Date(`${date}T00:00:00.000Z`);
  const endOfDay = new Date(`${date}T23:59:59.999Z`);

  const spaces = await Space.find({
    location: new RegExp(`^${location}$`, 'i'),
  }).sort({ floor: 1, name: 1 });

  if (spaces.length === 0) {
    return {
      location,
      date,
      operatingWindow: { open: '08:00', close: '20:00', slotMinutes: SLOT_CONFIG.SLOT_MINUTES, totalSlots: 24 },
      spaces: [],
    };
  }

  const spaceIds = spaces.map((s) => s._id);

  // Fetch holding bookings for these spaces on this date
  const bookings = await Booking.find({
    resource: { $in: spaceIds },
    holding: true,
    start: { $lt: endOfDay },
    end: { $gt: startOfDay },
  }).select('resource slotKeys start end member status');

  // Group booked slots by space
  const bookingsBySpace = {};
  for (const b of bookings) {
    const sId = b.resource.toString();
    if (!bookingsBySpace[sId]) {
      bookingsBySpace[sId] = [];
    }
    bookingsBySpace[sId].push({
      bookingId: b._id,
      memberId: b.member.toString(),
      isYours: memberId ? b.member.toString() === memberId.toString() : false,
      slotKeys: b.slotKeys,
      status: b.status,
    });
  }

  // Common operating window (or default 08:00 - 20:00)
  const defaultOpen = spaces[0]?.operatingHours?.open || '08:00';
  const defaultClose = spaces[0]?.operatingHours?.close || '20:00';

  const [openH, openM] = defaultOpen.split(':').map(Number);
  const [closeH, closeM] = defaultClose.split(':').map(Number);
  const totalSlots = Math.floor(((closeH * 60 + closeM) - (openH * 60 + openM)) / SLOT_CONFIG.SLOT_MINUTES);

  const spacesAvailability = spaces.map((space) => {
    const spaceBookings = bookingsBySpace[space._id.toString()] || [];
    const allBookedSlotKeys = new Set();
    const yourSlotKeys = new Set();
    let pendingApproval = false;

    for (const b of spaceBookings) {
      for (const slot of b.slotKeys) {
        allBookedSlotKeys.add(slot);
        if (b.isYours) {
          yourSlotKeys.add(slot);
        }
      }
      if (b.status === 'pending') {
        pendingApproval = true;
      }
    }

    // Convert slot keys to indices relative to operating window
    const bookedSlotIndices = [];
    allBookedSlotKeys.forEach((key) => {
      // Key format: YYYY-MM-DDTHH:mm
      if (key.startsWith(date)) {
        const timePart = key.split('T')[1];
        const [h, m] = timePart.split(':').map(Number);
        const slotIdx = Math.floor(((h * 60 + m) - (openH * 60 + openM)) / SLOT_CONFIG.SLOT_MINUTES);
        if (slotIdx >= 0 && slotIdx < totalSlots) {
          bookedSlotIndices.push(slotIdx);
        }
      }
    });

    return {
      id: space._id,
      name: space.name,
      type: space.type,
      location: space.location,
      floor: space.floor,
      capacity: space.capacity,
      hourlyRate: space.hourlyRate,
      requiresApproval: space.requiresApproval,
      features: space.features,
      layout: space.layout,
      bookedSlotKeys: Array.from(allBookedSlotKeys),
      bookedSlotIndices: bookedSlotIndices.sort((a, b) => a - b),
      yourSlotKeys: Array.from(yourSlotKeys),
      hasPending: pendingApproval,
    };
  });

  return {
    location,
    date,
    operatingWindow: {
      open: defaultOpen,
      close: defaultClose,
      slotMinutes: SLOT_CONFIG.SLOT_MINUTES,
      totalSlots,
    },
    spaces: spacesAvailability,
  };
};

module.exports = {
  listSpaces,
  getSpaceById,
  createSpace,
  updateSpace,
  getAvailability,
};
