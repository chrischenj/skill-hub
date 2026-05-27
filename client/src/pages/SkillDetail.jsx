import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../utils/api';
import StarCount from '../components/StarCount';
import InstallButton from '../components/InstallButton';
import UpdateBadge from '../components/UpdateBadge';
import Loading from '../components/Loading';

export default function SkillDetail() {
  const { id } = useParams();
  const [skill, setSkill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [watching, setWatching] = useState(false);
  const [watchLoading, setWatchLoading] = useState(false);

  const fetchSkill = async () => {
    try {
      const res = await fetch(`/api/skills/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      setSkill(data);
      setWatching(data.isWatched);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => { fetchSkill(); }, [id]);

  const toggleWatch = async () => {
    setWatchLoading(true);
    try {
      if (watching) {
        await api(`/watched/${encodeURIComponent(id)}`, { method: 'DELETE' });
        setWatching(false);
      } else {
        await api('/watched', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ skill_id: id }),
        });
        setWatching(true);
      }
    } catch (e) {
      console.error(e);
    }
    setWatchLoading(false);
  };

  const markRead = async () => {
    await api('/watched/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skill_id: id }),
    });
    fetchSkill();
  };

  if (loading) return <Loading text="Loading skill..." />;
  if (error) return (
    <div className="pt-24 text-center py-20">
      <p className="text-figma-gray">{error}</p>
      <Link to="/skills" className="text-accent-purple text-sm mt-2 inline-block">&larr; Back to skills</Link>
    </div>
  );

  if (!skill) return null;

  const installCmd = `npx skills install ${skill.full_name}`;
  const m = skill.metadata || {};

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-content mx-auto px-6">
        {/* Back link */}
        <Link to="/skills" className="inline-flex items-center gap-1 text-sm text-figma-gray hover:text-figma-black mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Skills
        </Link>

        {/* Title section */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
          <div className="flex items-start gap-4">
            {m.owner_avatar ? (
              <img src={m.owner_avatar} alt="" className="w-14 h-14 rounded-full flex-shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent-pink/20 to-accent-purple/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-accent-purple">
                  {skill.name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
            )}
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold">{skill.name}</h1>
                <div className="flex items-center gap-2">
                  <StarCount count={skill.stars} size="lg" />
                  <span className="text-figma-gray text-sm">{skill.language}</span>
                </div>
              </div>
              <p className="text-figma-gray mt-2 leading-relaxed">{skill.description || 'No description'}</p>
              {skill.repo_url && (
                <a
                  href={skill.repo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-accent-purple hover:underline mt-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  {skill.full_name}
                </a>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={toggleWatch}
              disabled={watchLoading}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                watching
                  ? 'bg-accent-pink/5 border-accent-pink/20 text-accent-pink'
                  : 'bg-white border-figma-border text-figma-black hover:border-figma-gray'
              }`}
            >
              {watchLoading ? '...' : watching ? 'Watching' : 'Watch'}
            </button>
            <button
              onClick={() => api(`/skills/${encodeURIComponent(id)}/refresh`, { method: 'POST' })}
              className="px-5 py-2.5 rounded-lg text-sm font-medium border border-figma-border text-figma-black hover:bg-figma-light transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Install */}
        <div className="card p-5 mb-8">
          <h3 className="font-semibold text-sm mb-2">Install</h3>
          <InstallButton command={installCmd} />
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Main info */}
          <div className="md:col-span-2 space-y-6">
            {/* Updates */}
            {skill.updates?.length > 0 && (
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Recent Updates</h3>
                  <button onClick={markRead} className="text-xs text-figma-gray hover:text-figma-black">Mark all read</button>
                </div>
                <div className="space-y-3">
                  {skill.updates.map((u) => (
                    <div key={u.id} className={`p-3 rounded-lg text-sm ${u.read ? 'bg-white' : 'bg-accent-pink/5 border border-accent-pink/10'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {!u.read && <span className="w-1.5 h-1.5 rounded-full bg-accent-pink" />}
                        <span className="font-medium">{u.title}</span>
                        <span className="text-xs text-figma-gray">{u.type === 'version' ? 'Release' : 'Commit'}</span>
                      </div>
                      {u.description && <p className="text-figma-gray text-xs mt-1 line-clamp-2">{u.description}</p>}
                      <span className="text-xs text-figma-gray mt-1 block">{u.created_at}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Repo info */}
            {skill.last_commit_message && (
              <div className="card p-5">
                <h3 className="font-semibold mb-3">Latest Commit</h3>
                <p className="text-sm text-figma-gray">{skill.last_commit_message}</p>
                {skill.last_committed_at && (
                  <p className="text-xs text-figma-gray mt-1">{skill.last_committed_at}</p>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="card p-5">
              <h3 className="font-semibold text-sm mb-3">Details</h3>
              <dl className="space-y-3 text-sm">
                {skill.category && skill.category !== 'uncategorized' && (
                  <div className="flex justify-between">
                    <dt className="text-figma-gray">Category</dt>
                    <dd className="font-medium capitalize">{skill.category}</dd>
                  </div>
                )}
                {skill.language && (
                  <div className="flex justify-between">
                    <dt className="text-figma-gray">Language</dt>
                    <dd className="font-medium">{skill.language}</dd>
                  </div>
                )}
                {skill.license && (
                  <div className="flex justify-between">
                    <dt className="text-figma-gray">License</dt>
                    <dd className="font-medium">{skill.license}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-figma-gray">Forks</dt>
                  <dd className="font-medium">{m.forks || 0}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-figma-gray">Stars</dt>
                  <dd className="font-medium">{skill.stars || 0}</dd>
                </div>
              </dl>
            </div>

            <div className="card p-5">
              <h3 className="font-semibold text-sm mb-3">Actions</h3>
              <div className="space-y-2">
                <a
                  href={skill.repo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-figma-gray hover:text-figma-black transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  View on GitHub
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
