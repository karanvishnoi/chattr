export default function VideoPanel({ localVideoRef, remoteVideoRef, connectionState }) {
  return (
    <div className="relative w-full h-full bg-dark-card rounded-2xl overflow-hidden flex items-center justify-center">
      {/* Remote video — centered, no stretch */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="w-full h-full object-contain bg-black"
      />

      {/* No remote video placeholder */}
      {connectionState !== 'connected' && (
        <div className="absolute inset-0 flex items-center justify-center bg-dark-card">
          <div className="text-center text-text-secondary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="mx-auto mb-3 opacity-30"
            >
              <path d="M23 7l-7 5 7 5V7z" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
            <p className="text-sm">Waiting for video...</p>
          </div>
        </div>
      )}

      {/* Local video — bottom right corner */}
      <div className="absolute bottom-3 right-3 w-28 h-20 sm:w-36 sm:h-28 md:w-44 md:h-32 rounded-xl overflow-hidden border-2 border-dark-border/50 shadow-2xl z-10">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
        />
      </div>

      {/* Connection quality indicator */}
      <div className="absolute top-3 left-3 z-10">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm ${
          connectionState === 'connected'
            ? 'bg-success/20 text-success'
            : connectionState === 'connecting'
            ? 'bg-yellow-500/20 text-yellow-400'
            : 'bg-dark-card/80 text-text-secondary'
        }`}>
          <span className={`w-2 h-2 rounded-full ${
            connectionState === 'connected'
              ? 'bg-success'
              : connectionState === 'connecting'
              ? 'bg-yellow-400 animate-pulse'
              : 'bg-text-secondary'
          }`} />
          {connectionState === 'connected' ? 'Connected' : connectionState === 'connecting' ? 'Connecting...' : 'Waiting'}
        </div>
      </div>
    </div>
  );
}
