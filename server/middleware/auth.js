import jwt from 'jsonwebtoken';
import { getDb } from '../db.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = header.slice(7);
  const db = getDb();
  const secret = db.prepare("SELECT value FROM settings WHERE key = 'jwt_secret'").pluck().get();

  if (!secret) {
    return res.status(500).json({ error: 'JWT not configured' });
  }

  try {
    const payload = jwt.verify(token, secret);
    const user = db.prepare(
      'SELECT id, email, phone, name, avatar_url, created_at FROM users WHERE id = ?'
    ).get(payload.sub);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  const token = header.slice(7);
  const db = getDb();
  const secret = db.prepare("SELECT value FROM settings WHERE key = 'jwt_secret'").pluck().get();
  if (!secret) { req.user = null; return next(); }
  try {
    const payload = jwt.verify(token, secret);
    const user = db.prepare(
      'SELECT id, email, phone, name, avatar_url, created_at FROM users WHERE id = ?'
    ).get(payload.sub);
    req.user = user || null;
  } catch {
    req.user = null;
  }
  next();
}
