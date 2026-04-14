import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useMatchmaker from '../hooks/useMatchmaker';
import useWebRTC from '../hooks/useWebRTC';
import useSocket from '../hooks/useSocket';
import { useAuth } from '../context/AuthContext';
import ChatBox from '../components/ChatBox';
import ReportModal from '../components/ReportModal';
import ThemeToggle from '../components/ThemeToggle';
import WelcomeScreen from '../components/WelcomeScreen';

export default function VideoChat() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { onlineCount, isConnected } = useSocket();
  const { user } = useAuth();
  const genderPref = searchParams.get('genderPref') || 'any';
  const { status, isInitiator, partnerId, joinQueue, stop } = useMatchmaker('video', {
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
    videoDevices,
    audioDevices,
    currentVideoId,
    currentAudioId,
    toggleMute,
    toggleCamera,
    startLocalStream,
    stopLocalStream,
    switchVideoDevice,
    switchAudioDevice,
  } = useWebRTC(isInitiator, partnerId, status);

  const [showReport, setShowReport] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showDeviceMenu, setShowDeviceMenu] = useState(false);
  const [myCountry, setMyCountry] = useState(null);

  // Fetch user's country for the "chatting with someone" indicator
  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then((r) => r.json())
      .then((d) => setMyCountry({ name: d.country_name, code: d.country_code, flag: getFlag(d.country_code) }))
      .catch(() => {});
  }, []);

  function getFlag(code) {
    if (!code) return '';
    return String.fromCodePoint(...[...code.toUpperCase()].map(c => 127397 + c.charCodeAt(0)));
  }

  const interests = searchParams.get('interests')?.split(',').filter(Boolean) || [];

  // Start local stream on mount (camera permission)
  useEffect(() => {
    startLocalStream();
    return () => stopLocalStream();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Esc key = Skip/Next
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') joinQueue(interests);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleStart() {
    setHasStarted(true);
    joinQueue(interests);
  }

  function handleNext() {
    joinQueue(interests);
  }

  function handleStop() {
    stopLocalStream();
    stop();
    navigate('/');
  }

  const statusMessage = {
    searching: 'Looking for someone new...',
    connected: "You're now chatting with someone new",
    disconnected: 'Stranger disconnected. Finding next...',
    idle: "Welcome — read the rules and press Start",
  }[status];

  return (
    <div className="h-[100dvh] flex flex-col bg-dark overflow-hidden">
      {/* Top header */}
      <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-dark-border shrink-0">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 cursor-pointer">
          <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <span className="text-lg md:text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Chatt<span className="text-accent">r</span>
          </span>
        </button>
        <div className="flex items-center gap-3">
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
          <ThemeToggle />
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
              className="px-6 py-2.5 bg-accent text-white rounded-xl hover:bg-accent-hover transition-colors cursor-pointer"
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
                      <p className="text-xs">Press Start to begin</p>
                    </div>
                  )}
                </div>
              )}
              <div className="absolute bottom-2 left-2 text-[10px] font-bold text-white/50 tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
                chattr
              </div>
              <button onClick={() => setShowReport(true)} disabled={status !== 'connected'} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-dark/70 hover:bg-danger/80 text-white/80 hover:text-white backdrop-blur-sm transition-colors disabled:opacity-30 cursor-pointer flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
              </button>
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
              <div className="absolute top-2 left-2 text-[10px] font-medium bg-dark/80 text-white px-2 py-1 rounded backdrop-blur-sm">
                You {myCountry?.flag}
              </div>

              {/* Flip Camera menu trigger */}
              <button
                onClick={() => setShowDeviceMenu(!showDeviceMenu)}
                className="absolute top-2 right-2 text-[10px] font-medium bg-dark/80 hover:bg-dark text-white px-2 py-1 rounded backdrop-blur-sm cursor-pointer transition-colors"
              >
                Flip Camera ⚙
              </button>

              {/* Device selector dropdown */}
              {showDeviceMenu && (
                <>
                  <div className="absolute inset-0 z-20" onClick={() => setShowDeviceMenu(false)} />
                  <div className="absolute top-10 right-2 z-30 bg-dark-card border border-dark-border rounded-lg shadow-xl p-3 min-w-[220px] animate-fade-in">
                    <div className="mb-3">
                      <p className="text-[10px] uppercase tracking-wider text-text-secondary mb-1">Camera</p>
                      <select
                        value={currentVideoId}
                        onChange={(e) => { switchVideoDevice(e.target.value); setShowDeviceMenu(false); }}
                        className="w-full text-xs bg-dark border border-dark-border rounded px-2 py-1.5 text-text-primary focus:outline-none focus:border-accent cursor-pointer"
                      >
                        {videoDevices.map((d) => (
                          <option key={d.deviceId} value={d.deviceId}>
                            {d.label || `Camera ${d.deviceId.slice(0, 6)}`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-text-secondary mb-1">Microphone</p>
                      <select
                        value={currentAudioId}
                        onChange={(e) => { switchAudioDevice(e.target.value); setShowDeviceMenu(false); }}
                        className="w-full text-xs bg-dark border border-dark-border rounded px-2 py-1.5 text-text-primary focus:outline-none focus:border-accent cursor-pointer"
                      >
                        {audioDevices.map((d) => (
                          <option key={d.deviceId} value={d.deviceId}>
                            {d.label || `Mic ${d.deviceId.slice(0, 6)}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className="absolute bottom-2 right-2 flex gap-1.5">
                <button onClick={toggleMute} className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors cursor-pointer ${isMuted ? 'bg-danger/80 text-white' : 'bg-dark/70 text-white hover:bg-dark'}`}>
                  {isMuted ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.13 1.49-.36 2.18"/><line x1="12" y1="19" x2="12" y2="23"/></svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>
                  )}
                </button>
                <button onClick={toggleCamera} className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors cursor-pointer ${isCameraOff ? 'bg-danger/80 text-white' : 'bg-dark/70 text-white hover:bg-dark'}`}>
                  {isCameraOff ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56"/></svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: Welcome / Chat panel */}
          <div className={`flex-1 flex flex-col border-l border-dark-border ${showMobileChat ? 'flex' : 'hidden md:flex'}`}>
            {!hasStarted ? (
              <WelcomeScreen
                type="video"
                serverStatus={isConnected ? 'ready' : 'connecting'}
                onStart={handleStart}
              />
            ) : (
              <>
                <div className="px-4 py-3 border-b border-dark-border flex items-center justify-between shrink-0">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      {status === 'connected' && <span>🫶</span>}
                      <p className="text-sm font-medium">{statusMessage}</p>
                    </div>
                    {status === 'connected' && myCountry && (
                      <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                        <span>{myCountry.flag}</span>
                        <span>{myCountry.name}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1 overflow-hidden">
                  <ChatBox status={status} compact />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Bottom single Stop button */}
      {!mediaError && hasStarted && (
        <div className="border-t border-dark-border px-4 py-3 flex items-center justify-center shrink-0">
          <button
            onClick={handleNext}
            className="px-10 py-2 bg-dark-card border border-dark-border rounded-xl hover:border-accent hover:bg-accent/5 transition-all cursor-pointer text-center"
            style={{ fontFamily: 'var(--font-display)' }}
            title="Skip to next stranger"
          >
            <div className="text-xl font-bold">
              {status === 'connected' ? 'Really?' : 'Stop'}
            </div>
            <div className="text-[10px] text-accent-light font-medium uppercase tracking-wider">Esc</div>
          </button>
        </div>
      )}

      <ReportModal isOpen={showReport} onClose={() => setShowReport(false)} />
    </div>
  );
}
