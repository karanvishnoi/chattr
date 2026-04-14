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
      {/* Decorative background shapes */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute top-40 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl translate-x-1/3" />
      <div className="absolute bottom-40 left-10 text-accent/20 text-4xl animate-sparkle">✦</div>
      <div className="absolute top-1/3 right-20 text-accent/15 text-3xl animate-sparkle" style={{ animationDelay: '1s' }}>✦</div>
      <div className="absolute bottom-1/4 right-1/3 text-accent/10 text-2xl animate-sparkle" style={{ animationDelay: '2s' }}>+</div>

      {/* Top header */}
      <header className="relative z-10 flex items-center justify-between px-4 md:px-8 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">C</span>
          </div>
          <span className="text-xl font-bold tracking-tight">
            Chatt<span className="text-accent">r</span>
          </span>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          <div className="hidden sm:flex items-center gap-1.5 text-sm">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span className="font-semibold">{onlineCount.toLocaleString()}+</span>
            <span className="text-text-secondary">online</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Hero card */}
      <main className="relative z-10 px-4 py-8 md:py-12">
        <div className="max-w-3xl mx-auto">
          <div className="bg-dark-card/60 border border-dark-border rounded-3xl p-6 md:p-10 backdrop-blur-sm animate-fade-in">
            <h1 className="text-3xl md:text-5xl font-bold text-center mb-3">
              Chat with Strangers
            </h1>
            <p className="text-center text-text-secondary max-w-lg mx-auto mb-8 text-sm md:text-base">
              Ready to meet someone new? Chattr makes it easy to chat with strangers in random video or text chats. It's simple, fast, and time to start mingling!
            </p>

            {/* Start chatting buttons */}
            <div className="text-center mb-6">
              <p className="text-sm text-text-secondary mb-3">Start chatting</p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => startChat('text')}
                  className="px-8 py-3 bg-accent text-white font-semibold rounded-2xl hover:bg-accent-hover hover:scale-[1.02] transition-all cursor-pointer min-w-[120px]"
                >
                  Text
                </button>
                <span className="text-text-secondary text-sm">or</span>
                <button
                  onClick={() => startChat('video')}
                  className="px-8 py-3 bg-accent text-white font-semibold rounded-2xl hover:bg-accent-hover hover:scale-[1.02] transition-all cursor-pointer min-w-[120px]"
                >
                  Video
                </button>
              </div>
            </div>

            {/* Interest input */}
            <div className="mb-6">
              <p className="text-sm text-text-secondary mb-2 text-center">What do you want to talk about?</p>
              <InterestInput interests={interests} setInterests={setInterests} />
            </div>

            {/* Moderation banner */}
            <div className="flex items-center justify-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-2.5 text-sm text-accent-light">
              <span>💬</span>
              <span>Chats are moderated. Please keep it respectful</span>
            </div>
          </div>
        </div>

        {/* Feature cards */}
        <div className="mt-12 md:mt-16">
          <FeatureCards />
        </div>

        {/* FAQ */}
        <div className="mt-16 md:mt-20">
          <FAQ />
        </div>
      </main>

      <Footer />
    </div>
  );
}
