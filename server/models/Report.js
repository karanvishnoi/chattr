const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporterIp: { type: String, required: true },
  reportedIp: { type: String, required: true },
  reportedSocketId: { type: String, required: true },
  reason: {
    type: String,
    enum: ['inappropriate', 'spam', 'underage', 'harassment', 'other'],
    required: true,
  },
  roomId: { type: String },
  createdAt: { type: Date, default: Date.now, expires: 7 * 24 * 60 * 60 }, // TTL: 7 days
});

reportSchema.index({ reportedIp: 1, createdAt: 1 });

module.exports = mongoose.model('Report', reportSchema);
