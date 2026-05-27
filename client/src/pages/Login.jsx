import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [mode, setMode] = useState('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(
        mode === 'email' ? email : undefined,
        mode === 'phone' ? phone : undefined,
        password,
      );
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
      <div className="w-full max-w-sm mx-auto px-6">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-pink to-accent-purple flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-figma-gray text-sm mt-1">Sign in to Skill Hub</p>
        </div>

        <div className="card p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              {['email', 'phone'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                    mode === m
                      ? 'bg-white text-figma-black shadow-sm'
                      : 'text-figma-gray hover:text-figma-black'
                  }`}
                >
                  {m === 'email' ? 'Email' : 'Phone'}
                </button>
              ))}
            </div>

            {mode === 'email' ? (
              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-3 py-2.5 border border-figma-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-purple/20 focus:border-accent-purple"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-1.5">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+86 138 1234 5678"
                  required
                  className="w-full px-3 py-2.5 border border-figma-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-purple/20 focus:border-accent-purple"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                required
                minLength={6}
                className="w-full px-3 py-2.5 border border-figma-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-purple/20 focus:border-accent-purple"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="gradient-btn w-full text-sm"
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-figma-gray mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-accent-purple font-medium hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
