const express = require('express');
const crypto = require('crypto');
const User = require('../models/User');
const { authMiddleware } = require('../auth');
const config = require('../config');

const router = express.Router();

const PLANS = {
  premium: {
    name: 'Premium',
    price: 29900, // ₹299 in paise
    duration: 30, // days
    features: ['Unlimited video', 'Gender filter', 'Priority matching', 'Ad-free'],
  },
  pro: {
    name: 'Pro',
    price: 59900, // ₹599 in paise
    duration: 30,
    features: ['Everything in Premium', 'Reconnect with same person', 'See who liked you', 'Priority support'],
  },
};

// Get plans
router.get('/plans', (req, res) => {
  res.json({ plans: PLANS });
});

// Create Razorpay order
router.post('/create-order', authMiddleware, async (req, res) => {
  try {
    const { planId } = req.body;
    const plan = PLANS[planId];

    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    if (!config.RAZORPAY_KEY_ID || !config.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ error: 'Payment not configured' });
    }

    // Create Razorpay order via API
    const orderData = JSON.stringify({
      amount: plan.price,
      currency: 'INR',
      receipt: `chattr_${req.user._id}_${Date.now()}`,
      notes: {
        userId: req.user._id.toString(),
        planId,
      },
    });

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(`${config.RAZORPAY_KEY_ID}:${config.RAZORPAY_KEY_SECRET}`).toString('base64'),
      },
      body: orderData,
    });

    const order = await response.json();

    if (order.error) {
      return res.status(500).json({ error: 'Failed to create order' });
    }

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: config.RAZORPAY_KEY_ID,
      planId,
      planName: plan.name,
    });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Order creation failed' });
  }
});

// Verify payment and activate plan
router.post('/verify-payment', authMiddleware, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;

    if (!config.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ error: 'Payment not configured' });
    }

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', config.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    const plan = PLANS[planId];
    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    // Activate plan
    const now = new Date();
    const currentExpiry = req.user.planExpiresAt && req.user.planExpiresAt > now
      ? req.user.planExpiresAt
      : now;

    req.user.plan = planId;
    req.user.planExpiresAt = new Date(currentExpiry.getTime() + plan.duration * 24 * 60 * 60 * 1000);
    req.user.razorpaySubscriptionId = razorpay_payment_id;
    await req.user.save();

    res.json({
      success: true,
      user: req.user.toPublic(),
      message: `${plan.name} plan activated until ${req.user.planExpiresAt.toLocaleDateString()}`,
    });
  } catch (err) {
    console.error('Verify payment error:', err);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

// Get subscription status
router.get('/status', authMiddleware, async (req, res) => {
  res.json({
    plan: req.user.getActivePlan(),
    expiresAt: req.user.planExpiresAt,
    features: PLANS[req.user.getActivePlan()]?.features || ['Text chat', '30 min video/day'],
  });
});

module.exports = router;
