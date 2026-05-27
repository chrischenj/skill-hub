import { getDb } from '../db.js';
import { searchSkillRepos, searchReposByName, verifySkillMd, getLatestCommit, getRepoReleases } from './github.js';

async function asyncPool(concurrency, items, fn) {
  const results = [];
  const executing = new Set();
  for (const [index, item] of items.entries()) {
    const p = Promise.resolve().then(() => fn(item, index));
    results.push(p);
    executing.add(p);
    const clean = () => executing.delete(p);
    p.then(clean, clean);
    if (executing.size >= concurrency) {
      await Promise.race(executing);
    }
  }
  return Promise.allSettled(results);
}

export async function scanGitHub(maxPages = 10) {
  const db = getDb();
  const upsertSkill = db.prepare(`
    INSERT INTO skills (id, full_name, name, description, stars, language, repo_url, last_checked_at, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)
    ON CONFLICT(full_name) DO UPDATE SET
      stars = EXCLUDED.stars,
      language = EXCLUDED.language,
      description = EXCLUDED.description,
      last_checked_at = datetime('now'),
      metadata = EXCLUDED.metadata,
      updated_at = datetime('now')
  `);

  let totalFound = 0;
  let verified = 0;
  let rateLimited = 0;

  for (let page = 1; page <= maxPages; page++) {
    console.log('  Searching page ' + page + '...');
    let items;
    try {
      const data = await searchSkillRepos(page, 50);
      items = data.items;
      if (items.length === 0) break;
    } catch (e) {
      console.log('  Page ' + page + ' failed: ' + e.message);
      break;
    }
    totalFound += items.length;

    // Verify each repo has SKILL.md (max 3 concurrent)
    const results = await asyncPool(3, items, async (repo) => {
      const hasSkill = await verifySkillMd(repo.owner?.login || '', repo.name);
      return { repo, hasSkill };
    });

    for (const result of results) {
      if (result.status !== 'fulfilled') continue;
      const { repo, hasSkill } = result.value;

      if (hasSkill === null) {
        rateLimited++;
        continue;
      }
      if (!hasSkill) continue;

      verified++;
      const category = inferCategory(repo.description || '', repo.topics || []);
      const metadata = JSON.stringify({
        topics: repo.topics || [],
        forks: repo.forks_count,
        open_issues: repo.open_issues_count,
        default_branch: repo.default_branch,
        size: repo.size,
        owner_avatar: repo.owner?.avatar_url,
        verified: true,
      });

      upsertSkill.run(
        repo.full_name.toLowerCase(),
        repo.full_name,
        repo.name,
        (repo.description || '').slice(0, 500),
        repo.stargazers_count || 0,
        repo.language || '',
        repo.html_url,
        metadata,
      );
    }
  }

  // Fetch latest commits for repos that have stars
  const reposWithStars = db.prepare('SELECT full_name FROM skills WHERE stars > 0 AND full_name NOT LIKE \'local/%\'').all();
  const updateCommit = db.prepare(`
    UPDATE skills SET last_commit_sha = ?, last_commit_message = ?, last_committed_at = ? WHERE full_name = ?
  `);

  if (reposWithStars.length > 0) {
    console.log('  Fetching commits for ' + reposWithStars.length + ' repos...');
    await asyncPool(3, reposWithStars, async (repo) => {
      const [owner, name] = repo.full_name.split('/');
      if (!owner || !name) return;
      try {
        const commit = await getLatestCommit(owner, name);
        if (commit) {
          updateCommit.run(commit.sha, commit.message.slice(0, 200), commit.date, repo.full_name);
        }
      } catch (e) {
        // skip
      }
    });
  }

  // Enrich local skills with GitHub data
  await enrichLocalSkills();

  db.prepare("UPDATE settings SET value = datetime('now') WHERE key = 'last_scan_at'").run();

  console.log('  Found ' + totalFound + ' candidate repos');
  console.log('  Verified with SKILL.md: ' + verified);
  if (rateLimited > 0) console.log('  Rate limited: ' + rateLimited);
  return { total: verified, candidates: totalFound, rateLimited };
}

