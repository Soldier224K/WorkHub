const logger = require('../shared/logger');

let firebaseAdmin = null;

const path = require('path');
const fs = require('fs');

const initFirebase = () => {
  try {
    let serviceAccount = null;
    const defaultFilePath = path.resolve(__dirname, '../../serviceAccountKey.json');
    const customFilePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH 
      ? path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
      : null;

    if (customFilePath && fs.existsSync(customFilePath)) {
      serviceAccount = JSON.parse(fs.readFileSync(customFilePath, 'utf8'));
    } else if (fs.existsSync(defaultFilePath)) {
      serviceAccount = JSON.parse(fs.readFileSync(defaultFilePath, 'utf8'));
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    }

    if (serviceAccount) {
      const admin = require('firebase-admin');
      firebaseAdmin = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      logger.info('🔥 Firebase Admin SDK initialized with real credentials');
    } else {
      logger.info('ℹ️ Running with Mock Firebase Provider (drop serviceAccountKey.json into /api or set FIREBASE_SERVICE_ACCOUNT_KEY for live push)');
    }
  } catch (err) {
    logger.warn({ err }, '⚠️ Failed to initialize Firebase Admin SDK, falling back to mock provider');
  }
};

const sendPushNotification = async ({ tokens, title, body, data = {} }) => {
  if (!tokens || tokens.length === 0) {
    return { successCount: 0, failureCount: 0 };
  }

  if (firebaseAdmin) {
    try {
      const response = await firebaseAdmin.messaging().sendEachForMulticast({
        tokens,
        notification: { title, body },
        data: Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, String(v)])
        ),
      });
      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (err) {
      logger.error({ err }, 'Firebase sendEachForMulticast error');
      return { successCount: 0, failureCount: tokens.length };
    }
  }

  // Mock provider: Log notification
  logger.info({
    tokensCount: tokens.length,
    title,
    body,
    data,
  }, '📱 [MOCK PUSH NOTIFICATION SENT]');

  return { successCount: tokens.length, failureCount: 0 };
};

module.exports = {
  initFirebase,
  sendPushNotification,
};
