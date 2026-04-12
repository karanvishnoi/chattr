import { useEffect, useState, useCallback, useRef } from 'react';
import socket from '../socket';

export default function useMatchmaker(type) {
  const [status, setStatus] = useState('idle'); // idle | searching | connected | disconnected
  const [roomId, setRoomId] = useState(null);
  const [partnerId, setPartnerId] = useState(null);
  const [isInitiator, setIsInitiator] = useState(false);
  const interestsRef = useRef([]);

  useEffect(() => {
    function onMatched(data) {
      setStatus('connected');
      setRoomId(data.roomId);
      setPartnerId(data.partnerId);
      setIsInitiator(data.isInitiator);
    }

    function onPartnerLeft() {
      setStatus('disconnected');
      setRoomId(null);
      setPartnerId(null);
      setIsInitiator(false);
    }

    function onBanned({ message }) {
      setStatus('idle');
      alert(message);
    }

    socket.on('matched', onMatched);
    socket.on('partner_left', onPartnerLeft);
    socket.on('banned', onBanned);

    return () => {
      socket.off('matched', onMatched);
      socket.off('partner_left', onPartnerLeft);
      socket.off('banned', onBanned);
    };
  }, []);

  const joinQueue = useCallback((interests = []) => {
    interestsRef.current = interests;
    setStatus('searching');
    setRoomId(null);
    setPartnerId(null);
    socket.emit('join_queue', { type, interests });
  }, [type]);

  const leaveQueue = useCallback(() => {
    setStatus('idle');
    socket.emit('leave_queue');
  }, []);

  const next = useCallback(() => {
    setStatus('searching');
    setRoomId(null);
    setPartnerId(null);
    setIsInitiator(false);
    socket.emit('next', { type, interests: interestsRef.current });
  }, [type]);

  const stop = useCallback(() => {
    setStatus('idle');
    setRoomId(null);
    setPartnerId(null);
    setIsInitiator(false);
    socket.emit('leave_queue');
  }, []);

  return {
    status,
    roomId,
    partnerId,
    isInitiator,
    joinQueue,
    leaveQueue,
    next,
    stop,
  };
}
