import { Router } from 'express';
import { getDb } from '../db.js';

const router = Router();

// GET /api/trending — 趋势榜
router.get('/', (req, res) => {
  const db = getDb();
  const { period = 'all', limit = '50' } = req.query;
  const limitNum = Math.min(100, parseInt(limit) || 50);

  let rows;
  if (period === 'weekly') {
    rows = db.prepare(`
      SELECT * FROM skills
      WHERE last_checked_at >= datetime('now', '-7 days')
      ORDER BY stars DESC LIMIT ?
    `).all(limitNum);
  } else if (period === 'monthly') {
    rows = db.prepare(`
      SELECT * FROM skills
      WHERE last_checked_at >= datetime('now', '-30 days')
      ORDER BY stars DESC LIMIT ?
    `).all(limitNum);
  } else {
    rows = db.prepare(`
      SELECT * FROM skills
      ORDER BY stars DESC LIMIT ?
    `).all(limitNum);
  }

  res.json(rows.map((r, i) => ({
    rank: i + 1,
    ...r,
    metadata: JSON.parse(r.metadata || '{}'),
  })));
});

// GET /api/stats — 仪表盘统计
router.get('/stats', (req, res) => {
  const db = getDb();

  const totalSkills = db.prepare('SELECT COUNT(*) as count FROM skills').get().count;
  const totalWatched = db.prepare('SELECT COUNT(*) as count FROM watched_skills').get().count;
  const totalUpdates = db.prepare("SELECT COUNT(*) as count FROM updates WHERE read = 0").get().count;
  const lastScan = db.prepare("SELECT value FROM settings WHERE key='last_scan_at'").get();
  const topStarred = db.prepare('SELECT name, stars FROM skills ORDER BY stars DESC LIMIT 5').all();
  const categoryDist = db.prepare(
    'SELECT category, COUNT(*) as count FROM skills GROUP BY category ORDER BY count DESC'
  ).all();

  res.json({
    totalSkills,
    totalWatched,
    totalUpdates,
    lastScan: lastScan?.value || null,
    topStarred,
    categoryDist,
  });
});

export default router;
