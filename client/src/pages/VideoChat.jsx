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

function getFlag(code) {
  if (!code) return '';
  return String.fromCodePoint(...[...code.toUpperCase()].map(c => 127397 + c.charCodeAt(0)));
}

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
  const [hasStarted, setHasStarted] = useState(false);
  const [showDeviceMenu, setShowDeviceMenu] = useState(false);
  const [myCountry, setMyCountry] = useState(null);

  const interests = searchParams.get('interests')?.split(',').filter(Boolean) || [];

  useEffect(() => () => stopLocalStream(), []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then((r) => r.json())
      .then((d) => setMyCountry({ name: d.country_name, code: d.country_code, flag: getFlag(d.country_code) }))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && hasStarted) joinQueue(interests);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hasStarted]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleStart() {
    const stream = await startLocalStream();
    if (!stream) return;
    setHasStarted(true);
    joinQueue(interests);
  }

  function handleNext() {
    joinQueue(interests);
  }

  const statusMessage = {
    searching: 'Looking for someone new...',
    connected: "You're now chatting with someone new",
    disconnected: 'Stranger disconnected. Finding next...',
    idle: "Press Start to begin",
  }[status];

  if (mediaError) {
    return (
      <div className="h-[100dvh] flex flex-col bg-dark">
        <Header navigate={navigate} onlineCount={onlineCount} />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <div className="text-5xl mb-4">📷</div>
            <h3 className="text-xl font-semibold mb-2">Camera Access Needed</h3>
            <p className="text-sm text-text-secondary mb-6">{mediaError}</p>
            <button onClick={() => startLocalStream()} className="px-6 py-2.5 bg-accent text-white rounded-xl hover:bg-accent-hover cursor-pointer">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-dark overflow-hidden relative">
      <Header navigate={navigate} onlineCount={onlineCount} />

      {/* ============ DESKTOP LAYOUT ============ */}
      <div className="flex-1 hidden md:flex overflow-hidden min-h-0">
        {/* LEFT: videos stacked */}
        <div className="w-[36%] lg:w-[32%] p-3 flex flex-col gap-3 justify-center">
          <div className="relative bg-black rounded-xl overflow-hidden border border-dark-border" style={{ aspectRatio: '16/9' }}>
            <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-40" />
            <video ref={remoteVideoRef} autoPlay playsInline className="relative w-full h-full object-contain" />
            {connectionState !== 'connected' && <VideoPlaceholder status={hasStarted ? status : 'idle'} />}
            <div className="absolute bottom-2 left-2 text-[10px] font-bold text-white/50 tracking-wide z-10" style={{ fontFamily: 'var(--font-display)' }}>chattr</div>
            <button onClick={() => setShowReport(true)} disabled={status !== 'connected'} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-dark/70 hover:bg-danger/80 text-white/80 hover:text-white backdrop-blur-sm transition-colors disabled:opacity-30 cursor-pointer flex items-center justify-center z-10">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
            </button>
          </div>
          <div className="relative bg-black rounded-xl overflow-hidden border border-dark-border" style={{ aspectRatio: '16/9' }}>
            <video ref={localVideoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-40" style={{ transform: 'scaleX(-1)' }} />
            <video ref={localVideoRef} autoPlay playsInline muted className="relative w-full h-full object-contain" style={{ transform: 'scaleX(-1)' }} />
            {isCameraOff && <div className="absolute inset-0 flex items-center justify-center bg-dark-card z-10"><div className="text-3xl opacity-50">🎥</div></div>}
            <div className="absolute top-2 left-2 text-[10px] font-medium bg-dark/80 text-white px-2 py-1 rounded backdrop-blur-sm z-10">
              You {myCountry?.flag}
            </div>
            <button onClick={() => setShowDeviceMenu(!showDeviceMenu)} className="absolute top-2 right-2 text-[10px] font-medium bg-dark/80 hover:bg-dark text-white px-2 py-1 rounded backdrop-blur-sm cursor-pointer transition-colors z-10">
              Flip Camera ⚙
            </button>
            {showDeviceMenu && <DeviceMenu close={() => setShowDeviceMenu(false)} videoDevices={videoDevices} audioDevices={audioDevices} currentVideoId={currentVideoId} currentAudioId={currentAudioId} switchVideoDevice={switchVideoDevice} switchAudioDevice={switchAudioDevice} />}
            <div className="absolute bottom-2 right-2 flex gap-1.5 z-10">
              <MuteButton isMuted={isMuted} toggle={toggleMute} />
              <CameraButton isCameraOff={isCameraOff} toggle={toggleCamera} />
            </div>
          </div>
        </div>

        {/* RIGHT: chat / welcome */}
        <div className="flex-1 flex flex-col border-l border-dark-border min-h-0">
          {!hasStarted ? (
            <WelcomeScreen type="video" serverStatus={isConnected ? 'ready' : 'connecting'} onStart={handleStart} />
          ) : (
            <>
              <ChatStatusBar status={status} statusMessage={statusMessage} myCountry={myCountry} />
              <div className="flex-1 overflow-hidden"><ChatBox status={status} compact /></div>
            </>
          )}
        </div>
      </div>

      {/* Desktop Stop button */}
      {hasStarted && (
        <div className="hidden md:flex border-t border-dark-border px-4 py-3 items-center justify-center shrink-0">
          <button onClick={handleNext} className="px-12 py-2 bg-dark-card border border-dark-border rounded-xl hover:border-accent hover:bg-accent/5 transition-all cursor-pointer text-center" style={{ fontFamily: 'var(--font-display)' }}>
            <div className="text-xl font-bold">{status === 'connected' ? 'Really?' : 'Stop'}</div>
            <div className="text-[10px] text-accent-light font-medium uppercase tracking-wider">Esc</div>
          </button>
        </div>
      )}

      {/* ============ MOBILE LAYOUT (Umingle-style) ============ */}
      <div className="flex-1 md:hidden flex flex-col overflow-hidden min-h-0">
        {/* Video area (compact, ~35% of screen) */}
        <div className="relative bg-dark-card mx-3 mt-3 rounded-xl overflow-hidden border border-dark-border" style={{ height: '35vh', minHeight: '200px' }}>
          <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-40" />
          <video ref={remoteVideoRef} autoPlay playsInline className="relative w-full h-full object-contain bg-black" />
          {connectionState !== 'connected' && <VideoPlaceholder status={hasStarted ? status : 'idle'} />}

          {/* Watermark */}
          <div className="absolute bottom-2 left-3 text-xs font-bold text-accent/60 tracking-wide z-10" style={{ fontFamily: 'var(--font-display)' }}>chattr<span className="text-white/50">.com</span></div>

          {/* Report button */}
          <button onClick={() => setShowReport(true)} disabled={status !== 'connected'} className="absolute bottom-2 right-2 w-7 h-7 rounded bg-dark/70 hover:bg-danger/80 text-white/80 backdrop-blur-sm disabled:opacity-30 cursor-pointer flex items-center justify-center z-10">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
          </button>

          {/* Local PIP (top right) */}
          <div className="absolute top-2 right-2 w-20 h-24 rounded-lg overflow-hidden border-2 border-white/20 shadow-lg z-10 bg-dark-card">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
            {isCameraOff && <div className="absolute inset-0 flex items-center justify-center bg-dark-card"><div className="text-lg opacity-50">🎥</div></div>}
          </div>

          {/* Quick controls bottom-left of video */}
          {hasStarted && (
            <div className="absolute bottom-2 left-20 flex gap-1.5 z-10">
              <MuteButton isMuted={isMuted} toggle={toggleMute} size="mobile-compact" />
              <CameraButton isCameraOff={isCameraOff} toggle={toggleCamera} size="mobile-compact" />
            </div>
          )}
        </div>

        {/* Welcome rules / Chat messages area */}
        <div className="flex-1 flex flex-col mx-3 mt-3 bg-dark-card rounded-xl border border-dark-border overflow-hidden min-h-0">
          {!hasStarted ? (
            <MobileWelcome />
          ) : (
            <>
              <ChatStatusBar status={status} statusMessage={statusMessage} myCountry={myCountry} />
              <div className="flex-1 overflow-hidden">
                <ChatBox status={status} compact />
              </div>
            </>
          )}
        </div>

        {/* Bottom row: Start/Stop button + message bar */}
        {!hasStarted && (
          <div className="mx-3 my-3 flex gap-2">
            <button
              onClick={handleStart}
              className="px-8 py-3 bg-accent text-white font-bold text-lg rounded-xl hover:bg-accent-hover transition-all cursor-pointer shadow-lg shadow-accent/30"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Start
            </button>
            <div className="flex-1 flex items-center px-4 bg-dark-card border border-dark-border rounded-xl text-sm text-text-secondary">
              Press Start to chat
            </div>
          </div>
        )}
        {hasStarted && (
          <div className="mx-3 my-3 flex">
            <button
              onClick={handleNext}
              className="flex-1 py-3 bg-dark-card border border-dark-border rounded-xl hover:border-accent transition-all cursor-pointer text-center"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <span className="text-base font-bold">{status === 'connected' ? 'Really?' : 'Stop'}</span>
              <span className="ml-2 text-[10px] text-accent-light font-medium uppercase tracking-wider">Esc</span>
            </button>
          </div>
        )}
      </div>

      <ReportModal isOpen={showReport} onClose={() => setShowReport(false)} />
    </div>
  );
}

function Header({ navigate, onlineCount }) {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-dark-border shrink-0 bg-dark">
      <button onClick={() => navigate('/')} className="flex items-center gap-2 cursor-pointer">
        <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <span className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
          Chatt<span className="text-accent">r</span>
        </span>
      </button>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/15 border border-accent/30 rounded-full">
          <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
          <span className="text-sm font-bold text-accent">{onlineCount.toLocaleString()}+</span>
        </div>
      </div>
    </header>
  );
}

