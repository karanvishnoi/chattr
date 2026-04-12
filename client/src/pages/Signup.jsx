import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GENDERS = [
  { value: 'male', label: 'Male', icon: '♂' },
  { value: 'female', label: 'Female', icon: '♀' },
  { value: 'other', label: 'Other', icon: '⚧' },
];

export default function Signup() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!gender) {
      setError('Please select your gender');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(email, password, displayName, gender);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-dark">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <Link to="/" className="text-4xl font-bold tracking-tight">
            Chatt<span className="text-accent">r</span>
          </Link>
          <p className="text-text-secondary mt-2">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-dark-card border border-dark-border rounded-2xl p-6 space-y-4">
          {error && (
            <div className="bg-danger/10 border border-danger/30 text-danger text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-text-secondary mb-1.5">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 bg-dark border border-dark-border rounded-xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent transition-colors"
              placeholder="What should we call you?"
            />
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-dark border border-dark-border rounded-xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 bg-dark border border-dark-border rounded-xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent transition-colors"
              placeholder="Min 6 characters"
            />
          </div>

          {/* Gender Selection */}
          <div>
            <label className="block text-sm text-text-secondary mb-2">Gender</label>
            <div className="grid grid-cols-3 gap-3">
              {GENDERS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setGender(g.value)}
                  className={`py-3 rounded-xl border text-center transition-all cursor-pointer ${
                    gender === g.value
                      ? 'border-accent bg-accent/15 text-accent-light'
                      : 'border-dark-border hover:border-accent/50 text-text-secondary'
                  }`}
                >
                  <div className="text-2xl mb-1">{g.icon}</div>
                  <div className="text-xs font-medium">{g.label}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !gender}
            className="w-full py-3 bg-accent text-white font-semibold rounded-full hover:bg-accent-hover transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <p className="text-center text-sm text-text-secondary">
            Already have an account?{' '}
            <Link to="/login" className="text-accent hover:text-accent-light transition-colors">
              Log In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
