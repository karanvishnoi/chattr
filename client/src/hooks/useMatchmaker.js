import { useEffect, useState, useCallback, useRef } from 'react';
import socket from '../socket';

export default function useMatchmaker(type, userInfo = {}) {
  const [status, setStatus] = useState('idle'); // idle | searching | connected | disconnected
  const [roomId, setRoomId] = useState(null);
  const [partnerId, setPartnerId] = useState(null);
  const [isInitiator, setIsInitiator] = useState(false);
  const interestsRef = useRef([]);
  const userInfoRef = useRef(userInfo);
  const autoRequeueRef = useRef(null);

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

      // Auto-requeue after 2 seconds
      autoRequeueRef.current = setTimeout(() => {
        setStatus('searching');
        socket.emit('join_queue', {
          type,
          interests: interestsRef.current,
          gender: userInfoRef.current.gender,
          genderPreference: userInfoRef.current.genderPreference || 'any',
          isPremium: userInfoRef.current.isPremium || false,
        });
      }, 2000);
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
      clearTimeout(autoRequeueRef.current);
    };
  }, [type]);

  const joinQueue = useCallback((interests = []) => {
    interestsRef.current = interests;
    clearTimeout(autoRequeueRef.current);
    setStatus('searching');
    setRoomId(null);
    setPartnerId(null);
    socket.emit('join_queue', {
      type,
      interests,
      gender: userInfoRef.current.gender,
      genderPreference: userInfoRef.current.genderPreference || 'any',
      isPremium: userInfoRef.current.isPremium || false,
    });
  }, [type]);

  const leaveQueue = useCallback(() => {
    clearTimeout(autoRequeueRef.current);
    setStatus('idle');
    socket.emit('leave_queue');
  }, []);

  const next = useCallback(() => {
    clearTimeout(autoRequeueRef.current);
    setStatus('searching');
    setRoomId(null);
    setPartnerId(null);
    setIsInitiator(false);
    socket.emit('next', {
      type,
      interests: interestsRef.current,
      gender: userInfoRef.current.gender,
      genderPreference: userInfoRef.current.genderPreference || 'any',
      isPremium: userInfoRef.current.isPremium || false,
    });
  }, [type]);

  const stop = useCallback(() => {
    clearTimeout(autoRequeueRef.current);
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
