const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { connectDB, disconnectDB } = require('../config/db');
const Member = require('../modules/members/member.model');
const Space = require('../modules/spaces/space.model');
const Booking = require('../modules/bookings/booking.model');
const Pass = require('../modules/passes/pass.model');
const Amenity = require('../modules/amenities/amenity.model');
const Guest = require('../modules/guests/guest.model');
const Transaction = require('../modules/revenue/transaction.model');
const Notification = require('../modules/notifications/notification.model');
const { ROLES, SPACE_TYPES, BOOKING_STATUS, PASS_PLANS, PASS_STATUS, GUEST_STATUS, TRANSACTION_TYPES, AMENITY_KINDS } = require('../config/constants');
const { toSlotKeys } = require('../shared/slots');
const { generateBookingQrToken, generateGuestQrToken } = require('../shared/qrToken');

const seedData = async () => {
  try {
    await connectDB();
    console.log('🧹 Purging existing database collections...');

    await Promise.all([
      Member.deleteMany({}),
      Space.deleteMany({}),
      Booking.deleteMany({}),
      Pass.deleteMany({}),
      Amenity.deleteMany({}),
      Guest.deleteMany({}),
      Transaction.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    console.log('🌱 Seeding users (Manager & Members)...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password123!', salt);

    const [manager, sarah, alex, elena] = await Member.create([
      {
        name: 'Marcus Vance',
        email: 'manager@workhub.io',
        passwordHash,
        role: ROLES.MANAGER,
        company: 'WorkHub HQ',
        deviceTokens: ['fcm_token_manager_dev_1'],
      },
      {
        name: 'Sarah Connor',
        email: 'sarah@cyberdyne.io',
        passwordHash,
        role: ROLES.MEMBER,
        company: 'Cyberdyne Systems',
        deviceTokens: ['fcm_token_sarah_dev_1'],
      },
      {
        name: 'Alex Rivera',
        email: 'alex@acme.com',
        passwordHash,
        role: ROLES.MEMBER,
        company: 'Acme Ventures',
        deviceTokens: ['fcm_token_alex_dev_1'],
      },
      {
        name: 'Elena Rostova',
        email: 'elena@starlight.io',
        passwordHash,
        role: ROLES.MEMBER,
        company: 'Starlight Studio',
      },
    ]);

    console.log('🌱 Seeding Spaces with Floor Layout Coordinates...');
    // Create an architecturally styled grid of desks and conference rooms
    const spacesToCreate = [];
    const location = 'Downtown';

    // Desks Row A (A1 - A8)
    for (let i = 1; i <= 8; i++) {
      spacesToCreate.push({
        name: `Desk A${i}`,
        type: SPACE_TYPES.DESK,
        location,
        floor: 1,
        capacity: 1,
        hourlyRate: 15,
        operatingHours: { open: '08:00', close: '20:00', days: [0, 1, 2, 3, 4, 5, 6] },
        requiresApproval: false,
        features: ['Dual 4K Monitor', 'Standing Desk', 'USB-C Hub'],
        layout: {
          x: 60 + (i - 1) * 75,
          y: 80,
          w: 60,
          h: 40,
          rot: 0,
        },
      });
    }

    // Desks Row B (B1 - B8)
    for (let i = 1; i <= 8; i++) {
      spacesToCreate.push({
        name: `Desk B${i}`,
        type: SPACE_TYPES.DESK,
        location,
        floor: 1,
        capacity: 1,
        hourlyRate: 15,
        operatingHours: { open: '08:00', close: '20:00', days: [0, 1, 2, 3, 4, 5, 6] },
        requiresApproval: false,
        features: ['Standing Desk', 'Quiet Zone', 'Herman Miller Aeron'],
        layout: {
          x: 60 + (i - 1) * 75,
          y: 160,
          w: 60,
          h: 40,
          rot: 0,
        },
      });
    }

    // Desks Row C (C1 - C8)
    for (let i = 1; i <= 8; i++) {
      spacesToCreate.push({
        name: `Desk C${i}`,
        type: SPACE_TYPES.DESK,
        location,
        floor: 1,
        capacity: 1,
        hourlyRate: 15,
        operatingHours: { open: '08:00', close: '20:00', days: [0, 1, 2, 3, 4, 5, 6] },
        requiresApproval: false,
        features: ['Window View', 'Wireless Charger'],
        layout: {
          x: 60 + (i - 1) * 75,
          y: 240,
          w: 60,
          h: 40,
          rot: 0,
        },
      });
    }

    // Meeting Room Alpha
    spacesToCreate.push({
      name: 'Meeting Room Alpha',
      type: SPACE_TYPES.MEETING_ROOM,
      location,
      floor: 1,
      capacity: 6,
      hourlyRate: 50,
      operatingHours: { open: '08:00', close: '20:00', days: [0, 1, 2, 3, 4, 5, 6] },
      requiresApproval: false,
      features: ['75" 4K Presentation Screen', 'Polycom Video Bar', 'Glass Whiteboard'],
      layout: {
        x: 60,
        y: 330,
        w: 180,
        h: 110,
        rot: 0,
      },
    });

    // Meeting Room Beta
    spacesToCreate.push({
      name: 'Boardroom Beta',
      type: SPACE_TYPES.MEETING_ROOM,
      location,
      floor: 1,
      capacity: 12,
      hourlyRate: 90,
      operatingHours: { open: '08:00', close: '20:00', days: [0, 1, 2, 3, 4, 5, 6] },
      requiresApproval: true,
      features: ['Dual Screens', 'Acoustic Wall Panels', 'Catering Prep Area'],
      layout: {
        x: 270,
        y: 330,
        w: 220,
        h: 110,
        rot: 0,
      },
    });

    // Team Room Solarium
    spacesToCreate.push({
      name: 'Team Studio Solarium',
      type: SPACE_TYPES.TEAM_ROOM,
      location,
      floor: 1,
      capacity: 10,
      hourlyRate: 120,
      operatingHours: { open: '08:00', close: '20:00', days: [0, 1, 2, 3, 4, 5, 6] },
      requiresApproval: true,
      features: ['Dedicated Fiber Line', 'Private Lounge', 'Sonos Sound System'],
      layout: {
        x: 520,
        y: 330,
        w: 160,
        h: 110,
        rot: 0,
      },
    });

    const spaces = await Space.create(spacesToCreate);
    const deskA1 = spaces.find((s) => s.name === 'Desk A1');
    const deskA2 = spaces.find((s) => s.name === 'Desk A2');
    const deskB3 = spaces.find((s) => s.name === 'Desk B3');
    const roomAlpha = spaces.find((s) => s.name === 'Meeting Room Alpha');

    console.log('🌱 Seeding Passes...');
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const sarahPass = await Pass.create({
      member: sarah._id,
      plan: PASS_PLANS.HOT_DESK_MONTHLY,
      price: 299,
      renewDay: 1,
      autoRenew: true,
      status: PASS_STATUS.ACTIVE,
      nextRenewalAt: nextMonth,
      lastRenewedPeriod: period,
    });

    await Transaction.create({
      type: TRANSACTION_TYPES.PASS_RENEWAL,
      amount: 299,
      member: sarah._id,
      refs: { pass: sarahPass._id },
      period,
    });

    console.log('🌱 Seeding Amenities...');
    await Amenity.create([
      { name: 'Specialty Espresso Bar', kind: AMENITY_KINDS.USAGE, location, unitPrice: 4, units: 'cup' },
      { name: 'Podcast Studio Pro Mic Setup', kind: AMENITY_KINDS.SLOT, location, unitPrice: 25, units: 'hour' },
      { name: '4K Color-Accurate Production Monitor', kind: AMENITY_KINDS.SLOT, location, unitPrice: 10, units: 'day' },
      { name: 'Private Phone Booth', kind: AMENITY_KINDS.SLOT, location, unitPrice: 0, units: 'hour' },
    ]);

    console.log('🌱 Seeding Bookings & public Guest pass...');
    // Today's date aligned
    const today = new Date();
    const startHour1 = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 10, 0, 0));
    const endHour1 = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 12, 0, 0));
    const slotKeys1 = toSlotKeys(startHour1, endHour1);

    const booking1 = new Booking({
      member: sarah._id,
      resource: deskA1._id,
      start: startHour1,
      end: endHour1,
      slotKeys: slotKeys1,
      holding: true,
      status: BOOKING_STATUS.CONFIRMED,
      price: 0, // Covered by hot desk pass
      notes: 'Focus morning block',
    });
    booking1.qrToken = generateBookingQrToken(booking1._id, endHour1);
    await booking1.save();

    // Meeting Room booking with a guest
    const startHour2 = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 14, 0, 0));
    const endHour2 = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 16, 0, 0));
    const slotKeys2 = toSlotKeys(startHour2, endHour2);

    const booking2 = new Booking({
      member: alex._id,
      resource: roomAlpha._id,
      start: startHour2,
      end: endHour2,
      slotKeys: slotKeys2,
      holding: true,
      status: BOOKING_STATUS.CONFIRMED,
      price: 100,
      notes: 'Quarterly review presentation',
    });
    booking2.qrToken = generateBookingQrToken(booking2._id, endHour2);
    await booking2.save();

    await Transaction.create({
      type: TRANSACTION_TYPES.BOOKING_PAYMENT,
      amount: 100,
      member: alex._id,
      refs: { booking: booking2._id },
    });

    const guestId = new mongoose.Types.ObjectId();
    const guestQrToken = generateGuestQrToken(guestId);
    const guest = await Guest.create({
      _id: guestId,
      invitedBy: alex._id,
      booking: booking2._id,
      name: 'John Anderson',
      email: 'john.anderson@matrix.io',
      qrToken: guestQrToken,
      status: GUEST_STATUS.INVITED,
    });

    console.log('✅ Seed completed successfully!');
    console.log('--------------------------------------------------');
    console.log('Credentials:');
    console.log('  Manager: manager@workhub.io / Password123!');
    console.log('  Member:  sarah@cyberdyne.io / Password123!');
    console.log('  Member:  alex@acme.com / Password123!');
    console.log('  Public Guest Pass URL:');
    console.log(`  http://localhost:4000/api/v1/guests/pass/${guest.qrToken}`);
    console.log('--------------------------------------------------');

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
};

seedData();
