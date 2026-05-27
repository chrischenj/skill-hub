import { Router } from 'express';
import { getDb } from '../db.js';
import { getLatestCommit } from '../services/github.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// All watched routes require authentication
router.use(requireAuth);

// GET /api/watched — 监控列表
router.get('/', (req, res) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT w.*, s.full_name, s.name, s.description, s.stars, s.language, s.repo_url,
           s.last_commit_sha, s.last_committed_at, s.category, s.metadata
    FROM watched_skills w
    JOIN skills s ON s.id = w.skill_id
    ORDER BY w.watched_at DESC
  `).all();

  // Check for unread updates for each watched skill
  const unreadCounts = {};
  const unreadRows = db.prepare(
    'SELECT skill_id, COUNT(*) as cnt FROM updates WHERE read = 0 GROUP BY skill_id'
  ).all();
  for (const r of unreadRows) {
    unreadCounts[r.skill_id] = r.cnt;
  }

  res.json(rows.map(r => ({
    ...r,
    metadata: JSON.parse(r.metadata || '{}'),
    unread_updates: unreadCounts[r.skill_id] || 0,
  })));
});

// POST /api/watched — 添加监控
router.post('/', async (req, res) => {
  const { skill_id } = req.body;
  if (!skill_id) return res.status(400).json({ error: 'skill_id required' });

  const db = getDb();

  // Check if skill exists
  const skill = db.prepare('SELECT * FROM skills WHERE id = ?').get(skill_id);
  if (!skill) return res.status(404).json({ error: 'Skill not found' });

  // Set baseline commit
  let lastVersion = '';
  const [owner, repo] = skill.full_name.split('/');
  if (owner && repo) {
    try {
      const commit = await getLatestCommit(owner, repo);
      if (commit) lastVersion = commit.sha;
    } catch (e) { /* ignore */ }
  }

  db.prepare(`
    INSERT OR REPLACE INTO watched_skills (skill_id, last_version, watched_at)
    VALUES (?, ?, datetime('now'))
  `).run(skill_id, lastVersion);

  res.json({ message: 'Now watching', skill_id });
});

// DELETE /api/watched/:id — 取消监控
router.delete('/:skill_id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM watched_skills WHERE skill_id = ?').run(req.params.skill_id);
  res.json({ message: 'Unwatched' });
});

// POST /api/watched/mark-read — 标记所有更新已读
router.post('/mark-read', (req, res) => {
  const db = getDb();
  const { skill_id } = req.body;
  if (skill_id) {
    db.prepare('UPDATE updates SET read = 1 WHERE skill_id = ?').run(skill_id);
  } else {
    db.prepare('UPDATE updates SET read = 1 WHERE read = 0').run();
  }
  res.json({ message: 'Marked as read' });
});

export default router;
