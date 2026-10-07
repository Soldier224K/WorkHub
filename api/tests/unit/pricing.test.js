const { calculatePrice } = require('../../src/modules/bookings/pricing.service');
const Pass = require('../../src/modules/passes/pass.model');
const { SPACE_TYPES, PASS_PLANS, PASS_STATUS } = require('../../src/config/constants');

jest.mock('../../src/modules/passes/pass.model');

describe('Unit: Pricing Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('calculates standard hourly price without pass', async () => {
    Pass.findOne.mockResolvedValue(null);

    const space = {
      type: SPACE_TYPES.MEETING_ROOM,
      hourlyRate: 50,
    };
    const start = new Date('2026-10-04T10:00:00Z');
    const end = new Date('2026-10-04T12:00:00Z'); // 2 hours

    const result = await calculatePrice({
      memberId: 'member123',
      space,
      start,
      end,
    });

    expect(result.durationHours).toBe(2);
    expect(result.basePrice).toBe(100);
    expect(result.discount).toBe(0);
    expect(result.finalPrice).toBe(100);
    expect(result.passCovered).toBe(false);
  });

  test('applies 100% discount when member has active Hot Desk pass for a desk', async () => {
    Pass.findOne.mockResolvedValue({
      _id: 'pass_mock_1',
      plan: PASS_PLANS.HOT_DESK_MONTHLY,
      status: PASS_STATUS.ACTIVE,
    });

    const space = {
      type: SPACE_TYPES.DESK,
      hourlyRate: 15,
    };
    const start = new Date('2026-10-04T10:00:00Z');
    const end = new Date('2026-10-04T13:00:00Z'); // 3 hours

    const result = await calculatePrice({
      memberId: 'member123',
      space,
      start,
      end,
    });

    expect(result.basePrice).toBe(45);
    expect(result.discount).toBe(45);
    expect(result.finalPrice).toBe(0);
    expect(result.passCovered).toBe(true);
  });
});
