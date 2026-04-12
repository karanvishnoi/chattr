import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

const socket = io(SERVER_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  auth: {
    token: localStorage.getItem('chattr_token') || '',
  },
});

// Update auth token when it changes
export function updateSocketAuth(token) {
  socket.auth = { token: token || '' };
  if (socket.connected) {
    socket.disconnect().connect();
  }
}

export default socket;
