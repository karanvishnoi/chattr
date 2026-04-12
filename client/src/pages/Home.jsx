import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useSocket from '../hooks/useSocket';
import { useAuth } from '../context/AuthContext';
import InterestInput from '../components/InterestInput';

export default function Home() {
  const navigate = useNavigate();
  const { onlineCount } = useSocket();
  const { user, logout } = useAuth();
  const [interests, setInterests] = useState([]);
  const [genderPref, setGenderPref] = useState('any');

  function startChat(type) {
    if (!user) {
      navigate('/signup');
      return;
    }
    const params = new URLSearchParams();
    if (interests.length) params.set('interests', interests.join(','));
    if (genderPref !== 'any') params.set('genderPref', genderPref);
    navigate(`/${type}?${params.toString()}`);
  }

  const isPremium = user && user.plan !== 'free';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-3 h-3 bg-accent/30 rounded-full animate-float" style={{ animationDelay: '0s' }} />
      <div className="absolute top-40 right-20 w-2 h-2 bg-accent/20 rounded-full animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-32 left-1/4 w-4 h-4 bg-accent/10 rounded-full animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/3 right-10 text-accent/20 text-2xl animate-sparkle">+</div>
      <div className="absolute bottom-1/4 left-16 text-accent/15 text-xl animate-sparkle" style={{ animationDelay: '1.5s' }}>+</div>

      {/* Top nav */}
      <div className="absolute top-4 right-4 flex items-center gap-3">
        {user ? (
          <>
            <Link to="/pricing" className="text-xs text-accent hover:text-accent-light transition-colors">
              {isPremium ? `${user.plan} Plan` : 'Upgrade'}
            </Link>
            <span className="text-xs text-text-secondary">{user.displayName}</span>
            <button onClick={logout} className="text-xs text-text-secondary hover:text-white transition-colors cursor-pointer">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-sm text-text-secondary hover:text-white transition-colors">
              Log In
            </Link>
            <Link to="/signup" className="text-sm px-4 py-1.5 bg-accent text-white rounded-full hover:bg-accent-hover transition-colors">
              Sign Up
            </Link>
          </>
        )}
      </div>

      {/* Main content */}
      <div className="text-center max-w-2xl animate-fade-in">
        <div className="mb-6">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            Chatt<span className="text-accent">r</span>
          </h1>
          <p className="text-text-secondary text-lg md:text-xl mt-3">
            Meet someone new. Right now.
          </p>
        </div>

        {/* Online counter */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-dark-card border border-dark-border rounded-full">
            <span className="w-2.5 h-2.5 bg-success rounded-full animate-pulse" />
            <span className="text-sm text-text-secondary">
              <span className="text-text-primary font-semibold">{onlineCount.toLocaleString()}</span> people online
            </span>
          </div>
        </div>

        {/* Gender preference (premium only) */}
        {user && (
          <div className="mb-6">
            <p className="text-xs text-text-secondary mb-2">Match with</p>
            <div className="inline-flex gap-2">
              {[
                { value: 'any', label: 'Anyone' },
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    if (opt.value !== 'any' && !isPremium) {
                      navigate('/pricing');
                      return;
                    }
                    setGenderPref(opt.value);
                  }}
                  className={`px-4 py-2 rounded-full text-sm transition-all cursor-pointer ${
                    genderPref === opt.value
                      ? 'bg-accent text-white'
                      : 'bg-dark-card border border-dark-border text-text-secondary hover:border-accent/50'
                  }`}
                >
                  {opt.label}
                  {opt.value !== 'any' && !isPremium && (
                    <span className="ml-1 text-[10px] text-accent">PRO</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Interest input */}
        <div className="mb-8">
          <InterestInput interests={interests} setInterests={setInterests} />
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
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

        {/* Upgrade banner for free users */}
        {user && !isPremium && (
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 px-6 py-3 mb-6 bg-gradient-to-r from-accent/20 to-purple-500/20 border border-accent/30 rounded-full text-sm text-accent-light hover:border-accent transition-colors"
          >
            Unlock gender filter, unlimited video & more
            <span className="text-xs bg-accent text-white px-2 py-0.5 rounded-full">PRO</span>
          </Link>
        )}

        <p className="text-xs text-text-secondary mb-8">
          Chats are moderated. Please keep it respectful.
        </p>

        <div className="flex flex-wrap justify-center gap-6 text-sm text-text-secondary">
          <div className="flex items-center gap-2"><span className="text-accent">●</span>Interest-Based</div>
          <div className="flex items-center gap-2"><span className="text-accent">●</span>Moderated</div>
          <div className="flex items-center gap-2"><span className="text-accent">●</span>Global</div>
          <div className="flex items-center gap-2"><span className="text-accent">●</span>Instant</div>
        </div>
      </div>
    </div>
  );
}