function MobileWelcome() {
  return (
    <div className="p-4 overflow-y-auto">
      <p className="text-base font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>Welcome to Chattr.</p>
      <div className="flex items-center gap-2 text-accent font-semibold mb-2">
        <span className="text-lg">🔞</span>
        <span className="text-sm">You must be 18+</span>
      </div>
      <ul className="space-y-1.5 text-sm text-text-secondary">
        <li>• No nudity, hate speech, or harassment</li>
        <li>• Your webcam must show you, live</li>
        <li>• Do not ask for personal info or gender</li>
        <li>• This is not a dating site</li>
        <li>• Violators will be banned permanently</li>
      </ul>
    </div>
  );
}

function ChatStatusBar({ status, statusMessage, myCountry }) {
  return (
    <div className="px-3 py-2 border-b border-dark-border shrink-0">
      <div className="flex items-center gap-2">
        {status === 'connected' && <span className="text-xs">✨</span>}
        <p className="text-xs font-semibold">{statusMessage}</p>
      </div>
      {status === 'connected' && myCountry && (
        <div className="flex items-center gap-1 text-[10px] text-text-secondary mt-0.5">
          <span>{myCountry.flag}</span>
          <span>{myCountry.name}</span>
        </div>
      )}
      {status === 'connected' && (
        <p className="text-[10px] text-accent-light font-medium mt-0.5">
          See something wrong? Use the 🚩 to report.
        </p>
      )}
    </div>
  );
}

