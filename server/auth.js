const jwt = require('jsonwebtoken');
const User = require('./models/User');
const config = require('./config');

// Generate JWT token
function generateToken(userId) {
  return jwt.sign({ userId }, config.JWT_SECRET, { expiresIn: '30d' });
}

// Verify JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, config.JWT_SECRET);
  } catch {
    return null;
  }
}

// Express middleware — attaches req.user
async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const user = await User.findById(decoded.userId);
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  req.user = user;
  next();
}

// Optional auth — doesn't fail if no token, just sets req.user
async function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = await User.findById(decoded.userId);
    }
  }
  next();
}

// Socket.io auth — verify token from handshake
async function socketAuth(socket) {
  const token = socket.handshake.auth?.token;
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded) return null;

  return User.findById(decoded.userId);
}

module.exports = {
  generateToken,
  verifyToken,
  authMiddleware,
  optionalAuth,
  socketAuth,
};
