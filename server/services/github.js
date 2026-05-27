import { Octokit } from '@octokit/rest';
import { getDb } from '../db.js';

let octokit = null;

export function getOctokit() {
  if (octokit) return octokit;
  const db = getDb();
  const token = db.prepare("SELECT value FROM settings WHERE key='github_token'").get();
  const auth = token?.value || undefined;
  octokit = new Octokit({
    auth,
    request: { timeout: 30000 },
    retry: { enabled: false },
  });
  return octokit;
}

export async function searchReposByName(query, page = 1, perPage = 30) {
  const client = getOctokit();
  const { data } = await client.search.repos({
    q: query,
    sort: 'stars',
    order: 'desc',
    per_page: perPage,
    page,
  });
  return data;
}

export function clearOctokit() {
  octokit = null;
}

// Search strategies to find skill repos
// Each query targets a different signal
const SEARCH_QUERIES = [
  // High precision: repos using the install command
  { q: '"npx skills install" in:readme', sort: 'stars', label: 'npx-install' },
  // Topic-based: repos tagged with claude-code
  { q: 'topic:claude-code', sort: 'stars', label: 'claude-topic' },
  // Readme mention: repos describing themselves as claude skills
  { q: '"SKILL.md" "claude" in:readme', sort: 'stars', label: 'skill-claude' },
  // Lark skills
  { q: 'lark- claude-skill in:readme', sort: 'stars', label: 'lark-skills' },
  // Broader: any repo mentioning SKILL.md (catches unlabeled skills)
  { q: '"SKILL.md" "skill" in:readme', sort: 'stars', label: 'skill-readme' },
  // Broader: repos with skill-related topics
  { q: 'topic:claude-skill topic:skill', sort: 'stars', label: 'skill-topic' },
];

export async function searchSkillRepos(page = 1, perPage = 50) {
  const client = getOctokit();
  const seen = new Set();
  const allItems = [];

  for (const q of SEARCH_QUERIES) {
    try {
      const { data } = await client.search.repos({
        q: q.q,
        sort: q.sort,
        order: 'desc',
        per_page: Math.min(perPage, 50),
        page,
      });
      for (const item of data.items) {
        if (!seen.has(item.full_name)) {
          seen.add(item.full_name);
          allItems.push(item);
        }
      }
    } catch (e) {
      // skip failed queries
    }
  }

  // Also search code for filename:SKILL.md to find repos a repo search would miss
  if (page === 1) {
    try {
      const { data } = await client.search.code({
        q: 'filename:SKILL.md',
        per_page: 50,
        page: Math.min(page, 10),
      });
      for (const item of data.items) {
        if (!seen.has(item.repository.full_name)) {
          seen.add(item.repository.full_name);
          // code search returns minimal repo info, fetch full details
          try {
            const { data: repo } = await client.repos.get({
              owner: item.repository.owner.login,
              repo: item.repository.name,
            });
            allItems.push(repo);
          } catch {
            // skip if we can't fetch details
          }
        }
      }
    } catch (e) {
      // code search may fail due to rate limits or deprecation
    }
  }

  allItems.sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0));
  return { total_count: allItems.length, items: allItems };
}

export async function verifySkillMd(owner, repo) {
  // Check if repo has a SKILL.md file AND it looks like a Claude Code skill
  // (has YAML frontmatter with name: and description: fields)
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const client = getOctokit();
      const { data } = await client.rest.repos.getContent({ owner, repo, path: 'SKILL.md' });
      if (data.type !== 'file' || !data.content) return false;
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      // Claude Code skills have YAML frontmatter with at least name:
      const hasFrontmatter = /^---\s*\n[\s\S]*?\n---/.test(content);
      const hasName = /^name:\s*.+/m.test(content);
      return hasFrontmatter && hasName;
    } catch (e) {
      if (e.status === 404) return false;
      if (e.status === 403) return null; // rate limited
      // Transient error, retry
    }
  }
  return false;
}

export async function getRepoDetails(owner, repo) {
  const client = getOctokit();
  const { data } = await client.repos.get({ owner, repo });
  return data;
}

export async function getLatestCommit(owner, repo) {
  try {
    const client = getOctokit();
    const { data } = await client.repos.listCommits({ owner, repo, per_page: 1 });
    if (data.length > 0) {
      return {
        sha: data[0].sha,
        message: data[0].commit.message,
        date: data[0].commit.committer.date,
      };
    }
  } catch (e) {
    // skip
  }
  return null;
}

export async function getRepoReleases(owner, repo) {
  try {
    const client = getOctokit();
    const { data } = await client.repos.listReleases({ owner, repo, per_page: 5 });
    return data.map(r => ({
      tag_name: r.tag_name,
      name: r.name,
      body: r.body,
      published_at: r.published_at,
    }));
  } catch (e) {
    return [];
  }
}

export function isAuthenticated() {
  const db = getDb();
  const token = db.prepare("SELECT value FROM settings WHERE key='github_token'").get();
  return !!token?.value;
}
