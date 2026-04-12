const express = require('express');
const User = require('../models/User');
const { generateToken, authMiddleware } = require('../auth');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, displayName, gender } = req.body;

    if (!email || !password || !gender) {
      return res.status(400).json({ error: 'Email, password, and gender are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    if (!['male', 'female', 'other'].includes(gender)) {
      return res.status(400).json({ error: 'Gender must be male, female, or other' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const user = await User.create({
      email,
      password,
      displayName: displayName || email.split('@')[0],
      gender,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: user.toPublic(),
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    user.lastSeen = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      token,
      user: user.toPublic(),
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  res.json({ user: req.user.toPublic() });
});

// Update profile
router.patch('/me', authMiddleware, async (req, res) => {
  try {
    const { displayName, gender, genderPreference } = req.body;

    if (displayName) req.user.displayName = displayName;
    if (gender && ['male', 'female', 'other'].includes(gender)) req.user.gender = gender;
    if (genderPreference && ['male', 'female', 'any'].includes(genderPreference)) {
      // Gender preference only for premium users
      if (req.user.isPremium()) {
        req.user.genderPreference = genderPreference;
      } else {
        return res.status(403).json({ error: 'Gender filter is a premium feature' });
      }
    }

    await req.user.save();
    res.json({ user: req.user.toPublic() });
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

module.exports = router;
