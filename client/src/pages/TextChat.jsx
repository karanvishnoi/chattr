import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useMatchmaker from '../hooks/useMatchmaker';
import useSocket from '../hooks/useSocket';
import { useAuth } from '../context/AuthContext';
import ChatBox from '../components/ChatBox';
import ReportModal from '../components/ReportModal';
import ThemeToggle from '../components/ThemeToggle';
import WelcomeScreen from '../components/WelcomeScreen';

export default function TextChat() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { onlineCount, isConnected } = useSocket();
  const { user } = useAuth();
  const genderPref = searchParams.get('genderPref') || 'any';
  const { status, joinQueue, stop } = useMatchmaker('text', {
    gender: user?.gender,
    genderPreference: genderPref,
    isPremium: user?.plan !== 'free',
  });
  const [showReport, setShowReport] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const interests = searchParams.get('interests')?.split(',').filter(Boolean) || [];

  // Esc = Stop
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') handleStop();
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
    stop();
    navigate('/');
  }

  const statusMessage = {
    searching: 'Looking for someone new...',
    connected: "You're now chatting with someone new",
    disconnected: 'Stranger disconnected. Finding next...',
    idle: 'Press Start to begin',
  }[status];

  return (
    <div className="h-[100dvh] flex flex-col bg-dark overflow-hidden">
      {/* Header */}
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
          <div className="flex items-center gap-1.5 text-sm text-text-secondary">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span className="font-semibold text-text-primary">{onlineCount.toLocaleString()}+</span> online
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!hasStarted ? (
          <div className="flex-1 max-w-3xl w-full mx-auto overflow-auto">
            <WelcomeScreen
              type="text"
              serverStatus={isConnected ? 'ready' : 'connecting'}
              onStart={handleStart}
            />
          </div>
        ) : (
          <>
            {/* Status bar */}
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

            {/* Chat */}
            <div className="flex-1 overflow-hidden max-w-3xl w-full mx-auto">
              <ChatBox status={status} compact />
            </div>
          </>
        )}
      </div>

      {/* Bottom bar */}
      {hasStarted && (
        <div className="border-t border-dark-border px-4 py-3 flex items-center justify-center gap-3 shrink-0">
          <button
            onClick={handleNext}
            className="px-6 py-2.5 bg-accent text-white font-semibold rounded-xl hover:bg-accent-hover hover:scale-[1.02] transition-all cursor-pointer"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            New Chat
          </button>
          <button
            onClick={handleStop}
            className="px-6 py-2.5 bg-dark-card border border-dark-border text-text-primary font-medium rounded-xl hover:border-danger hover:text-danger transition-all cursor-pointer"
            style={{ fontFamily: 'var(--font-display)' }}
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
