const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  displayName: {
    type: String,
    trim: true,
    default: 'Anonymous',
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true,
  },
  genderPreference: {
    type: String,
    enum: ['male', 'female', 'any'],
    default: 'any',
  },
  // Subscription
  plan: {
    type: String,
    enum: ['free', 'premium', 'pro'],
    default: 'free',
  },
  planExpiresAt: {
    type: Date,
    default: null,
  },
  razorpaySubscriptionId: {
    type: String,
    default: null,
  },
  // Usage tracking
  videoDailyMinutes: {
    type: Number,
    default: 0,
  },
  videoDailyReset: {
    type: Date,
    default: Date.now,
  },
  // Stats
  totalChats: { type: Number, default: 0 },
  totalVideoMinutes: { type: Number, default: 0 },
  lastSeen: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if plan is active
userSchema.methods.isPremium = function () {
  if (this.plan === 'free') return false;
  if (!this.planExpiresAt) return false;
  return this.planExpiresAt > new Date();
};

// Get active plan name
userSchema.methods.getActivePlan = function () {
  if (this.isPremium()) return this.plan;
  return 'free';
};

// Check video limit (free: 30 min/day)
userSchema.methods.canUseVideo = function () {
  if (this.isPremium()) return true;
  // Reset daily counter
  const now = new Date();
  const resetDate = new Date(this.videoDailyReset);
  if (now.toDateString() !== resetDate.toDateString()) {
    this.videoDailyMinutes = 0;
    this.videoDailyReset = now;
  }
  return this.videoDailyMinutes < 30;
};

userSchema.methods.toPublic = function () {
  return {
    id: this._id,
    email: this.email,
    displayName: this.displayName,
    gender: this.gender,
    genderPreference: this.genderPreference,
    plan: this.getActivePlan(),
    planExpiresAt: this.planExpiresAt,
    totalChats: this.totalChats,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
