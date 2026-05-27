import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Hero({ onScan }) {
  const [query, setQuery] = useState('');
  const [scanning, setScanning] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/skills?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleScan = async () => {
    setScanning(true);
    try {
      await onScan();
    } finally {
      setScanning(false);
    }
  };

  return (
    <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-50/40 via-white to-white pointer-events-none" />

      {/* Decorative elements */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-accent-pink/5 rounded-full blur-3xl" />
      <div className="absolute top-40 right-1/4 w-80 h-80 bg-accent-purple/5 rounded-full blur-3xl" />

      <div className="relative max-w-content mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 border border-purple-100 rounded-full text-sm text-accent-purple font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-purple animate-pulse" />
            Live on GitHub
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.1] mb-6">
            Discover{' '}
            <span className="gradient-text">Skills</span>
            <br />
            That Amplify Your Flow
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-figma-gray max-w-xl mx-auto mb-10 leading-relaxed">
            Browse, monitor, and install Claude Code skills from the community.
            Real-time updates, trending discoveries, one-click install.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="max-w-lg mx-auto mb-6">
            <div className="relative">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-figma-gray"
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search skills by name, description, or category..."
                className="w-full pl-12 pr-20 py-4 bg-white border border-figma-border rounded-figma text-sm
                           shadow-card focus:outline-none focus:ring-2 focus:ring-accent-purple/20 focus:border-accent-purple
                           transition-all"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-figma-black text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
              >
                Search
              </button>
            </div>
          </form>

          {/* CTA buttons */}
          <div className="flex items-center justify-center gap-3">
            <button onClick={handleScan} disabled={scanning}
              className="gradient-btn flex items-center gap-2"
            >
              {scanning ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Scanning...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Scan GitHub
                </>
              )}
            </button>
            <a href="#featured"
              className="px-6 py-2.5 border border-figma-border text-figma-black font-medium rounded-lg
                         hover:bg-figma-light transition-colors text-sm"
            >
              Explore Featured
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
