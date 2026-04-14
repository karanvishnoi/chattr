import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useSocket from '../hooks/useSocket';
import InterestInput from '../components/InterestInput';
import FeatureCards from '../components/FeatureCards';
import FAQ from '../components/FAQ';
import Footer from '../components/Footer';
import ThemeToggle from '../components/ThemeToggle';

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
    <div className="min-h-screen bg-dark relative overflow-hidden">
      {/* Decorative blobs — top right big purple corner like Umingle */}
      <div className="absolute -top-10 -right-10 w-48 h-48 md:w-72 md:h-72 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-20 left-0 w-40 h-40 md:w-64 md:h-64 bg-accent/10 rounded-full blur-3xl -translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-40 left-10 text-accent/20 text-3xl md:text-4xl animate-sparkle pointer-events-none">✦</div>
      <div className="absolute top-1/3 right-8 text-accent/15 text-2xl md:text-3xl animate-sparkle pointer-events-none" style={{ animationDelay: '1s' }}>✦</div>
      <div className="absolute bottom-1/4 right-1/3 text-accent/10 text-xl md:text-2xl animate-sparkle pointer-events-none" style={{ animationDelay: '2s' }}>+</div>

      {/* Top header — Umingle style */}
      <header className="relative z-10 flex items-center justify-between px-4 md:px-8 py-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 md:w-10 md:h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <span className="text-2xl md:text-3xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Chatt<span className="text-accent">r</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {/* Online counter badge — Umingle style */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/15 border border-accent/30 rounded-full">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span className="text-sm md:text-base font-bold text-accent">
              {onlineCount.toLocaleString()}+
            </span>
            <span className="text-xs md:text-sm text-accent/70 hidden sm:inline">online</span>
          </div>
        </div>
      </header>

      {/* Hero card */}
      <main className="relative z-10 px-4 py-6 md:py-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-dark-card/60 border border-dark-border rounded-3xl p-5 md:p-10 backdrop-blur-sm animate-fade-in shadow-xl">
            <h1 className="text-[28px] md:text-5xl font-bold text-center mb-3 leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
              Chat with Strangers
            </h1>
            <p className="text-center text-text-secondary max-w-lg mx-auto mb-7 md:mb-8 text-sm md:text-base leading-relaxed">
              Ready to meet someone new? Chattr makes it easy to chat with strangers in random video or text chats. It's simple, fast, and time to start mingling!
            </p>

            {/* Start chatting buttons */}
            <div className="text-center mb-7">
              <p className="text-base md:text-lg font-semibold mb-4" style={{ fontFamily: 'var(--font-display)' }}>Start chatting</p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => startChat('text')}
                  className="flex-1 md:flex-none px-6 md:px-10 py-3.5 bg-accent text-white font-bold text-base md:text-lg rounded-2xl hover:bg-accent-hover hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-accent/30"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Text
                </button>
                <span className="text-text-secondary text-sm font-medium">or</span>
                <button
                  onClick={() => startChat('video')}
                  className="flex-1 md:flex-none px-6 md:px-10 py-3.5 bg-accent text-white font-bold text-base md:text-lg rounded-2xl hover:bg-accent-hover hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-accent/30"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Video
                </button>
              </div>
            </div>

            {/* Interest input */}
            <div className="mb-6">
              <p className="text-sm font-medium mb-2.5 text-center">What do you want to talk about?</p>
              <InterestInput interests={interests} setInterests={setInterests} />
            </div>

            {/* Moderation banner */}
            <div className="flex items-center justify-center gap-2 bg-accent/10 border border-accent/20 rounded-2xl px-4 py-3 text-xs md:text-sm text-accent-light font-medium">
              <span className="text-base">💬</span>
              <span className="text-center">Chats are moderated. Please keep it respectful</span>
            </div>
          </div>
        </div>

        {/* Feature cards */}
        <div className="mt-10 md:mt-16">
          <FeatureCards />
        </div>

        {/* FAQ */}
        <div className="mt-14 md:mt-20">
          <FAQ />
        </div>
      </main>

      <Footer />
    </div>
  );
}
