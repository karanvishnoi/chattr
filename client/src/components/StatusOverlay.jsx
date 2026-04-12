export default function StatusOverlay({ status }) {
  if (status === 'connected') return null;

  const messages = {
    idle: 'Ready to chat',
    searching: 'Looking for someone...',
    disconnected: 'Stranger disconnected',
  };

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-dark/80 backdrop-blur-sm">
      <div className="text-center animate-fade-in">
        {status === 'searching' && (
          <div className="mb-4 flex justify-center">
            <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        )}
        {status === 'disconnected' && (
          <div className="mb-4 text-5xl">👋</div>
        )}
        <p className="text-xl font-medium text-text-primary">
          {messages[status] || ''}
        </p>
        {status === 'searching' && (
          <p className="mt-2 text-sm text-text-secondary">
            This usually takes a few seconds
          </p>
        )}
      </div>
    </div>
  );
}
