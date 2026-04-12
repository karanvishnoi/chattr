const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const config = require('./config');
const matchmaker = require('./matchmaker');
const rooms = require('./rooms');
const moderation = require('./moderation');

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  config.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

const corsOptions = {
  origin: true,
  methods: ['GET', 'POST'],
  credentials: true,
};

const io = new Server(server, { cors: corsOptions });

app.use(cors(corsOptions));
app.use(express.json());

// Health check (must be before static files)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Serve static client build in production
if (config.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDist));
}

// Track connected users
let onlineCount = 0;

function getClientIP(socket) {
  return (
    socket.handshake.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    socket.handshake.address
  );
}

function broadcastOnlineCount() {
  io.emit('online_count', onlineCount);
}

// Try matching at interval for users waiting in queue
function tryMatchQueue(type) {
  const queue = type === 'video' ? 'video' : 'text';
  // Get all socket IDs in the relevant namespace
  for (const [socketId] of io.sockets.sockets) {
    const match = matchmaker.findMatch(socketId, queue);
    if (match) {
      emitMatch(match);
    }
  }
}

function emitMatch(match) {
  const { roomId, user1, user2, type } = match;

  const socket1 = io.sockets.sockets.get(user1);
  const socket2 = io.sockets.sockets.get(user2);

  if (!socket1 || !socket2) return;

  // Both join the Socket.io room
  socket1.join(roomId);
  socket2.join(roomId);

  // user1 is the initiator (creates WebRTC offer)
  socket1.emit('matched', {
    roomId,
    partnerId: user2,
    type,
    isInitiator: true,
  });

  socket2.emit('matched', {
    roomId,
    partnerId: user1,
    type,
    isInitiator: false,
  });
}

// Socket.io connection handler
io.on('connection', async (socket) => {
  const clientIP = getClientIP(socket);

  // Check IP ban
  try {
    const banned = await moderation.isIPBanned(clientIP);
    if (banned) {
      socket.emit('banned', { message: 'You are temporarily banned. Please try again later.' });
      socket.disconnect(true);
      return;
    }
  } catch (err) {
    console.error('Ban check error:', err.message);
  }

  onlineCount++;
  broadcastOnlineCount();

  // Send current online count to the newly connected user
  socket.emit('online_count', onlineCount);

  // ========== MATCHMAKING ==========

  socket.on('join_queue', ({ type, interests }) => {
    // Remove from any existing room first
    const partnerId = rooms.removeUserFromRoom(socket.id);
    if (partnerId) {
      io.to(partnerId).emit('partner_left');
    }

    matchmaker.removeFromQueue(socket.id);
    matchmaker.addToQueue(socket.id, type, interests || []);

    // Try immediate match
    const match = matchmaker.findMatch(socket.id, type);
    if (match) {
      emitMatch(match);
    }
  });

  socket.on('leave_queue', () => {
    matchmaker.removeFromQueue(socket.id);
  });

  socket.on('next', ({ type, interests }) => {
    // Leave current room
    const partnerId = rooms.removeUserFromRoom(socket.id);
    if (partnerId) {
      const partnerSocket = io.sockets.sockets.get(partnerId);
      if (partnerSocket) {
        partnerSocket.emit('partner_left');
        // Leave the socket.io room
        const room = rooms.getRoomByUser(partnerId);
        if (room) partnerSocket.leave(room.roomId);
      }
    }

    // Leave all rooms this socket is in (cleanup)
    for (const room of socket.rooms) {
      if (room !== socket.id) socket.leave(room);
    }

    // Re-queue
    matchmaker.removeFromQueue(socket.id);
    matchmaker.addToQueue(socket.id, type, interests || []);

    const match = matchmaker.findMatch(socket.id, type);
    if (match) {
      emitMatch(match);
    }
  });

  // ========== TEXT CHAT ==========

  socket.on('send_message', ({ message }) => {
    if (!message || typeof message !== 'string') return;

    // Rate limit
    if (!moderation.checkRateLimit(socket.id)) {
      socket.emit('rate_limited', {
        message: 'Slow down! Max 30 messages per minute.',
      });
      return;
    }

    const partnerId = rooms.getPartnerSocketId(socket.id);
    if (!partnerId) return;

    // Filter bad words
    const filtered = moderation.filterMessage(message.slice(0, 1000));

    io.to(partnerId).emit('receive_message', {
      message: filtered,
      timestamp: Date.now(),
    });
  });

  socket.on('typing', () => {
    const partnerId = rooms.getPartnerSocketId(socket.id);
    if (partnerId) {
      io.to(partnerId).emit('stranger_typing');
    }
  });

  socket.on('stop_typing', () => {
    const partnerId = rooms.getPartnerSocketId(socket.id);
    if (partnerId) {
      io.to(partnerId).emit('stranger_stop_typing');
    }
  });

  // ========== WEBRTC SIGNALING ==========

  socket.on('webrtc_offer', ({ offer }) => {
    const partnerId = rooms.getPartnerSocketId(socket.id);
    if (partnerId) {
      io.to(partnerId).emit('webrtc_offer', { offer });
    }
  });

  socket.on('webrtc_answer', ({ answer }) => {
    const partnerId = rooms.getPartnerSocketId(socket.id);
    if (partnerId) {
      io.to(partnerId).emit('webrtc_answer', { answer });
    }
  });

  socket.on('ice_candidate', ({ candidate }) => {
    const partnerId = rooms.getPartnerSocketId(socket.id);
    if (partnerId) {
      io.to(partnerId).emit('ice_candidate', { candidate });
    }
  });

  // ========== MODERATION ==========

  socket.on('report_user', async ({ reason }) => {
    const partnerId = rooms.getPartnerSocketId(socket.id);
    if (!partnerId) return;

    const partnerSocket = io.sockets.sockets.get(partnerId);
    if (!partnerSocket) return;

    const partnerIP = getClientIP(partnerSocket);
    const room = rooms.getRoomByUser(socket.id);

    try {
      const result = await moderation.reportUser(
        clientIP,
        partnerIP,
        partnerId,
        reason,
        room?.roomId
      );

      socket.emit('report_submitted', { success: true });

      // If partner got banned, disconnect them
      if (result.banned) {
        partnerSocket.emit('banned', {
          message: 'You have been banned due to multiple reports.',
        });
        partnerSocket.disconnect(true);
      }
    } catch (err) {
      console.error('Report error:', err.message);
      socket.emit('report_submitted', { success: false });
    }
  });

  // ========== DISCONNECT ==========

  socket.on('disconnect', () => {
    onlineCount = Math.max(0, onlineCount - 1);
    broadcastOnlineCount();

    // Remove from queue
    matchmaker.removeFromQueue(socket.id);
    moderation.clearRateLimit(socket.id);

    // Notify partner
    const partnerId = rooms.removeUserFromRoom(socket.id);
    if (partnerId) {
      io.to(partnerId).emit('partner_left');
    }
  });
});

// Periodic match attempt for queued users (every 2 seconds)
setInterval(() => {
  tryMatchQueue('video');
  tryMatchQueue('text');
}, 2000);

// SPA catch-all (production)
if (config.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Connect to MongoDB and start server
async function start() {
  try {
    await mongoose.connect(config.MONGO_URI);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.warn('MongoDB not available — running without persistence:', err.message);
    console.warn('Reports and bans will not be saved.');
  }

  server.listen(config.PORT, () => {
    console.log(`Chattr server running on port ${config.PORT}`);
  });
}

start();
