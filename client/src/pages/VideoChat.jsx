import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useMatchmaker from '../hooks/useMatchmaker';
import useWebRTC from '../hooks/useWebRTC';
import useSocket from '../hooks/useSocket';
import { useAuth } from '../context/AuthContext';
import ChatBox from '../components/ChatBox';
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
  const [showMobileChat, setShowMobileChat] = useState(false);

  const interests = searchParams.get('interests')?.split(',').filter(Boolean) || [];

  useEffect(() => {
    startLocalStream().then(() => {
      joinQueue(interests);
    });
    return () => stopLocalStream();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Esc key = Stop
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') handleStop();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleNext() { next(); }
  function handleStop() {
    stopLocalStream();
    stop();
    navigate('/');
  }

  const statusMessage = {
    searching: 'Looking for someone new...',
    connected: "You're now chatting with someone new",
    disconnected: 'Stranger disconnected. Finding next...',
    idle: 'Ready',
  }[status];

  return (
    <div className="h-[100dvh] flex flex-col bg-dark overflow-hidden">
      {/* Top header */}
      <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-dark-border shrink-0">
        <button onClick={() => navigate('/')} className="text-xl md:text-2xl font-bold tracking-tight cursor-pointer">
          Chatt<span className="text-accent">r</span>
        </button>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowMobileChat(!showMobileChat)}
            className="md:hidden text-xs bg-dark-card border border-dark-border px-3 py-1.5 rounded-full cursor-pointer"
          >
            {showMobileChat ? 'Hide Chat' : 'Show Chat'}
          </button>
          <div className="flex items-center gap-1.5 text-sm text-text-secondary">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span className="font-semibold text-text-primary">{onlineCount.toLocaleString()}+</span> online
          </div>
        </div>
      </header>

      {/* Media error */}
      {mediaError && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <div className="text-5xl mb-4">📷</div>
            <h3 className="text-xl font-semibold mb-2">Camera Access Needed</h3>
            <p className="text-sm text-text-secondary mb-6">{mediaError}</p>
            <button
              onClick={() => startLocalStream()}
              className="px-6 py-2.5 bg-accent text-white rounded-full hover:bg-accent-hover transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Main split layout */}
      {!mediaError && (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* LEFT: Videos stacked */}
          <div className={`flex flex-col gap-2 p-2 md:p-3 md:w-[45%] lg:w-[40%] ${showMobileChat ? 'hidden md:flex' : 'flex'}`}>
            {/* Remote video */}
            <div className="relative flex-1 bg-dark-card rounded-xl overflow-hidden border border-dark-border min-h-[180px]">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover bg-black"
              />
              {connectionState !== 'connected' && (
                <div className="absolute inset-0 flex items-center justify-center bg-dark-card">
                  {status === 'searching' ? (
                    <div className="text-center">
                      <div className="w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-sm text-text-secondary">Searching...</p>
                    </div>
                  ) : (
                    <div className="text-center text-text-secondary">
                      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-2 opacity-30">
                        <path d="M23 7l-7 5 7 5V7z" />
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                      </svg>
                      <p className="text-xs">Waiting...</p>
                    </div>
                  )}
                </div>
              )}
              {/* Chattr watermark on remote */}
              <div className="absolute bottom-2 left-2 text-[10px] font-bold text-white/50 tracking-wide">
                chattr
              </div>
            </div>

            {/* Local video */}
            <div className="relative flex-1 bg-dark-card rounded-xl overflow-hidden border border-dark-border min-h-[180px]">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover bg-black"
                style={{ transform: 'scaleX(-1)' }}
              />
              {isCameraOff && (
                <div className="absolute inset-0 flex items-center justify-center bg-dark-card">
                  <div className="text-center text-text-secondary">
                    <div className="text-3xl mb-2">🎥</div>
                    <p className="text-xs">Camera off</p>
                  </div>
                </div>
              )}
              {/* You badge */}
              <div className="absolute top-2 left-2 text-[10px] font-medium bg-dark/80 text-white px-2 py-1 rounded backdrop-blur-sm">
                You
              </div>
              {/* Local controls */}
              <div className="absolute bottom-2 right-2 flex gap-1.5">
                <button
                  onClick={toggleMute}
                  className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors cursor-pointer ${
                    isMuted ? 'bg-danger/80 text-white' : 'bg-dark/70 text-white hover:bg-dark'
                  }`}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.13 1.49-.36 2.18"/><line x1="12" y1="19" x2="12" y2="23"/></svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>
                  )}
                </button>
                <button
                  onClick={toggleCamera}
                  className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors cursor-pointer ${
                    isCameraOff ? 'bg-danger/80 text-white' : 'bg-dark/70 text-white hover:bg-dark'
                  }`}
                  title={isCameraOff ? 'Camera on' : 'Camera off'}
                >
                  {isCameraOff ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56"/></svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: Chat panel */}
          <div className={`flex-1 flex flex-col border-l border-dark-border ${showMobileChat ? 'flex' : 'hidden md:flex'}`}>
            {/* Status message header */}
            <div className="px-4 py-3 border-b border-dark-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  status === 'connected' ? 'bg-success animate-pulse' :
                  status === 'searching' ? 'bg-accent animate-pulse' :
                  'bg-text-secondary'
                }`} />
                <p className="text-sm font-medium">{statusMessage}</p>
              </div>
              <button
                onClick={() => setShowReport(true)}
                disabled={status !== 'connected'}
                className="text-xs text-text-secondary hover:text-danger transition-colors disabled:opacity-30 cursor-pointer"
              >
                Report
              </button>
            </div>

            {/* Chat area */}
            <div className="flex-1 overflow-hidden">
              <ChatBox status={status} compact />
            </div>
          </div>
        </div>
      )}

      {/* Bottom controls bar */}
      {!mediaError && (
        <div className="border-t border-dark-border px-4 py-3 flex items-center justify-center gap-3 shrink-0">
          <button
            onClick={handleNext}
            className="px-6 py-2.5 bg-accent text-white font-semibold rounded-full hover:bg-accent-hover hover:scale-[1.02] transition-all cursor-pointer"
          >
            Next →
          </button>
          <button
            onClick={handleStop}
            className="px-6 py-2.5 bg-dark-card border border-dark-border text-text-primary font-medium rounded-full hover:border-danger hover:text-danger transition-all cursor-pointer"
          >
            Stop
            <kbd className="hidden sm:inline-block ml-2 px-1.5 py-0.5 bg-dark text-[10px] text-text-secondary rounded border border-dark-border">Esc</kbd>
          </button>
        </div>
      )}

      <ReportModal isOpen={showReport} onClose={() => setShowReport(false)} />
    </div>
  );
}
