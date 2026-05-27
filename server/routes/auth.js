import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const SALT_ROUNDS = 10;

function generateToken(user, secret) {
  return jwt.sign(
    { sub: user.id, email: user.email },
    secret,
    { expiresIn: '7d' },
  );
}

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    name: user.name,
    avatar_url: user.avatar_url,
    created_at: user.created_at,
  };
}

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { email, phone, password, name } = req.body;

  if (!email && !phone) {
    return res.status(400).json({ error: 'Email or phone number is required' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  const db = getDb();

  if (email) {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(409).json({ error: 'Email already registered' });
  }
  if (phone) {
    const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
    if (existing) return res.status(409).json({ error: 'Phone already registered' });
  }

  const hash = bcrypt.hashSync(password, SALT_ROUNDS);
  const displayName = name || (email ? email.split('@')[0] : 'User');

  const result = db.prepare(
    'INSERT INTO users (email, phone, password_hash, name) VALUES (?, ?, ?, ?)',
  ).run(email || null, phone || null, hash, displayName);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  const secret = db.prepare("SELECT value FROM settings WHERE key = 'jwt_secret'").pluck().get();
  const token = generateToken(user, secret);

  res.status(201).json({ token, user: sanitizeUser(user) });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, phone, password } = req.body;

  if (!email && !phone) {
    return res.status(400).json({ error: 'Email or phone number is required' });
  }
  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  const db = getDb();
  let user;
  if (email) {
    user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  } else {
    user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
  }

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (!bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const secret = db.prepare("SELECT value FROM settings WHERE key = 'jwt_secret'").pluck().get();
  const token = generateToken(user, secret);

  db.prepare("UPDATE users SET updated_at = datetime('now') WHERE id = ?").run(user.id);

  res.json({ token, user: sanitizeUser(user) });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// PUT /api/auth/me
router.put('/me', requireAuth, (req, res) => {
  const { name, avatar_url } = req.body;
  const db = getDb();
  const updates = [];
  const params = [];

  if (name !== undefined) { updates.push('name = ?'); params.push(name); }
  if (avatar_url !== undefined) { updates.push('avatar_url = ?'); params.push(avatar_url); }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  updates.push("updated_at = datetime('now')");
  params.push(req.user.id);

  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  const user = db.prepare(
    'SELECT id, email, phone, name, avatar_url, created_at FROM users WHERE id = ?'
  ).get(req.user.id);

  res.json({ user });
});

export default router;
