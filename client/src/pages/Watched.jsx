import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import UpdateBadge from '../components/UpdateBadge';
import StarCount from '../components/StarCount';
import Loading from '../components/Loading';

export default function Watched() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWatched = async () => {
    try {
      const res = await api('/watched');
      const data = await res.json();
      setItems(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchWatched(); }, []);

  // Auto-poll every 60s
  useEffect(() => {
    const timer = setInterval(fetchWatched, 60000);
    return () => clearInterval(timer);
  }, []);

  const unwatch = async (skillId) => {
    await api(`/watched/${skillId}`, { method: 'DELETE' });
    fetchWatched();
  };

  const markAllRead = async () => {
    await api('/watched/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    fetchWatched();
  };

  const hasUpdates = items.some((item) => item.unread_updates > 0);

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-content mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Watched Skills</h1>
            <p className="text-figma-gray text-sm mt-1">
              {items.length > 0
                ? `${items.length} skill${items.length > 1 ? 's' : ''} being monitored`
                : 'No skills being watched'}
            </p>
          </div>
          {hasUpdates && (
            <button
              onClick={markAllRead}
              className="text-sm text-accent-purple hover:underline font-medium"
            >
              Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <Loading text="Loading watched skills..." />
        ) : items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className={`card p-5 flex flex-col sm:flex-row sm:items-center gap-4 ${
                  item.unread_updates > 0 ? 'ring-1 ring-accent-pink/20' : ''
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-pink/20 to-accent-purple/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-accent-purple">
                      {item.name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <Link
                      to={`/skills/${encodeURIComponent(item.skill_id)}`}
                      className="font-semibold text-figma-black hover:text-accent-purple transition-colors truncate block"
                    >
                      {item.name}
                    </Link>
                    <div className="flex items-center gap-3 text-xs text-figma-gray mt-0.5">
                      <StarCount count={item.stars} />
                      {item.language && <span>{item.language}</span>}
                      <span>
                        Watched{' '}
                        {item.watched_at
                          ? new Date(item.watched_at).toLocaleDateString()
                          : 'recently'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <UpdateBadge count={item.unread_updates} />
                  <button
                    onClick={() => unwatch(item.skill_id)}
                    className="text-xs text-figma-gray hover:text-red-500 transition-colors px-3 py-1.5 border border-figma-border rounded-lg"
                  >
                    Unwatch
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-figma-border rounded-figma">
            <div className="w-12 h-12 rounded-full bg-figma-light flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-figma-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </div>
            <p className="text-figma-gray text-sm mb-4">
              You're not watching any skills yet.
            </p>
            <Link
              to="/skills"
              className="gradient-btn inline-flex text-sm"
            >
              Browse Skills
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
