import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useSocket from '../hooks/useSocket';
import InterestInput from '../components/InterestInput';

export default function Home() {
  const navigate = useNavigate();
  const { onlineCount } = useSocket();
  const [interests, setInterests] = useState([]);

  function startChat(type) {
    const params = new URLSearchParams();
    if (interests.length) params.set('interests', interests.join(','));
    navigate(`/${type}?${params.toString()}`);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative floating elements */}
      <div className="absolute top-20 left-10 w-3 h-3 bg-accent/30 rounded-full animate-float" style={{ animationDelay: '0s' }} />
      <div className="absolute top-40 right-20 w-2 h-2 bg-accent/20 rounded-full animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-32 left-1/4 w-4 h-4 bg-accent/10 rounded-full animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/3 right-10 text-accent/20 text-2xl animate-sparkle" style={{ animationDelay: '0.5s' }}>+</div>
      <div className="absolute bottom-1/4 left-16 text-accent/20 text-xl animate-sparkle" style={{ animationDelay: '1.5s' }}>✦</div>
      <div className="absolute top-1/4 left-1/3 text-accent/15 text-lg animate-sparkle" style={{ animationDelay: '2.5s' }}>+</div>

      {/* Main content */}
      <div className="text-center max-w-2xl animate-fade-in">
        {/* Logo */}
        <div className="mb-6">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            Chatt<span className="text-accent">r</span>
          </h1>
          <p className="text-text-secondary text-lg md:text-xl mt-3">
            Meet someone new. Right now.
          </p>
        </div>

        {/* Online counter */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-dark-card border border-dark-border rounded-full">
            <span className="w-2.5 h-2.5 bg-success rounded-full animate-pulse" />
            <span className="text-sm text-text-secondary">
              <span className="text-text-primary font-semibold">{onlineCount.toLocaleString()}</span> people online
            </span>
          </div>
        </div>

        {/* Interest input */}
        <div className="mb-8">
          <InterestInput interests={interests} setInterests={setInterests} />
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
          <button
            onClick={() => startChat('video')}
            className="px-8 py-4 bg-accent text-white text-lg font-semibold rounded-full hover:bg-accent-hover hover:scale-[1.02] active:scale-[0.98] transition-all animate-pulse-glow cursor-pointer"
          >
            <span className="flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 7l-7 5 7 5V7z" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
              Start Video Chat
            </span>
          </button>
          <button
            onClick={() => startChat('text')}
            className="px-8 py-4 bg-dark-card border border-dark-border text-white text-lg font-semibold rounded-full hover:border-accent hover:bg-accent/10 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <span className="flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Start Text Chat
            </span>
          </button>
        </div>

        {/* Moderation notice */}
        <p className="text-xs text-text-secondary mb-8">
          🛡️ Chats are moderated. Please keep it respectful.
        </p>

        {/* Feature bar */}
        <div className="flex flex-wrap justify-center gap-6 text-sm text-text-secondary">
          <div className="flex items-center gap-2">
            <span className="text-accent">●</span>
            Interest-Based
          </div>
          <div className="flex items-center gap-2">
            <span className="text-accent">●</span>
            Moderated
          </div>
          <div className="flex items-center gap-2">
            <span className="text-accent">●</span>
            Global
          </div>
          <div className="flex items-center gap-2">
            <span className="text-accent">●</span>
            Instant
          </div>
        </div>
      </div>
    </div>
  );
}
