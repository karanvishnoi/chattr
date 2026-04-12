import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: '',
    features: [
      'Unlimited text chat',
      '30 min video/day',
      'Random matching',
      'Interest-based matching',
    ],
    notIncluded: ['Gender filter', 'Priority matching', 'Ad-free', 'Reconnect feature'],
    cta: 'Current Plan',
    popular: false,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 299,
    period: '/month',
    features: [
      'Unlimited text chat',
      'Unlimited video chat',
      'Gender filter',
      'Priority matching',
      'Ad-free experience',
      'Interest-based matching',
    ],
    notIncluded: ['Reconnect feature', 'See who liked you'],
    cta: 'Upgrade Now',
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 599,
    period: '/month',
    features: [
      'Everything in Premium',
      'Reconnect with same person',
      'See who liked you',
      'Priority support',
      'Exclusive badge',
    ],
    notIncluded: [],
    cta: 'Go Pro',
    popular: false,
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  function handleSelect(planId) {
    if (!user) {
      navigate('/signup');
      return;
    }
    if (planId === 'free') return;
    // TODO: integrate Razorpay checkout
    alert('Razorpay payment integration coming soon! Plan: ' + planId);
  }

  return (
    <div className="min-h-screen bg-dark px-4 py-12">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <button onClick={() => navigate('/')} className="text-3xl font-bold tracking-tight mb-4 cursor-pointer">
            Chatt<span className="text-accent">r</span>
          </button>
          <h1 className="text-3xl md:text-4xl font-bold mt-4">Choose Your Plan</h1>
          <p className="text-text-secondary mt-3 max-w-lg mx-auto">
            Unlock premium features for a better chatting experience
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-dark-card border rounded-2xl p-6 flex flex-col transition-all hover:scale-[1.02] ${
                plan.popular
                  ? 'border-accent shadow-lg shadow-accent/10'
                  : 'border-dark-border'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-accent text-white text-xs font-semibold rounded-full">
                  Most Popular
                </div>
              )}

              <h3 className="text-xl font-bold">{plan.name}</h3>
              <div className="mt-3 mb-6">
                <span className="text-4xl font-bold">
                  {plan.price === 0 ? 'Free' : `₹${plan.price}`}
                </span>
                {plan.period && (
                  <span className="text-text-secondary text-sm">{plan.period}</span>
                )}
              </div>

              <ul className="space-y-3 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <span className="text-success mt-0.5">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
                {plan.notIncluded.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-text-secondary/50">
                    <span className="mt-0.5">✗</span>
                    <span className="line-through">{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelect(plan.id)}
                disabled={user?.plan === plan.id}
                className={`w-full py-3 rounded-full font-semibold transition-all cursor-pointer ${
                  plan.popular
                    ? 'bg-accent text-white hover:bg-accent-hover'
                    : plan.id === 'free'
                    ? 'bg-dark-border text-text-secondary'
                    : 'bg-dark border border-accent text-accent hover:bg-accent/10'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {user?.plan === plan.id ? 'Current Plan' : plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-16 text-center">
          <p className="text-text-secondary text-sm">
            Secure payments via Razorpay. Cancel anytime. No hidden charges.
          </p>
        </div>
      </div>
    </div>
  );
}
