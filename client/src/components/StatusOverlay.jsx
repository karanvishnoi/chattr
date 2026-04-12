export default function StatusOverlay({ status, onNext }) {
  if (status === 'connected') return null;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-dark/80 backdrop-blur-sm pointer-events-none">
      <div className="text-center animate-fade-in pointer-events-auto">
        {status === 'searching' && (
          <div className="mb-4 flex justify-center">
            <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        )}
        {status === 'disconnected' && (
          <div className="mb-4 text-5xl">👋</div>
        )}
        <p className="text-xl font-medium text-text-primary">
          {status === 'idle' && 'Ready to chat'}
          {status === 'searching' && 'Looking for someone...'}
          {status === 'disconnected' && 'Stranger disconnected'}
        </p>
        {status === 'searching' && (
          <p className="mt-2 text-sm text-text-secondary">
            This usually takes a few seconds
          </p>
        )}
        {status === 'disconnected' && (
          <>
            <p className="mt-2 text-sm text-text-secondary">Finding next person...</p>
            {onNext && (
              <button
                onClick={onNext}
                className="mt-4 px-6 py-2.5 bg-accent text-white font-medium rounded-full hover:bg-accent-hover transition-all cursor-pointer"
              >
                Skip Wait →
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
