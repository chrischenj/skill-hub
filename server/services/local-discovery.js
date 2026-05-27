// Local Skill Discovery
// Scans ~/.claude/skills/*/SKILL.md and imports into web app database
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { getDb } from '../db.js';

const SKILLS_DIR = join(process.env.HOME || process.env.USERPROFILE, '.claude', 'skills');

export function discoverLocalSkills() {
  const db = getDb();
  const insert = db.prepare(`
    INSERT OR REPLACE INTO skills (id, full_name, name, description, category, stars, repo_url, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let count = 0;
  let errors = [];

  try {
    const entries = readdirSync(SKILLS_DIR, { withFileTypes: true });
    for (const entry of entries) {
      // Handle symlinks and directories
      let isDir;
      try {
        const fullPath = join(SKILLS_DIR, entry.name);
        isDir = entry.isDirectory() || entry.isSymbolicLink() && statSync(fullPath).isDirectory();
      } catch {
        continue;
      }
      if (!isDir) continue;
      const skillDir = join(SKILLS_DIR, entry.name);
      const skillFile = join(skillDir, 'SKILL.md');
      try {
        statSync(skillFile);
      } catch {
        continue;
      }

      count++;
      try {
        const content = readFileSync(skillFile, 'utf-8');

        const nameMatch = content.match(/^name:\s*(.+)$/m);
        const descMatch = content.match(/^description:\s*(.+)$/m);
        const verMatch = content.match(/^version:\s*(.+)$/m);

        const name = nameMatch?.[1]?.trim() || entry.name;
        const description = descMatch?.[1]?.trim()?.replace(/^['"]|['"]$/g, '') || '';
        const version = verMatch?.[1]?.trim() || '';

        const repoMatch = content.match(/github\.com\/([\w.-]+\/[\w.-]+)/i);
        const fullName = repoMatch ? repoMatch[1].toLowerCase() : 'local/' + entry.name;
        const repoUrl = repoMatch ? 'https://github.com/' + repoMatch[1] : '';

        const id = fullName.toLowerCase();
        const category = inferCategoryFromName(entry.name);
        const metadata = JSON.stringify({
          local: true,
          version,
          skillDir: entry.name,
          source: 'local',
        });

        insert.run(id, fullName, entry.name, description.slice(0, 500), category, 0, repoUrl, metadata);
      } catch (e) {
        errors.push(entry.name + ': ' + e.message);
      }
    }
  } catch (e) {
    console.error('Error reading skills directory:', e.message);
  }

  return { total: count, imported: count - errors.length, errors };
}

function inferCategoryFromName(name) {
  const nameLower = name.toLowerCase().replace('lark-', '');
  const categories = [
    'approval', 'attendance', 'base', 'calendar', 'contact',
    'doc', 'drive', 'event', 'im', 'mail', 'markdown', 'minutes',
    'okr', 'sheets', 'slides', 'skill-maker', 'task', 'vc', 'vc-agent',
    'whiteboard', 'wiki',
  ];
  for (const cat of categories) {
    if (nameLower.includes(cat)) return cat;
  }
  return 'uncategorized';
}

// Run directly
if (process.argv[1] && process.argv[1].endsWith('local-discovery.js')) {
  console.log('Discovering local skills...');
  const result = discoverLocalSkills();
  console.log('  Found: ' + result.total + ' skills');
  console.log('  Imported: ' + result.imported);
  if (result.errors.length > 0) {
    console.log('  Errors: ' + result.errors.length);
    result.errors.forEach(function(e) { console.log('    - ' + e); });
  }
  console.log('Done!');
}
