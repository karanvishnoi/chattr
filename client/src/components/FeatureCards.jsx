const FEATURES = [
  {
    icon: '🎯',
    title: 'Interest-Based',
    subtitle: 'Matching',
    color: 'text-pink-400',
  },
  {
    icon: '🛡️',
    title: 'Active',
    subtitle: 'Moderation',
    color: 'text-green-400',
  },
  {
    icon: '🌍',
    title: 'Global',
    subtitle: 'Community',
    color: 'text-blue-400',
  },
  {
    icon: '⚡',
    title: 'Instant &',
    subtitle: 'Anonymous',
    color: 'text-yellow-400',
  },
];

export default function FeatureCards() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-3xl mx-auto">
      {FEATURES.map((f) => (
        <div
          key={f.title}
          className="bg-dark-card border border-dark-border rounded-2xl p-4 md:p-5 text-center hover:border-accent/50 transition-colors"
        >
          <div className="text-3xl mb-2">{f.icon}</div>
          <div className="font-semibold text-sm">{f.title}</div>
          <div className="font-semibold text-sm">{f.subtitle}</div>
        </div>
      ))}
    </div>
  );
}
