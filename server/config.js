require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

module.exports = {
  PORT: process.env.PORT || 3001,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/chattr',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'chattr-secret-key-change-in-production',

  // Razorpay
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',

  STUN_SERVERS: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],

  // Moderation
  MAX_MESSAGES_PER_MINUTE: 30,
  REPORTS_FOR_BAN: 3,
  REPORT_WINDOW_MS: 60 * 60 * 1000,
  BAN_DURATION_MS: 24 * 60 * 60 * 1000,

  // Free plan limits
  FREE_VIDEO_DAILY_MINUTES: 30,
};
