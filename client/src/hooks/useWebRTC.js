import { useEffect, useRef, useState, useCallback } from 'react';
import socket from '../socket';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.relay.metered.ca:80' },
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:global.relay.metered.ca:80',
      username: '4bc7e9fc7df0cbbda8a605ec',
      credential: 'LJqA15FcsAtoKMda',
    },
    {
      urls: 'turn:global.relay.metered.ca:80?transport=tcp',
      username: '4bc7e9fc7df0cbbda8a605ec',
      credential: 'LJqA15FcsAtoKMda',
    },
    {
      urls: 'turn:global.relay.metered.ca:443',
      username: '4bc7e9fc7df0cbbda8a605ec',
      credential: 'LJqA15FcsAtoKMda',
    },
    {
      urls: 'turns:global.relay.metered.ca:443?transport=tcp',
      username: '4bc7e9fc7df0cbbda8a605ec',
      credential: 'LJqA15FcsAtoKMda',
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
  const pendingCandidatesRef = useRef([]);
  const pendingOfferRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [connectionState, setConnectionState] = useState('new');
  const [mediaError, setMediaError] = useState(null);

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

  // Setup WebRTC when matched
  useEffect(() => {
    if (status !== 'connected' || !partnerId) return;

    // Reset buffers
    pendingCandidatesRef.current = [];
    pendingOfferRef.current = null;

    async function setup() {
      const stream = localStreamRef.current || (await startLocalStream());
      if (!stream) return;

      // Create peer connection
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionRef.current = pc;

      // Add local tracks
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Handle remote tracks
      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Send ICE candidates to partner
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice_candidate', { candidate: event.candidate });
        }
      };

      // Connection state tracking
      pc.onconnectionstatechange = () => {
        setConnectionState(pc.connectionState);
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
          setConnectionState('disconnected');
        } else if (pc.iceConnectionState === 'connected') {
          setConnectionState('connected');
        }
      };

      // Apply any buffered offer that arrived before PC was ready
      if (pendingOfferRef.current) {
        const offer = pendingOfferRef.current;
        pendingOfferRef.current = null;
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc_answer', { answer });
      }

      // Apply any buffered ICE candidates
      for (const candidate of pendingCandidatesRef.current) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
      }
      pendingCandidatesRef.current = [];

      // Initiator creates the offer
      if (isInitiator) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('webrtc_offer', { offer });
      }
    }

    // Handle incoming offer
    function onOffer({ offer }) {
      const pc = peerConnectionRef.current;
      if (!pc) {
        // PC not ready yet — buffer the offer
        pendingOfferRef.current = offer;
        return;
      }
      pc.setRemoteDescription(new RTCSessionDescription(offer))
        .then(() => pc.createAnswer())
        .then((answer) => {
          pc.setLocalDescription(answer);
          socket.emit('webrtc_answer', { answer });
        })
        .catch(console.error);
    }

    // Handle incoming answer
    function onAnswer({ answer }) {
      const pc = peerConnectionRef.current;
      if (!pc) return;
      pc.setRemoteDescription(new RTCSessionDescription(answer)).catch(console.error);
    }

    // Handle ICE candidates
    function onIceCandidate({ candidate }) {
      const pc = peerConnectionRef.current;
      if (!pc || !pc.remoteDescription) {
        // Buffer candidates until PC and remote description are ready
        pendingCandidatesRef.current.push(candidate);
        return;
      }
      pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
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
  }, [status, partnerId, isInitiator, startLocalStream]);

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
      pendingCandidatesRef.current = [];
      pendingOfferRef.current = null;
      setConnectionState('new');
    }
  }, [status]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted((prev) => !prev);
    }
  }, []);

  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsCameraOff((prev) => !prev);
    }
  }, []);

  const stopLocalStream = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
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
