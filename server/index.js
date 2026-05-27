import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cron from 'node-cron';
import { getDb } from './db.js';
import { scanGitHub } from './services/scanner.js';
import { checkForUpdates } from './services/monitor.js';

import skillsRouter from './routes/skills.js';
import watchedRouter from './routes/watched.js';
import trendingRouter from './routes/trending.js';
import webhookRouter from './routes/webhook.js';
import settingsRouter from './routes/settings.js';
import authRouter from './routes/auth.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const CLIENT_DIST = join(__dirname, '..', 'client', 'dist');

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/skills', skillsRouter);
app.use('/api/watched', watchedRouter);
app.use('/api/trending', trendingRouter);
app.use('/api/webhook', webhookRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/auth', authRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// In production, serve built frontend
app.use(express.static(CLIENT_DIST));
app.get('*', (req, res) => {
  res.sendFile(join(CLIENT_DIST, 'index.html'));
});

// Scheduled tasks
// GitHub scan every hour
cron.schedule('0 * * * *', async () => {
  console.log('[Cron] Starting GitHub scan...');
  try {
    const result = await scanGitHub();
    console.log(`[Cron] Scan complete: ${result.total} skills`);
  } catch (e) {
    console.error('[Cron] Scan failed:', e.message);
  }
});

// Check watched repos for updates every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  console.log('[Cron] Checking for updates...');
  try {
    const updates = await checkForUpdates();
    if (updates.length > 0) {
      console.log(`[Cron] ${updates.length} new update(s) detected`);
    }
  } catch (e) {
    console.error('[Cron] Update check failed:', e.message);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n  🚀 Skill Hub server running at http://localhost:${PORT}`);
  console.log(`  📡 Webhook endpoint: http://localhost:${PORT}/api/webhook`);
  console.log(`  📊 API health: http://localhost:${PORT}/api/health\n`);

  // Initialize database
  getDb();
  console.log('  💾 SQLite database initialized');
});