function VideoPlaceholder({ status }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-dark-card z-10 pointer-events-none">
      {status === 'searching' ? (
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-text-secondary">Searching...</p>
        </div>
      ) : (
        <div className="text-center text-text-secondary">
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-2 opacity-30">
            <path d="M23 7l-7 5 7 5V7z" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
          <p className="text-xs">{status === 'idle' ? 'Press Start to begin' : 'Waiting...'}</p>
        </div>
      )}
    </div>
  );
}

function DeviceMenu({ close, videoDevices, audioDevices, currentVideoId, currentAudioId, switchVideoDevice, switchAudioDevice }) {
  return (
    <>
      <div className="absolute inset-0 z-20" onClick={close} />
      <div className="absolute top-10 right-2 z-30 bg-dark-card border border-dark-border rounded-lg shadow-xl p-3 min-w-[220px] animate-fade-in">
        <div className="mb-3">
          <p className="text-[10px] uppercase tracking-wider text-text-secondary mb-1">Camera</p>
          <select value={currentVideoId} onChange={(e) => { switchVideoDevice(e.target.value); close(); }} className="w-full text-xs bg-dark border border-dark-border rounded px-2 py-1.5 text-text-primary focus:outline-none focus:border-accent cursor-pointer">
            {videoDevices.map((d) => <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.slice(0, 6)}`}</option>)}
          </select>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-text-secondary mb-1">Microphone</p>
          <select value={currentAudioId} onChange={(e) => { switchAudioDevice(e.target.value); close(); }} className="w-full text-xs bg-dark border border-dark-border rounded px-2 py-1.5 text-text-primary focus:outline-none focus:border-accent cursor-pointer">
            {audioDevices.map((d) => <option key={d.deviceId} value={d.deviceId}>{d.label || `Mic ${d.deviceId.slice(0, 6)}`}</option>)}
          </select>
        </div>
      </div>
    </>
  );
}

function MuteButton({ isMuted, toggle, size = 'sm' }) {
  const dim = size === 'mobile-compact' ? 'w-7 h-7' : 'w-8 h-8';
  const icon = size === 'mobile-compact' ? 12 : 14;
  return (
    <button onClick={toggle} className={`${dim} rounded-full flex items-center justify-center backdrop-blur-sm transition-colors cursor-pointer ${isMuted ? 'bg-danger/80 text-white' : 'bg-dark/70 text-white hover:bg-dark'}`}>
      {isMuted ? (
        <svg width={icon} height={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.13 1.49-.36 2.18"/></svg>
      ) : (
        <svg width={icon} height={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>
      )}
    </button>
  );
}

function CameraButton({ isCameraOff, toggle, size = 'sm' }) {
  const dim = size === 'mobile-compact' ? 'w-7 h-7' : 'w-8 h-8';
  const icon = size === 'mobile-compact' ? 12 : 14;
  return (
    <button onClick={toggle} className={`${dim} rounded-full flex items-center justify-center backdrop-blur-sm transition-colors cursor-pointer ${isCameraOff ? 'bg-danger/80 text-white' : 'bg-dark/70 text-white hover:bg-dark'}`}>
      {isCameraOff ? (
        <svg width={icon} height={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56"/></svg>
      ) : (
        <svg width={icon} height={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
      )}
    </button>
  );
}
