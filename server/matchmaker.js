const { v4: uuidv4 } = require('uuid');
const { createRoom } = require('./rooms');
const { INTEREST_MATCH_TIMEOUT_MS } = require('./config');

// Queues: Map<socketId, { interests: string[], joinedAt: number }>
const videoQueue = new Map();
const textQueue = new Map();

function getQueue(type) {
  return type === 'video' ? videoQueue : textQueue;
}

function addToQueue(socketId, type, interests = []) {
  const queue = getQueue(type);
  // Don't add if already in queue
  if (queue.has(socketId)) return;
  queue.set(socketId, {
    interests: interests.map((i) => i.toLowerCase().trim()).filter(Boolean),
    joinedAt: Date.now(),
  });
}

function removeFromQueue(socketId) {
  videoQueue.delete(socketId);
  textQueue.delete(socketId);
}

function findMatch(socketId, type) {
  const queue = getQueue(type);
  const user = queue.get(socketId);
  if (!user) return null;

  const now = Date.now();
  const waitedLongEnough = now - user.joinedAt >= INTEREST_MATCH_TIMEOUT_MS;

  let bestMatch = null;
  let bestScore = 0;

  for (const [candidateId, candidate] of queue) {
    if (candidateId === socketId) continue;

    // Calculate interest overlap
    const sharedInterests = user.interests.filter((i) =>
      candidate.interests.includes(i)
    );
    const score = sharedInterests.length;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = candidateId;
    }
  }

  // If we found an interest match, use it
  if (bestMatch && bestScore > 0) {
    return pairUsers(socketId, bestMatch, type, queue);
  }

  // No interest match — match with anyone available instantly
  for (const [candidateId] of queue) {
    if (candidateId === socketId) continue;
    return pairUsers(socketId, candidateId, type, queue);
  }

  return null;
}

function pairUsers(socketId1, socketId2, type, queue) {
  const roomId = uuidv4();
  queue.delete(socketId1);
  queue.delete(socketId2);
  createRoom(roomId, socketId1, socketId2, type);

  return {
    roomId,
    user1: socketId1,
    user2: socketId2,
    type,
  };
}

function getQueueSize(type) {
  return getQueue(type).size;
}

function getTotalQueueSize() {
  return videoQueue.size + textQueue.size;
}

function isInQueue(socketId) {
  return videoQueue.has(socketId) || textQueue.has(socketId);
}

module.exports = {
  addToQueue,
  removeFromQueue,
  findMatch,
  getQueueSize,
  getTotalQueueSize,
  isInQueue,
};
