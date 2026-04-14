export default function WelcomeScreen({ onStart, type = 'text', serverStatus = 'ready' }) {
  const isVideo = type === 'video';
  const rules = [
    isVideo ? 'Your webcam must show you, live' : 'Be real. Be respectful.',
    'No nudity, hate speech, or harassment',
    'Do not ask for personal info or gender',
    'This is not a dating site',
    'Violators will be banned permanently',
  ];

  return (
    <div className="flex flex-col h-full p-4 md:p-6">
      <div className="flex-1">
        {serverStatus === 'connecting' ? (
          <p className="text-lg font-semibold mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            Connecting to server...
          </p>
        ) : (
          <p className="text-lg font-bold mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            {isVideo ? 'Welcome to Chattr.' : 'Ready to chat?'}
          </p>
        )}

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-accent font-semibold">
            <span className="text-lg">🔞</span>
            <span>You must be 18+</span>
          </div>
          {rules.map((rule, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-text-secondary">
              <span className="text-danger mt-0.5 shrink-0">•</span>
              <span>{rule}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4">
        <button
          onClick={onStart}
          className="w-full md:w-auto px-12 py-3 bg-accent text-white font-bold rounded-xl hover:bg-accent-hover transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <div className="text-lg">Start</div>
          <div className="text-[10px] opacity-60 font-normal">Esc to stop</div>
        </button>
      </div>
    </div>
  );
}
