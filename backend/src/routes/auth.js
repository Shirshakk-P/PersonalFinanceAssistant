import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { run, get } from '../db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password required' });
  const hash = await bcrypt.hash(password, 10);
  try {
    await run('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)', [name, email, hash]);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: 'Email already exists' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await get('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ userId: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '1d' });
  res.json({ token, name: user.name });
});

export default router;