const request = require('supertest');
const app = require('../../src/app');
const { connectDB, disconnectDB } = require('../../src/config/db');
const Member = require('../../src/modules/members/member.model');
const Space = require('../../src/modules/spaces/space.model');
const Booking = require('../../src/modules/bookings/booking.model');
const authService = require('../../src/modules/auth/auth.service');
const { SPACE_TYPES, ERROR_CODES } = require('../../src/config/constants');

describe('Concurrency Test: 20 Parallel Bookings for Identical Slot', () => {
  let space;
  let tokens = [];
  const testSlotStart = '2027-05-10T10:00:00.000Z';
  const testSlotEnd = '2027-05-10T11:00:00.000Z';

  beforeAll(async () => {
    await connectDB();

    // Create a dedicated workspace
    space = await Space.create({
      name: 'Concurrency Test Desk',
      type: SPACE_TYPES.DESK,
      location: 'Downtown',
      floor: 1,
      capacity: 1,
      hourlyRate: 20,
      operatingHours: { open: '08:00', close: '20:00', days: [0, 1, 2, 3, 4, 5, 6] },
      requiresApproval: false,
    });

    // Register 20 test users in parallel
    const userPromises = [];
    for (let i = 1; i <= 20; i++) {
      userPromises.push(
        authService.register({
          name: `Concurrency Member ${i}`,
          email: `race_user_${i}_${Date.now()}@workhub.io`,
          password: 'Password123!',
          company: 'Racing Inc',
        })
      );
    }

    const registeredUsers = await Promise.all(userPromises);
    tokens = registeredUsers.map((u) => u.accessToken);
  });

  afterAll(async () => {
    if (space) {
      await Booking.deleteMany({ resource: space._id });
      await Space.findByIdAndDelete(space._id);
    }
    await Member.deleteMany({ email: /race_user_/ });
    await disconnectDB();
  });

  test('exactly 1 request wins (201) and 19 fail with SLOT_TAKEN (409)', async () => {
    // 20 parallel booking requests hitting the API at the exact same millisecond
    const requests = tokens.map((token) =>
      request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          resource: space._id.toString(),
          start: testSlotStart,
          end: testSlotEnd,
          notes: 'High contention slot request',
        })
    );

    const responses = await Promise.all(requests);

    const successes = responses.filter((r) => r.status === 201);
    const conflicts = responses.filter((r) => r.status === 409);

    console.log(`\n🏎️ Concurrency Test Result: ${successes.length} Winner, ${conflicts.length} Rejected (SLOT_TAKEN)\n`);

    // Flagship Assertions
    expect(successes).toHaveLength(1);
    expect(conflicts).toHaveLength(19);

    // Verify all 19 conflicts returned the stable error code
    conflicts.forEach((res) => {
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe(ERROR_CODES.SLOT_TAKEN);
    });

    // Verify database integrity: exactly 1 booking exists with holding: true
    const dbBookings = await Booking.find({
      resource: space._id,
      holding: true,
      start: new Date(testSlotStart),
    });

    expect(dbBookings).toHaveLength(1);
  });
});
