const Report = require('./models/Report');
const BannedIP = require('./models/BannedIP');
const {
  MAX_MESSAGES_PER_MINUTE,
  REPORTS_FOR_BAN,
  REPORT_WINDOW_MS,
  BAN_DURATION_MS,
} = require('./config');

// Bad words list — a reasonable starter set
const BAD_WORDS = [
  'fuck', 'shit', 'ass', 'bitch', 'dick', 'pussy', 'cock', 'cunt',
  'nigger', 'nigga', 'faggot', 'retard', 'whore', 'slut',
];

// Build regex for whole-word matching
const badWordRegex = new RegExp(
  `\\b(${BAD_WORDS.join('|')})\\b`,
  'gi'
);

function filterMessage(text) {
  return text.replace(badWordRegex, (match) => '*'.repeat(match.length));
}

// Rate limiting — track message counts per socket
const messageCounts = new Map(); // socketId -> { count, resetAt }

function checkRateLimit(socketId) {
  const now = Date.now();
  let entry = messageCounts.get(socketId);

  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + 60000 };
    messageCounts.set(socketId, entry);
  }

  entry.count++;
  return entry.count <= MAX_MESSAGES_PER_MINUTE;
}

function clearRateLimit(socketId) {
  messageCounts.delete(socketId);
}

// IP ban check
async function isIPBanned(ip) {
  const ban = await BannedIP.findOne({
    ip,
    expiresAt: { $gt: new Date() },
  });
  return !!ban;
}

// Report handling
async function reportUser(reporterIp, reportedIp, reportedSocketId, reason, roomId) {
  // Save report
  await Report.create({
    reporterIp,
    reportedIp,
    reportedSocketId,
    reason,
    roomId,
  });

  // Check if auto-ban threshold reached
  const cutoff = new Date(Date.now() - REPORT_WINDOW_MS);
  const recentReports = await Report.countDocuments({
    reportedIp,
    createdAt: { $gte: cutoff },
  });

  if (recentReports >= REPORTS_FOR_BAN) {
    // Ban the IP
    await BannedIP.findOneAndUpdate(
      { ip: reportedIp },
      {
        ip: reportedIp,
        reason: `auto-ban: ${recentReports} reports in 1 hour`,
        expiresAt: new Date(Date.now() + BAN_DURATION_MS),
      },
      { upsert: true }
    );
    return { banned: true, recentReports };
  }

  return { banned: false, recentReports };
}

module.exports = {
  filterMessage,
  checkRateLimit,
  clearRateLimit,
  isIPBanned,
  reportUser,
};
