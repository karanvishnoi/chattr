import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useMatchmaker from '../hooks/useMatchmaker';
import useSocket from '../hooks/useSocket';
import { useAuth } from '../context/AuthContext';
import ChatBox from '../components/ChatBox';
import StatusOverlay from '../components/StatusOverlay';
import ReportModal from '../components/ReportModal';
import ThemeToggle from '../components/ThemeToggle';

export default function TextChat() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { onlineCount } = useSocket();
  const { user } = useAuth();
  const genderPref = searchParams.get('genderPref') || 'any';
  const { status, joinQueue, next, stop } = useMatchmaker('text', {
    gender: user?.gender,
    genderPreference: genderPref,
    isPremium: user?.plan !== 'free',
  });
  const [showReport, setShowReport] = useState(false);

  const interests = searchParams.get('interests')?.split(',').filter(Boolean) || [];

  // Auto-join queue on mount
  useEffect(() => {
    joinQueue(interests);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleNext() {
    next();
  }

  function handleStop() {
    stop();
    navigate('/');
  }

  return (
    <div className="min-h-screen flex flex-col bg-dark">
      {/* Header */}
      <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-dark-border bg-dark-card/50 backdrop-blur-sm">
        <button
          onClick={() => navigate('/')}
          className="text-xl font-bold tracking-tight cursor-pointer"
        >
          Chatt<span className="text-accent">r</span>
        </button>

        <div className="flex items-center gap-3">
          {/* Status badge */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
            status === 'connected'
              ? 'bg-success/20 text-success'
              : status === 'searching'
              ? 'bg-accent/20 text-accent-light'
              : 'bg-dark-border text-text-secondary'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              status === 'connected'
                ? 'bg-success'
                : status === 'searching'
                ? 'bg-accent animate-pulse'
                : 'bg-text-secondary'
            }`} />
            {status === 'connected' ? 'Connected' : status === 'searching' ? 'Searching...' : 'Disconnected'}
          </div>

          {/* Online count */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-text-secondary">
            <span className="w-2 h-2 bg-success rounded-full" />
            {onlineCount} online
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Chat area */}
      <div className="flex-1 flex flex-col max-w-3xl w-full mx-auto p-4 relative">
        {status !== 'connected' && <StatusOverlay status={status} onNext={handleNext} />}

        <div className="flex-1">
          <ChatBox status={status} />
        </div>

        {/* Bottom controls */}
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setShowReport(true)}
            disabled={status !== 'connected'}
            className="flex items-center gap-1.5 px-4 py-2 text-xs text-text-secondary hover:text-danger border border-dark-border rounded-full hover:border-danger/50 transition-colors disabled:opacity-30 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <line x1="4" y1="22" x2="4" y2="15" />
            </svg>
            Report
          </button>

          <div className="flex gap-3">
            <button
              onClick={handleNext}
              className="px-6 py-2.5 bg-accent text-white font-medium rounded-full hover:bg-accent-hover hover:scale-[1.02] transition-all cursor-pointer"
            >
              New Chat →
            </button>
            <button
              onClick={handleStop}
              className="px-6 py-2.5 bg-dark-card border border-dark-border text-text-secondary font-medium rounded-full hover:text-text-primary hover:border-text-secondary transition-all cursor-pointer"
            >
              Stop
            </button>
          </div>
        </div>
      </div>

      <ReportModal isOpen={showReport} onClose={() => setShowReport(false)} />
    </div>
  );
}
