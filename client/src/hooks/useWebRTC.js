import { useEffect, useRef, useState, useCallback } from 'react';
import socket from '../socket';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // Free TURN servers for NAT traversal (mobile networks, firewalls)
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
};

const MEDIA_CONSTRAINTS = {
  video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
  audio: true,
};

export default function useWebRTC(isInitiator, partnerId, status) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [connectionState, setConnectionState] = useState('new');
  const [mediaError, setMediaError] = useState(null);

  // Get local media stream
  const startLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(MEDIA_CONSTRAINTS);
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setMediaError(null);
      return stream;
    } catch (err) {
      console.error('getUserMedia error:', err);
      setMediaError(
        err.name === 'NotAllowedError'
          ? 'Camera access was denied. Please allow camera and microphone access.'
          : 'Could not access camera/microphone. Please check your device settings.'
      );
      return null;
    }
  }, []);

  // Create peer connection
  const createPeerConnection = useCallback((stream) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    // Add local tracks
    if (stream) {
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
    }

    // Handle remote tracks
    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice_candidate', { candidate: event.candidate });
      }
    };

    // Connection state
    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        setConnectionState('disconnected');
      }
    };

    return pc;
  }, []);

  // Setup WebRTC when matched
  useEffect(() => {
    if (status !== 'connected' || !partnerId) return;

    let pc;

    async function setup() {
      const stream = localStreamRef.current || (await startLocalStream());
      if (!stream) return;

      pc = createPeerConnection(stream);

      if (isInitiator) {
        // Create and send offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('webrtc_offer', { offer });
      }
    }

    // Handle incoming offer (for non-initiator)
    function onOffer({ offer }) {
      if (!peerConnectionRef.current) return;
      peerConnectionRef.current
        .setRemoteDescription(new RTCSessionDescription(offer))
        .then(() => peerConnectionRef.current.createAnswer())
        .then((answer) => {
          peerConnectionRef.current.setLocalDescription(answer);
          socket.emit('webrtc_answer', { answer });
        })
        .catch(console.error);
    }

    // Handle incoming answer (for initiator)
    function onAnswer({ answer }) {
      if (!peerConnectionRef.current) return;
      peerConnectionRef.current
        .setRemoteDescription(new RTCSessionDescription(answer))
        .catch(console.error);
    }

    // Handle ICE candidates
    function onIceCandidate({ candidate }) {
      if (!peerConnectionRef.current) return;
      peerConnectionRef.current
        .addIceCandidate(new RTCIceCandidate(candidate))
        .catch(console.error);
    }

    socket.on('webrtc_offer', onOffer);
    socket.on('webrtc_answer', onAnswer);
    socket.on('ice_candidate', onIceCandidate);

    setup();

    return () => {
      socket.off('webrtc_offer', onOffer);
      socket.off('webrtc_answer', onAnswer);
      socket.off('ice_candidate', onIceCandidate);
    };
  }, [status, partnerId, isInitiator, startLocalStream, createPeerConnection]);

  // Cleanup on disconnect/next
  useEffect(() => {
    if (status === 'idle' || status === 'searching' || status === 'disconnected') {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
      setConnectionState('new');
    }
  }, [status]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted((prev) => !prev);
    }
  }, []);

  // Toggle camera
  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsCameraOff((prev) => !prev);
    }
  }, []);

  // Stop all tracks (cleanup)
  const stopLocalStream = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  }, []);

  return {
    localVideoRef,
    remoteVideoRef,
    isMuted,
    isCameraOff,
    connectionState,
    mediaError,
    toggleMute,
    toggleCamera,
    startLocalStream,
    stopLocalStream,
  };
}
