import { Link } from 'react-router-dom';
import StarCount from './StarCount';

export default function TrendingCard({ item, rank }) {
  const { id, name, description, stars, language, metadata } = item;
  const m = metadata || {};

  const rankColors = [
    'text-yellow-500',
    'text-gray-400',
    'text-amber-600',
  ];

  return (
    <Link
      to={`/skills/${encodeURIComponent(id)}`}
      className="flex items-center gap-4 p-3 rounded-xl hover:bg-figma-light transition-colors group"
    >
      <span className={`text-lg font-bold w-8 text-center flex-shrink-0 ${
        rank <= 3 ? rankColors[rank - 1] : 'text-gray-300'
      }`}>
        {rank}
      </span>

      {m.owner_avatar ? (
        <img src={m.owner_avatar} alt="" className="w-10 h-10 rounded-full flex-shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-pink/20 to-accent-purple/20 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-accent-purple">
            {name?.charAt(0)?.toUpperCase() || '?'}
          </span>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-figma-black group-hover:text-accent-purple transition-colors truncate">
            {name}
          </h3>
          {language && (
            <span className="text-xs text-figma-gray flex-shrink-0">· {language}</span>
          )}
        </div>
        <p className="text-sm text-figma-gray truncate">{description || 'No description'}</p>
      </div>

      <StarCount count={stars} />
    </Link>
  );
}
