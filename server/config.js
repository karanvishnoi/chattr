require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

module.exports = {
  PORT: process.env.PORT || 3001,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/chattr',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  NODE_ENV: process.env.NODE_ENV || 'development',

  STUN_SERVERS: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],

  // Moderation
  MAX_MESSAGES_PER_MINUTE: 30,
  REPORTS_FOR_BAN: 3,
  REPORT_WINDOW_MS: 60 * 60 * 1000, // 1 hour
  BAN_DURATION_MS: 24 * 60 * 60 * 1000, // 24 hours

  // Matchmaking
  INTEREST_MATCH_TIMEOUT_MS: 5000, // 5 seconds before falling back to random
};
