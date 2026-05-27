import { useState, useEffect } from 'react';
import TrendingCard from '../components/TrendingCard';
import Loading from '../components/Loading';

export default function Trending() {
  const [items, setItems] = useState([]);
  const [period, setPeriod] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/trending?period=${period}&limit=50`)
      .then(r => r.json())
      .then(data => setItems(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-content mx-auto px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Trending</h1>
            <p className="text-figma-gray text-sm mt-1">Top-ranked skills by star count</p>
          </div>

          <div className="flex gap-1 bg-figma-light rounded-lg p-1">
            {[
              { key: 'all', label: 'All Time' },
              { key: 'monthly', label: 'This Month' },
              { key: 'weekly', label: 'This Week' },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setPeriod(t.key)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  period === t.key
                    ? 'bg-white text-figma-black shadow-sm'
                    : 'text-figma-gray hover:text-figma-black'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <Loading text="Loading rankings..." />
        ) : items.length > 0 ? (
          <div className="card p-4 md:p-6 divide-y divide-figma-border">
            {items.map((item, i) => (
              <div key={item.id} className="py-1 first:pt-0 last:pb-0">
                <TrendingCard item={item} rank={i + 1} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-figma-border rounded-figma">
            <p className="text-figma-gray text-sm">No trending skills found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