export async function enrichLocalSkills() {
  const db = getDb();
  const localSkills = db.prepare(
    "SELECT * FROM skills WHERE json_extract(metadata, '$.local') = 1 AND repo_url = ''"
  ).all();

  if (localSkills.length === 0) return { enriched: 0 };
  let enriched = 0;

  console.log('  Enriching ' + localSkills.length + ' local skills...');

  await asyncPool(2, localSkills, async (skill) => {
    try {
      const data = await searchReposByName(skill.name + ' lark', 1, 5);
      const match = data.items.find(
        (r) => r.name.toLowerCase() === skill.name.toLowerCase()
          || r.full_name.toLowerCase().includes(skill.name.toLowerCase())
      );

      // Verify the match actually has SKILL.md
      if (match) {
        const hasSkill = await verifySkillMd(match.owner?.login || '', match.name);
        if (!hasSkill) return;
      }

      if (match) {
        const metadata = JSON.parse(skill.metadata || '{}');
        metadata.topics = match.topics || [];
        metadata.forks = match.forks_count;
        metadata.owner_avatar = match.owner?.avatar_url;
        metadata.github_matched = true;

        db.prepare(`
          UPDATE skills SET repo_url = ?, stars = ?, language = ?, description = ?,
            metadata = ?, last_checked_at = datetime('now')
          WHERE id = ?
        `).run(
          match.html_url,
          match.stargazers_count || 0,
          match.language || skill.language,
          (match.description || skill.description || '').slice(0, 500),
          JSON.stringify(metadata),
          skill.id,
        );
        enriched++;
      }
    } catch (e) {
      // skip
    }
  });

  // Second pass: try larksuite org
  const unmatched = db.prepare(
    "SELECT * FROM skills WHERE json_extract(metadata, '$.local') = 1 AND repo_url = '' AND name LIKE 'lark-%'"
  ).all();

  if (unmatched.length > 0) {
    console.log('  Second pass: larksuite org (' + unmatched.length + ' skills)...');
    await asyncPool(1, unmatched, async (skill) => {
      try {
        const repoName = skill.name.replace(/^lark-/, '');
        const data = await searchReposByName('larksuite/' + repoName + ' OR larksuite/lark-' + repoName, 1, 5);
        const match = data.items.find(
          (r) => r.name.toLowerCase() === repoName.toLowerCase()
            || r.name.toLowerCase() === skill.name.toLowerCase()
            || r.full_name.toLowerCase().includes(repoName.toLowerCase())
        );
        if (match) {
          const hasSkill = await verifySkillMd(match.owner?.login || '', match.name);
          if (!hasSkill) return;

          const metadata = JSON.parse(skill.metadata || '{}');
          metadata.topics = match.topics || [];
          metadata.forks = match.forks_count;
          metadata.owner_avatar = match.owner?.avatar_url;
          metadata.github_matched = true;

          db.prepare(`
            UPDATE skills SET repo_url = ?, stars = ?, language = ?, description = ?,
              metadata = ?, last_checked_at = datetime('now')
            WHERE id = ?
          `).run(
            match.html_url,
            match.stargazers_count || 0,
            match.language || skill.language,
            (match.description || skill.description || '').slice(0, 500),
            JSON.stringify(metadata),
            skill.id,
          );
          enriched++;
        }
      } catch (e) {
        // skip
      }
    });
  }

  console.log('  Enriched ' + enriched + ' local skills');
  return { enriched };
}

export async function scanSingleRepo(fullName) {
  const db = getDb();
  const [owner, repo] = fullName.split('/');
  if (!owner || !repo) throw new Error('Invalid repo name');

  const { getRepoDetails } = await import('./github.js');
  const details = await getRepoDetails(owner, repo);
  const commit = await getLatestCommit(owner, repo);
  const releases = await getRepoReleases(owner, repo);

  const category = inferCategory(details.description || '', details.topics || []);
  const metadata = JSON.stringify({
    topics: details.topics || [],
    forks: details.forks_count,
    open_issues: details.open_issues_count,
    default_branch: details.default_branch,
    size: details.size,
    owner_avatar: details.owner?.avatar_url,
  });

  db.prepare(`
    INSERT INTO skills (id, full_name, name, description, category, stars, language, license, repo_url,
      last_commit_sha, last_commit_message, last_committed_at, last_checked_at, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)
    ON CONFLICT(full_name) DO UPDATE SET
      description = EXCLUDED.description, category = EXCLUDED.category,
      stars = EXCLUDED.stars, language = EXCLUDED.language, license = EXCLUDED.license,
      repo_url = EXCLUDED.repo_url,
      last_commit_sha = EXCLUDED.last_commit_sha,
      last_commit_message = EXCLUDED.last_commit_message,
      last_committed_at = EXCLUDED.last_committed_at,
      last_checked_at = datetime('now'),
      metadata = EXCLUDED.metadata, updated_at = datetime('now')
  `).run(
    fullName.toLowerCase(), fullName, repo,
    (details.description || '').slice(0, 500), category,
    details.stargazers_count || 0, details.language || '',
    details.license?.spdx_id || '', details.html_url,
    commit?.sha || '', commit?.message?.slice(0, 200) || '',
    commit?.date || '', metadata,
  );

  return { details, commit, releases };
}

function inferCategory(description, topics) {
  const desc = (description + ' ' + topics.join(' ')).toLowerCase();

  if (desc.includes('approval') || desc.includes('审批')) return 'approval';
  if (desc.includes('attendance') || desc.includes('考勤')) return 'attendance';
  if (desc.includes('base') || desc.includes('bitable') || desc.includes('多维表格')) return 'base';
  if (desc.includes('calendar') || desc.includes('日程')) return 'calendar';
  if (desc.includes('contact') || desc.includes('通讯录')) return 'contact';
  if (desc.includes('doc') || desc.includes('文档') || desc.includes('docs')) return 'doc';
  if (desc.includes('drive') || desc.includes('云空间')) return 'drive';
  if (desc.includes('im') || desc.includes('message') || desc.includes('即时通讯')) return 'im';
  if (desc.includes('mail') || desc.includes('邮箱') || desc.includes('email')) return 'mail';
  if (desc.includes('minutes') || desc.includes('妙记')) return 'minutes';
  if (desc.includes('wiki') || desc.includes('知识库')) return 'wiki';
  if (desc.includes('okr') || desc.includes('objective')) return 'okr';
  if (desc.includes('task') || desc.includes('任务')) return 'task';
  if (desc.includes('vc') || desc.includes('会议') || desc.includes('meeting')) return 'vc';
  if (desc.includes('whiteboard') || desc.includes('画板')) return 'whiteboard';
  if (desc.includes('sheets') || desc.includes('sheet') || desc.includes('电子表格')) return 'sheets';
  if (desc.includes('slides') || desc.includes('slide') || desc.includes('幻灯片')) return 'slides';
  if (desc.includes('markdown')) return 'markdown';
  if (desc.includes('bot') || desc.includes('agent')) return 'agent';

  return 'uncategorized';
}
