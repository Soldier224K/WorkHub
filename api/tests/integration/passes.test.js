const request = require('supertest');
const app = require('../../src/app');
const { connectDB, disconnectDB } = require('../../src/config/db');
const Member = require('../../src/modules/members/member.model');
const Pass = require('../../src/modules/passes/pass.model');
const Transaction = require('../../src/modules/revenue/transaction.model');
const authService = require('../../src/modules/auth/auth.service');
const { runPassRenewal } = require('../../src/jobs/passRenewal.job');
const { PASS_PLANS, PASS_STATUS } = require('../../src/config/constants');

describe('Integration: Subscription Passes & Renewal Idempotency', () => {
  let member;

  beforeAll(async () => {
    await connectDB();

    member = await authService.register({
      name: 'Pass Test Member',
      email: `pass_test_${Date.now()}@workhub.io`,
      password: 'Password123!',
    });
  });

  afterAll(async () => {
    if (member) {
      await Pass.deleteMany({ member: member.user.id });
      await Transaction.deleteMany({ member: member.user.id });
      await Member.findByIdAndDelete(member.user.id);
    }
    await disconnectDB();
  });

  test('POST /api/v1/passes purchases an active subscription pass', async () => {
    const res = await request(app)
      .post('/api/v1/passes')
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({
        plan: PASS_PLANS.HOT_DESK_MONTHLY,
        price: 299,
        renewDay: 1,
        autoRenew: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe(PASS_STATUS.ACTIVE);
    expect(res.body.data.plan).toBe(PASS_PLANS.HOT_DESK_MONTHLY);
  });

  test('POST /api/v1/passes rejects concurrent/duplicate active pass for same member', async () => {
    const res = await request(app)
      .post('/api/v1/passes')
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({
        plan: PASS_PLANS.DAY_PASS,
        price: 35,
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test('runPassRenewal() job is strictly idempotent when run multiple times', async () => {
    const pass = await Pass.findOne({ member: member.user.id });
    expect(pass).toBeDefined();

    // Artificially set nextRenewalAt to yesterday and clear initial transaction
    pass.nextRenewalAt = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await pass.save();
    await Transaction.deleteMany({ 'refs.pass': pass._id });

    // Run 1: Should renew pass
    const run1 = await runPassRenewal();
    expect(run1.renewedCount).toBe(1);

    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const transactionsAfterFirst = await Transaction.countDocuments({
      'refs.pass': pass._id,
      period,
    });
    expect(transactionsAfterFirst).toBe(1);

    // Reset nextRenewalAt to past again to simulate accidental re-run in same period
    pass.nextRenewalAt = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await pass.save();

    // Run 2: Sweeper runs again, idempotency key prevents duplicate transaction!
    await runPassRenewal();

    const transactionsAfterSecond = await Transaction.countDocuments({
      'refs.pass': pass._id,
      period,
    });
    // Still exactly 1 transaction! Never double-charged!
    expect(transactionsAfterSecond).toBe(1);
  });
});
