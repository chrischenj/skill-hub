import { Router } from 'express';
import { getDb } from '../db.js';
import { scanGitHub, scanSingleRepo } from '../services/scanner.js';
import { discoverLocalSkills } from '../services/local-discovery.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/skills — 列表（搜索/筛选/排序/分页）
router.get('/', (req, res) => {
  const db = getDb();
  const {
    q = '',
    category = '',
    sort = 'stars',
    order = 'desc',
    page = '1',
    limit = '30',
  } = req.query;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];
  const params = [];

  if (q) {
    conditions.push('(name LIKE ? OR description LIKE ? OR full_name LIKE ?)');
    const like = `%${q}%`;
    params.push(like, like, like);
  }

  if (category && category !== 'all') {
    conditions.push('category = ?');
    params.push(category);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const validSorts = ['stars', 'name', 'updated_at', 'last_committed_at', 'created_at'];
  const sortField = validSorts.includes(sort) ? sort : 'stars';
  const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM skills ${where}`).get(...params);
  const total = countRow.total;

  const rows = db.prepare(`
    SELECT * FROM skills ${where}
    ORDER BY ${sortField} ${sortOrder}
    LIMIT ? OFFSET ?
  `).all(...params, limitNum, offset);

  res.json({
    data: rows.map(r => ({ ...r, metadata: JSON.parse(r.metadata || '{}') })),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

// GET /api/skills/:id — 详情
router.get('/:id', (req, res) => {
  const db = getDb();
  const skill = db.prepare('SELECT * FROM skills WHERE id = ?').get(req.params.id);
  if (!skill) return res.status(404).json({ error: 'Skill not found' });

  const updates = db.prepare(
    'SELECT * FROM updates WHERE skill_id = ? ORDER BY created_at DESC LIMIT 20'
  ).all(req.params.id);

  const isWatched = db.prepare(
    'SELECT 1 FROM watched_skills WHERE skill_id = ?'
  ).get(req.params.id);

  res.json({
    ...skill,
    metadata: JSON.parse(skill.metadata || '{}'),
    updates,
    isWatched: !!isWatched,
  });
});

// POST /api/scan — 手动触发扫描
router.post('/scan', requireAuth, async (req, res) => {
  try {
    const result = await scanGitHub();
    res.json({ message: 'Scan completed', result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/skills/:id/refresh — 刷新单个 skill
router.post('/:id/refresh', requireAuth, async (req, res) => {
  try {
    const result = await scanSingleRepo(req.params.id);
    res.json({ message: 'Refreshed', result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/discover-local — 发现本地 skill
router.post('/discover-local', requireAuth, (req, res) => {
  try {
    const result = discoverLocalSkills();
    res.json({ message: 'Local discovery complete', result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/categories — 分类列表
router.get('/meta/categories', (req, res) => {
  const db = getDb();
  const rows = db.prepare(
    'SELECT category, COUNT(*) as count FROM skills GROUP BY category ORDER BY count DESC'
  ).all();
  res.json(rows);
});

export default router;
