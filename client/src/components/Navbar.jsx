import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const links = [
  { to: '/skills', label: 'Browse' },
  { to: '/trending', label: 'Trending' },
  { to: '/watched', label: 'Watched' },
];

export default function Navbar() {
  const location = useLocation();
  const { user, loading: authLoading, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [updateCount, setUpdateCount] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const res = await fetch('/api/trending/stats');
        const data = await res.json();
        setUpdateCount(data.totalUpdates || 0);
      } catch {}
    };
    fetchUpdates();
    const timer = setInterval(fetchUpdates, 60000);
    return () => clearInterval(timer);
  }, []);

  // Hide navbar on auth pages
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const navLinks = (
    <>
      {links.map((l) => (
        <Link
          key={l.to}
          to={l.to}
          onClick={() => setMobileOpen(false)}
          className={`relative px-3 py-2 text-sm font-medium transition-colors ${
            isActive(l.to) ? 'text-figma-black' : 'text-figma-gray hover:text-figma-black'
          }`}
        >
          {l.label}
          {l.to === '/watched' && updateCount > 0 && (
            <span className="absolute -top-0.5 -right-1 w-4 h-4 bg-accent-pink text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {updateCount > 9 ? '9+' : updateCount}
            </span>
          )}
        </Link>
      ))}
      <Link
        to="/settings"
        onClick={() => setMobileOpen(false)}
        className={`px-3 py-2 text-sm font-medium transition-colors ${
          isActive('/settings') ? 'text-figma-black' : 'text-figma-gray hover:text-figma-black'
        }`}
      >
        Settings
      </Link>
      {user ? (
        <div className="relative group ml-2">
          <button className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-pink to-accent-purple flex items-center justify-center text-white text-sm font-bold hover:opacity-90 transition-opacity">
            {(user.name || user.email || '?').charAt(0).toUpperCase()}
          </button>
          <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-figma-border rounded-figma shadow-card opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
            <div className="px-4 py-3 border-b border-figma-border">
              <p className="text-sm font-medium truncate">{user.name || 'User'}</p>
              <p className="text-xs text-figma-gray truncate">{user.email || user.phone || ''}</p>
            </div>
            <button
              onClick={logout}
              className="w-full text-left px-4 py-2.5 text-sm text-figma-gray hover:text-red-500 hover:bg-red-50 transition-colors rounded-b-figma"
            >
              Sign out
            </button>
          </div>
        </div>
      ) : (
        <Link
          to="/login"
          onClick={() => setMobileOpen(false)}
          className="gradient-btn text-sm !px-4 !py-2 ml-2"
        >
          Login
        </Link>
      )}
    </>
  );

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled ? 'bg-white/95 backdrop-blur-md border-b border-figma-border shadow-sm' : 'bg-white'
      }`}
    >
      <div className="max-w-content mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-pink to-accent-purple flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="font-bold text-lg text-figma-black group-hover:opacity-80 transition-opacity">
            Skill Hub
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">{navLinks}</div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-figma-gray hover:text-figma-black"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            {mobileOpen ? (
              <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            ) : (
              <path d="M3 5H17M3 10H17M3 15H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-figma-border bg-white px-6 py-4 space-y-3">
          {navLinks}
          {user && (
            <div className="pt-3 border-t border-figma-border">
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-pink to-accent-purple flex items-center justify-center text-white text-sm font-bold">
                  {(user.name || user.email || '?').charAt(0).toUpperCase()}
                </div>
                <div className="text-sm">
                  <p className="font-medium">{user.name || 'User'}</p>
                  <p className="text-figma-gray text-xs truncate">{user.email || user.phone || ''}</p>
                </div>
              </div>
              <button
                onClick={() => { logout(); setMobileOpen(false); }}
                className="w-full text-left px-3 py-2 text-sm text-figma-gray hover:text-red-500 transition-colors"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
