import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email && !phone) {
      setError('Email or phone number is required');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      await register({ email: email || undefined, phone: phone || undefined, password, name });
      navigate('/', { replace: true });
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
          <h1 className="text-2xl font-bold">Create account</h1>
          <p className="text-figma-gray text-sm mt-1">Join Skill Hub</p>
        </div>

        <div className="card p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Name (optional)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-3 py-2.5 border border-figma-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-purple/20 focus:border-accent-purple"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Email <span className="text-figma-gray font-normal">(optional if phone provided)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2.5 border border-figma-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-purple/20 focus:border-accent-purple"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Phone <span className="text-figma-gray font-normal">(optional if email provided)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+86 138 1234 5678"
                className="w-full px-3 py-2.5 border border-figma-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-purple/20 focus:border-accent-purple"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                minLength={6}
                className="w-full px-3 py-2.5 border border-figma-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-purple/20 focus:border-accent-purple"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Confirm Password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your password"
                required
                className="w-full px-3 py-2.5 border border-figma-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-purple/20 focus:border-accent-purple"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="gradient-btn w-full text-sm"
            >
              {submitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-figma-gray mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-accent-purple font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
