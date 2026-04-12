const { v4: uuidv4 } = require('uuid');
const { createRoom } = require('./rooms');

// Queues: Map<socketId, { interests, gender, genderPreference, isPremium, joinedAt }>
const videoQueue = new Map();
const textQueue = new Map();

function getQueue(type) {
  return type === 'video' ? videoQueue : textQueue;
}

function addToQueue(socketId, type, { interests = [], gender = null, genderPreference = 'any', isPremium = false } = {}) {
  const queue = getQueue(type);
  if (queue.has(socketId)) return;
  queue.set(socketId, {
    interests: interests.map((i) => i.toLowerCase().trim()).filter(Boolean),
    gender,
    genderPreference,
    isPremium,
    joinedAt: Date.now(),
  });
}

function removeFromQueue(socketId) {
  videoQueue.delete(socketId);
  textQueue.delete(socketId);
}

function genderMatches(user, candidate) {
  // If neither has a preference, always match
  if (user.genderPreference === 'any' && candidate.genderPreference === 'any') return true;

  // Check user's preference against candidate's gender
  const userWants = user.genderPreference === 'any' || user.genderPreference === candidate.gender;
  // Check candidate's preference against user's gender
  const candidateWants = candidate.genderPreference === 'any' || candidate.genderPreference === user.gender;

  return userWants && candidateWants;
}

function findMatch(socketId, type) {
  const queue = getQueue(type);
  const user = queue.get(socketId);
  if (!user) return null;

  let bestMatch = null;
  let bestScore = -1;

  for (const [candidateId, candidate] of queue) {
    if (candidateId === socketId) continue;

    // Gender filter check
    if (!genderMatches(user, candidate)) continue;

    // Calculate score
    let score = 0;

    // Interest overlap
    const sharedInterests = user.interests.filter((i) =>
      candidate.interests.includes(i)
    );
    score += sharedInterests.length * 10;

    // Premium users get priority
    if (candidate.isPremium) score += 5;
    if (user.isPremium) score += 5;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = candidateId;
    }
  }

  // Found a scored match
  if (bestMatch !== null) {
    return pairUsers(socketId, bestMatch, type, queue);
  }

  // Fallback: match with anyone (ignore gender preference if waited > 15s)
  const waitedLong = Date.now() - user.joinedAt > 15000;
  if (waitedLong) {
    for (const [candidateId] of queue) {
      if (candidateId === socketId) continue;
      return pairUsers(socketId, candidateId, type, queue);
    }
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
