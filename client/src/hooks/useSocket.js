import { useEffect, useState, useCallback } from 'react';
import socket from '../socket';

export default function useSocket() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onOnlineCount(count) {
      setOnlineCount(count);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('online_count', onOnlineCount);

    // Set initial state
    if (socket.connected) {
      setIsConnected(true);
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('online_count', onOnlineCount);
    };
  }, []);

  const emit = useCallback((event, data) => {
    socket.emit(event, data);
  }, []);

  return { socket, isConnected, onlineCount, emit };
}
