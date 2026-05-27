import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import Hero from '../components/Hero';
import SkillCard from '../components/SkillCard';
import TrendingCard from '../components/TrendingCard';
import Loading from '../components/Loading';

export default function Landing() {
  const [featured, setFeatured] = useState([]);
  const [trending, setTrending] = useState([]);
  const [stats, setStats] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/skills?sort=stars&limit=6').then(r => r.json()),
      fetch('/api/trending?limit=10').then(r => r.json()),
      fetch('/api/trending/stats').then(r => r.json()),
    ])
      .then(([skillsRes, trendingData, statsData]) => {
        setFeatured(skillsRes.data || []);
        setTrending(trendingData);
        setStats(statsData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleScan = async () => {
    setScanning(true);
    try {
      const res = await api('/skills/scan', { method: 'POST' });
      const data = await res.json();
      alert(`Scan complete! Found ${data.result?.total || 0} skills.`);
      window.location.reload();
    } catch (e) {
      alert('Scan failed. Did you set a GitHub token in Settings?');
    }
    setScanning(false);
  };

  if (loading) return <Loading text="Loading Skill Hub..." />;

  return (
    <div>
      <Hero onScan={handleScan} />

      {/* Stats bar */}
      {stats && (
        <div className="border-y border-figma-border bg-figma-light/50">
          <div className="max-w-content mx-auto px-6 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { label: 'Skills Discovered', value: stats.totalSkills },
                { label: 'Being Watched', value: stats.totalWatched },
                { label: 'New Updates', value: stats.totalUpdates, highlight: stats.totalUpdates > 0 },
                { label: 'Categories', value: stats.categoryDist?.length || 0 },
              ].map((s) => (
                <div key={s.label}>
                  <div className={`text-2xl font-bold ${s.highlight ? 'text-accent-pink' : 'text-figma-black'}`}>
                    {s.value}
                  </div>
                  <div className="text-sm text-figma-gray mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Featured Skills */}
      <section id="featured" className="max-w-content mx-auto px-6 py-16 md:py-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="section-title">Featured Skills</h2>
            <p className="text-figma-gray text-sm mt-1">Top starred skills from the community</p>
          </div>
          <Link
            to="/skills"
            className="text-sm font-medium text-accent-purple hover:text-accent-pink transition-colors"
          >
            View all &rarr;
          </Link>
        </div>

        {featured.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.map((skill) => (
              <SkillCard key={skill.id} skill={skill} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-figma-border rounded-figma">
            <p className="text-figma-gray text-sm mb-3">No skills discovered yet</p>
            <button
              onClick={handleScan}
              disabled={scanning}
              className="gradient-btn text-sm"
            >
              {scanning ? 'Scanning...' : 'Scan GitHub Now'}
            </button>
          </div>
        )}
      </section>

      {/* Trending */}
      {trending.length > 0 && (
        <section className="bg-figma-light/30 border-y border-figma-border">
          <div className="max-w-content mx-auto px-6 py-16 md:py-24">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="section-title">Trending on GitHub</h2>
                <p className="text-figma-gray text-sm mt-1">Highest-starred skills this week</p>
              </div>
              <Link
                to="/trending"
                className="text-sm font-medium text-accent-purple hover:text-accent-pink transition-colors"
              >
                Full ranking &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {trending.slice(0, 10).map((item, i) => (
                <TrendingCard key={item.id} item={item} rank={i + 1} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="max-w-content mx-auto px-6 py-16 md:py-24">
        <h2 className="section-title text-center mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              title: 'Discover',
              desc: 'Search and browse skills from GitHub. Filter by category, stars, or freshness.',
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              ),
            },
            {
              step: '02',
              title: 'Monitor',
              desc: 'Watch skills to track updates. Get notified on new commits and releases in real-time.',
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              ),
            },
            {
              step: '03',
              title: 'Install',
              desc: 'One-click copy install commands. Add skills to your Claude Code environment instantly.',
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              ),
            },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-pink/10 to-accent-purple/10 flex items-center justify-center mx-auto mb-5">
                <svg className="w-6 h-6 text-accent-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {item.icon}
                </svg>
              </div>
              <div className="text-xs font-bold text-accent-purple mb-2">{item.step}</div>
              <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
              <p className="text-sm text-figma-gray leading-relaxed max-w-xs mx-auto">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
