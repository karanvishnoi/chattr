// Room management — tracks active pairs
const rooms = new Map(); // roomId -> { users: [socketId1, socketId2], type, createdAt }
const userRooms = new Map(); // socketId -> roomId

function createRoom(roomId, socketId1, socketId2, type) {
  rooms.set(roomId, {
    users: [socketId1, socketId2],
    type,
    createdAt: Date.now(),
  });
  userRooms.set(socketId1, roomId);
  userRooms.set(socketId2, roomId);
}

function getRoomByUser(socketId) {
  const roomId = userRooms.get(socketId);
  if (!roomId) return null;
  const room = rooms.get(roomId);
  if (!room) {
    userRooms.delete(socketId);
    return null;
  }
  return { roomId, ...room };
}

function getPartnerSocketId(socketId) {
  const room = getRoomByUser(socketId);
  if (!room) return null;
  return room.users.find((id) => id !== socketId) || null;
}

function removeUserFromRoom(socketId) {
  const roomId = userRooms.get(socketId);
  if (!roomId) return null;

  const room = rooms.get(roomId);
  if (!room) {
    userRooms.delete(socketId);
    return null;
  }

  const partnerId = room.users.find((id) => id !== socketId);

  // Clean up
  userRooms.delete(socketId);
  if (partnerId) userRooms.delete(partnerId);
  rooms.delete(roomId);

  return partnerId;
}

function getActiveRoomCount() {
  return rooms.size;
}

module.exports = {
  createRoom,
  getRoomByUser,
  getPartnerSocketId,
  removeUserFromRoom,
  getActiveRoomCount,
};
