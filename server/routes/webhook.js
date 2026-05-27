import { Router } from 'express';
import { getDb } from '../db.js';
import { createHmac } from 'crypto';

const router = Router();

// POST /api/webhook — GitHub Webhook 接收
router.post('/', (req, res) => {
  const db = getDb();

  // Verify webhook secret
  const stored = db.prepare("SELECT value FROM settings WHERE key='webhook_secret'").get();
  const secret = stored?.value || '';

  if (secret) {
    const signature = req.headers['x-hub-signature-256'];
    if (signature) {
      const hmac = createHmac('sha256', secret);
      const digest = 'sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex');
      if (signature !== digest) {
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }
  }

  const event = req.headers['x-github-event'];
  const payload = req.body;

  // Handle different event types
  switch (event) {
    case 'push': {
      const repoFullName = payload.repository?.full_name;
      if (!repoFullName) break;

      const skillId = repoFullName.toLowerCase();
      const skill = db.prepare('SELECT * FROM skills WHERE id = ?').get(skillId);
      if (!skill) break;

      // Check if this repo is watched
      const watched = db.prepare('SELECT * FROM watched_skills WHERE skill_id = ?').get(skillId);
      if (!watched) break;

      const commit = payload.head_commit;
      if (!commit) break;

      // Record update
      const title = `New push: ${commit.message.split('\n')[0].slice(0, 100)}`;
      db.prepare(`
        INSERT INTO updates (skill_id, type, title, description, created_at)
        VALUES (?, 'commit', ?, ?, ?)
      `).run(skillId, title, commit.message.slice(0, 500), commit.timestamp);

      // Update watched skill version
      db.prepare('UPDATE watched_skills SET last_version = ?, last_notified_at = datetime(\'now\') WHERE skill_id = ?')
        .run(commit.id, skillId);

      // Update skill record
      db.prepare(`
        UPDATE skills SET last_commit_sha = ?, last_commit_message = ?, last_committed_at = ?
        WHERE id = ?
      `).run(commit.id, commit.message.slice(0, 200), commit.timestamp, skillId);

      console.log(`  Webhook: push to ${repoFullName}`);
      break;
    }

    case 'release': {
      const repoFullName = payload.repository?.full_name;
      if (!repoFullName) break;

      const skillId = repoFullName.toLowerCase();
      const watched = db.prepare('SELECT * FROM watched_skills WHERE skill_id = ?').get(skillId);
      if (watched) {
        const release = payload.release;
        db.prepare(`
          INSERT INTO updates (skill_id, type, title, description, created_at)
          VALUES (?, 'version', ?, ?, ?)
        `).run(skillId, `Release: ${release.tag_name}`, release.body?.slice(0, 500) || '', release.published_at);
      }
      break;
    }

    case 'ping':
      res.json({ message: 'pong' });
      return;
  }

  res.json({ message: 'Webhook received' });
});

export default router;
