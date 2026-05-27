import { getDb } from '../db.js';
import { getLatestCommit, getRepoReleases } from './github.js';

export async function checkForUpdates() {
  const db = getDb();
  const watched = db.prepare(`
    SELECT w.*, s.full_name, s.name as skill_name, s.last_commit_sha, s.last_committed_at
    FROM watched_skills w
    JOIN skills s ON s.id = w.skill_id
  `).all();

  const updates = [];
  for (const w of watched) {
    const [owner, repo] = w.full_name.split('/');
    if (!owner || !repo) continue;

    try {
      const commit = await getLatestCommit(owner, repo);
      if (commit && commit.sha !== w.last_version && w.last_version) {
        // New commit detected
        const title = `New update: ${w.skill_name}`;
        const desc = commit.message.slice(0, 300);

        db.prepare(`
          INSERT INTO updates (skill_id, type, title, description, created_at)
          VALUES (?, 'commit', ?, ?, ?)
        `).run(w.skill_id, title, desc, commit.date);

        db.prepare(`
          UPDATE watched_skills SET last_version = ?, last_notified_at = datetime('now')
          WHERE id = ?
        `).run(commit.sha, w.id);

        updates.push({ skill_id: w.skill_id, title, description: desc });
      } else if (commit && !w.last_version) {
        // First time watching, set baseline
        db.prepare('UPDATE watched_skills SET last_version = ? WHERE id = ?')
          .run(commit.sha, w.id);
      }

      // Update skill record
      if (commit) {
        db.prepare(`
          UPDATE skills SET last_commit_sha = ?, last_commit_message = ?, last_committed_at = ?
          WHERE id = ?
        `).run(commit.sha, commit.message.slice(0, 200), commit.date, w.skill_id);
      }

      // Check for new releases
      const releases = await getRepoReleases(owner, repo);
      if (releases.length > 0) {
        // Find releases the user hasn't seen
        const knownReleases = db.prepare(
          "SELECT value FROM settings WHERE key = ?"
        ).get(`releases:${w.skill_id}`);

        const known = knownReleases?.value ? JSON.parse(knownReleases.value) : [];
        for (const rel of releases) {
          if (!known.includes(rel.tag_name)) {
            db.prepare(`
              INSERT INTO updates (skill_id, type, title, description, created_at)
              VALUES (?, 'version', ?, ?, ?)
            `).run(w.skill_id, `Release: ${rel.tag_name}`, rel.body?.slice(0, 500) || '', rel.published_at);
          }
        }
        db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)")
          .run(`releases:${w.skill_id}`, JSON.stringify(releases.map(r => r.tag_name)));
      }
    } catch (e) {
      console.error(`  Error checking ${w.full_name}:`, e.message);
    }
  }

  return updates;
}
