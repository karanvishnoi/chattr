import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useMatchmaker from '../hooks/useMatchmaker';
import useWebRTC from '../hooks/useWebRTC';
import useSocket from '../hooks/useSocket';
import { useAuth } from '../context/AuthContext';
import VideoPanel from '../components/VideoPanel';
import ChatBox from '../components/ChatBox';
import Controls from '../components/Controls';
import StatusOverlay from '../components/StatusOverlay';
import ReportModal from '../components/ReportModal';

export default function VideoChat() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { onlineCount } = useSocket();
  const { user } = useAuth();
  const genderPref = searchParams.get('genderPref') || 'any';
  const { status, isInitiator, partnerId, joinQueue, next, stop } = useMatchmaker('video', {
    gender: user?.gender,
    genderPreference: genderPref,
    isPremium: user?.plan !== 'free',
  });
  const {
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
  } = useWebRTC(isInitiator, partnerId, status);

  const [showReport, setShowReport] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const interests = searchParams.get('interests')?.split(',').filter(Boolean) || [];

  // Start camera and join queue on mount
  useEffect(() => {
    startLocalStream().then(() => {
      joinQueue(interests);
    });

    return () => {
      stopLocalStream();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleNext() {
    next();
  }

  function handleStop() {
    stopLocalStream();
    stop();
    navigate('/');
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-dark overflow-hidden">
      {/* Header — compact on mobile */}
      <header className="flex items-center justify-between px-3 md:px-6 py-2 border-b border-dark-border bg-dark-card/80 backdrop-blur-sm z-20 shrink-0">
        <button
          onClick={() => navigate('/')}
          className="text-lg md:text-xl font-bold tracking-tight cursor-pointer"
        >
          Chatt<span className="text-accent">r</span>
        </button>

        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={() => setShowChat(!showChat)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              showChat ? 'bg-accent/20 text-accent-light' : 'bg-dark-border text-text-secondary hover:text-text-primary'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="hidden sm:inline">Chat</span>
          </button>

          <button
            onClick={() => setShowReport(true)}
            disabled={status !== 'connected'}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs text-text-secondary hover:text-danger bg-dark-border hover:bg-danger/10 transition-colors disabled:opacity-30 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <line x1="4" y1="22" x2="4" y2="15" />
            </svg>
            <span className="hidden sm:inline">Report</span>
          </button>

          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <span className="w-2 h-2 bg-success rounded-full" />
            {onlineCount}
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Video section */}
        <div className="flex-1 flex flex-col relative min-h-0">
          {/* Media error overlay */}
          {mediaError && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-dark/90">
              <div className="text-center max-w-sm px-6">
                <div className="text-4xl mb-4">📷</div>
                <h3 className="text-lg font-semibold mb-2">Camera Access Needed</h3>
                <p className="text-sm text-text-secondary mb-4">{mediaError}</p>
                <button
                  onClick={() => startLocalStream()}
                  className="px-6 py-2.5 bg-accent text-white rounded-full hover:bg-accent-hover transition-colors cursor-pointer"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Status overlay */}
          {status !== 'connected' && !mediaError && (
            <StatusOverlay status={status} onNext={handleNext} />
          )}

          {/* Video panel */}
          <div className="flex-1 p-1 sm:p-2 md:p-3 min-h-0">
            <VideoPanel
              localVideoRef={localVideoRef}
              remoteVideoRef={remoteVideoRef}
              connectionState={connectionState}
            />
          </div>

          {/* Controls — always visible */}
          <div className="p-2 md:p-3 border-t border-dark-border bg-dark-card/80 backdrop-blur-sm shrink-0">
            <Controls
              isMuted={isMuted}
              isCameraOff={isCameraOff}
              onToggleMute={toggleMute}
              onToggleCamera={toggleCamera}
              onNext={handleNext}
              onStop={handleStop}
              showCameraControls={true}
            />
          </div>
        </div>

        {/* Side chat panel — desktop only */}
        {showChat && (
          <div className="w-80 lg:w-96 border-l border-dark-border hidden md:flex flex-col">
            <div className="p-3 border-b border-dark-border flex items-center justify-between">
              <span className="text-sm font-medium text-text-secondary">Text Chat</span>
              <button
                onClick={() => setShowChat(false)}
                className="text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatBox status={status} compact />
            </div>
          </div>
        )}
      </div>

      {/* Mobile chat overlay */}
      {showChat && (
        <div className="md:hidden fixed inset-0 z-30 bg-dark/95 backdrop-blur-sm flex flex-col">
          <div className="p-3 border-b border-dark-border flex items-center justify-between shrink-0">
            <span className="text-sm font-medium">Text Chat</span>
            <button
              onClick={() => setShowChat(false)}
              className="text-text-secondary hover:text-text-primary px-2 py-1 cursor-pointer"
            >
              ✕ Close
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <ChatBox status={status} compact />
          </div>
        </div>
      )}

      <ReportModal isOpen={showReport} onClose={() => setShowReport(false)} />
    </div>
  );
}
