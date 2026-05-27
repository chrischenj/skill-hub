import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../utils/api';
import SkillCard, { categoryLabels } from '../components/SkillCard';
import Loading from '../components/Loading';

export default function Skills() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [skills, setSkills] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || 'all';
  const sort = searchParams.get('sort') || 'stars';
  const page = parseInt(searchParams.get('page')) || 1;

  const fetchSkills = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (category && category !== 'all') params.set('category', category);
      params.set('sort', sort);
      params.set('page', page);

      const [skillsRes, catRes] = await Promise.all([
        fetch(`/api/skills?${params}`).then(r => r.json()),
        fetch('/api/skills/meta/categories').then(r => r.json()),
      ]);

      setSkills(skillsRes.data || []);
      setPagination(skillsRes.pagination);
      setCategories(catRes || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSkills();
  }, [q, category, sort, page]);

  const updateParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'all' && value !== '') {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    if (key !== 'page') newParams.delete('page');
    setSearchParams(newParams);
  };

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-content mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Browse Skills</h1>
          <p className="text-figma-gray text-sm mt-1">
            {pagination ? `${pagination.total} skills found` : 'Loading...'}
          </p>
        </div>

        {/* Filters bar */}
        <div className="flex flex-wrap gap-3 mb-8">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-figma-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search..."
              value={q}
              onChange={(e) => updateParam('q', e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-figma-border rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-accent-purple/20 focus:border-accent-purple"
            />
          </div>

          {/* Category filter */}
          <select
            value={category}
            onChange={(e) => updateParam('category', e.target.value)}
            className="px-3 py-2.5 border border-figma-border rounded-lg text-sm bg-white
                       focus:outline-none focus:ring-2 focus:ring-accent-purple/20"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.category} value={c.category}>
                {categoryLabels[c.category] || c.category} ({c.count})
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => updateParam('sort', e.target.value)}
            className="px-3 py-2.5 border border-figma-border rounded-lg text-sm bg-white
                       focus:outline-none focus:ring-2 focus:ring-accent-purple/20"
          >
            <option value="stars">Most Stars</option>
            <option value="last_committed_at">Recently Updated</option>
            <option value="name">Name A-Z</option>
            <option value="created_at">Recently Added</option>
          </select>
        </div>

        {/* Results */}
        {loading ? (
          <Loading text="Searching skills..." />
        ) : skills.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {skills.map((skill) => (
                <SkillCard key={skill.id} skill={skill} />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => updateParam('page', String(page - 1))}
                  disabled={page <= 1}
                  className="px-3 py-2 border border-figma-border rounded-lg text-sm disabled:opacity-30 hover:bg-figma-light transition-colors"
                >
                  &larr; Prev
                </button>
                <span className="text-sm text-figma-gray px-4">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => updateParam('page', String(page + 1))}
                  disabled={page >= pagination.totalPages}
                  className="px-3 py-2 border border-figma-border rounded-lg text-sm disabled:opacity-30 hover:bg-figma-light transition-colors"
                >
                  Next &rarr;
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 border border-dashed border-figma-border rounded-figma">
            <p className="text-figma-gray text-sm">
              No skills found. Try a different search or{' '}
              <button
                onClick={() => api('/skills/scan', { method: 'POST' })}
                className="text-accent-purple font-medium hover:underline"
              >
                scan GitHub
              </button>
              {' '}for new skills.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
