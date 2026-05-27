import { Router } from 'express';
import { getDb } from '../db.js';
import { clearOctokit } from '../services/github.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// All settings routes require authentication
router.use(requireAuth);

// GET /api/settings
router.get('/', (req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM settings').all();
  const settings = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  // Don't send full token in response
  if (settings.github_token) {
    settings.github_token_masked = settings.github_token.slice(0, 4) + '...' + settings.github_token.slice(-4);
    settings.github_token = '';
  }
  res.json(settings);
});

// PUT /api/settings
router.put('/', (req, res) => {
  const db = getDb();
  const allowed = ['github_token', 'webhook_secret', 'scan_interval'];

  for (const [key, value] of Object.entries(req.body)) {
    if (allowed.includes(key)) {
      db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, String(value));
    }
  }

  // Reinitialize Octokit if token changed
  if ('github_token' in req.body) {
    clearOctokit();
  }

  res.json({ message: 'Settings updated' });
});

// POST /api/settings/reset-data
router.post('/reset-data', (req, res) => {
  const db = getDb();
  db.exec(`
    DELETE FROM updates;
    DELETE FROM watched_skills;
    DELETE FROM skills;
  `);
  res.json({ message: 'Data reset complete' });
});

export default router;
