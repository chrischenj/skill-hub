import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, 'skill-hub.db');

let db;

export function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
    seedDefaults();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS skills (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      category TEXT DEFAULT 'uncategorized',
      stars INTEGER DEFAULT 0,
      language TEXT DEFAULT '',
      license TEXT DEFAULT '',
      repo_url TEXT DEFAULT '',
      last_commit_sha TEXT DEFAULT '',
      last_commit_message TEXT DEFAULT '',
      last_committed_at TEXT DEFAULT '',
      last_checked_at TEXT DEFAULT '',
      metadata TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS watched_skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      skill_id TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
      watched_at TEXT DEFAULT (datetime('now')),
      last_version TEXT DEFAULT '',
      last_notified_at TEXT DEFAULT '',
      UNIQUE(skill_id)
    );

    CREATE TABLE IF NOT EXISTS updates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      skill_id TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
      type TEXT NOT NULL DEFAULT 'commit',
      title TEXT DEFAULT '',
      description TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      read INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      phone TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT DEFAULT '',
      avatar_url TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT DEFAULT ''
    );

    CREATE INDEX IF NOT EXISTS idx_skills_stars ON skills(stars DESC);
    CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
    CREATE INDEX IF NOT EXISTS idx_skills_name ON skills(name);
    CREATE INDEX IF NOT EXISTS idx_updates_skill_id ON updates(skill_id);
    CREATE INDEX IF NOT EXISTS idx_updates_read ON updates(read);
  `);
}

function seedDefaults() {
  const insertSetting = db.prepare(
    'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)'
  );
  insertSetting.run('github_token', '');
  insertSetting.run('webhook_secret', generateSecret());
  insertSetting.run('jwt_secret', generateSecret() + generateSecret());
  insertSetting.run('scan_interval', '60');
  insertSetting.run('last_scan_at', '');
}

function generateSecret() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
