const cron = require('node-cron');
const Pass = require('../modules/passes/pass.model');
const { PASS_STATUS } = require('../config/constants');
const { recordPassRenewal } = require('../modules/revenue/ledger.service');
const { emitPassRenewed } = require('../sockets/emitters');
const { notifyMember } = require('../modules/notifications/notify.service');
const logger = require('../shared/logger');

const runPassRenewal = async () => {
  const now = new Date();
  logger.info('🔄 Running pass renewal sweeper...');

  const duePasses = await Pass.find({
    status: PASS_STATUS.ACTIVE,
    autoRenew: true,
    nextRenewalAt: { $lte: now },
  });

  let renewedCount = 0;

  for (const pass of duePasses) {
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    try {
      // Unique sparse index on { 'refs.pass': 1, period: 1 } ensures idempotency
      await recordPassRenewal({
        memberId: pass.member,
        passId: pass._id,
        amount: pass.price,
        period,
      });

      // Advance next renewal date by 1 month
      const nextDate = new Date(pass.nextRenewalAt);
      nextDate.setMonth(nextDate.getMonth() + 1);
      pass.nextRenewalAt = nextDate;
      pass.lastRenewedPeriod = period;
      await pass.save();

      renewedCount++;

      emitPassRenewed({
        memberId: pass.member.toString(),
        passId: pass._id.toString(),
        period,
      });

      await notifyMember({
        memberId: pass.member,
        title: 'Pass Auto-Renewed',
        body: `Your subscription pass has renewed for period ${period}.`,
        data: { passId: pass._id.toString() },
      });
    } catch (err) {
      if (err.code === 11000) {
        logger.warn({ passId: pass._id, period }, 'Pass already renewed for this period (idempotent skipped)');
      } else {
        logger.error({ err, passId: pass._id }, 'Error renewing pass');
      }
    }
  }

  logger.info(`✅ Pass renewal sweeper finished: ${renewedCount} passes renewed.`);
  return { renewedCount };
};

const startPassRenewalJob = () => {
  // Daily at 00:05
  return cron.schedule('5 0 * * *', runPassRenewal);
};

module.exports = {
  runPassRenewal,
  startPassRenewalJob,
};
