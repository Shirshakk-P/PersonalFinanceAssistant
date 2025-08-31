import express from 'express';
import { z } from 'zod';
import { run, all, get } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const TransactionSchema = z.object({
  type: z.enum(['income','expense']),
  amount: z.number().nonnegative(),
  category: z.string().min(1),
  date: z.string().refine(v => !Number.isNaN(Date.parse(v)), 'Invalid date'),
  note: z.string().optional().nullable()
});

router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const data = TransactionSchema.parse(req.body);
    const userId = req.user.userId;
    const { lastID } = await run(
      `INSERT INTO transactions (user_id, type, amount, category, date, note) VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, data.type, data.amount, data.category, data.date, data.note ?? null]
    );
    const created = await get(`SELECT * FROM transactions WHERE id = ?`, [lastID]);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const transactions = await all(
    'SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC',
    [userId]
  );
  res.json(transactions);
});

router.get('/summary/by-category', async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const conds = ["type = 'expense'"];
    const params = [];
    if (from) { conds.push('date >= ?'); params.push(from); }
    if (to)   { conds.push('date <= ?'); params.push(to); }
    const where = `WHERE ${conds.join(' AND ')}`;
    const rows = await all(
      `SELECT category, ROUND(SUM(amount), 2) as total
       FROM transactions
       ${where}
       GROUP BY category
       ORDER BY total DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/summary/by-date', async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const conds = [];
    const params = [];
    if (from) { conds.push('date >= ?'); params.push(from); }
    if (to)   { conds.push('date <= ?'); params.push(to); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const rows = await all(
      `SELECT date, 
              SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as expenses,
              SUM(CASE WHEN type='income' THEN amount ELSE 0 END)  as income
       FROM transactions
       ${where}
       GROUP BY date
       ORDER BY date ASC`,
      params
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const row = await get(`SELECT * FROM transactions WHERE id = ?`, [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const data = TransactionSchema.partial().refine(d => Object.keys(d).length > 0, 'No fields provided').parse(req.body);
    const existing = await get(`SELECT * FROM transactions WHERE id = ?`, [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const updated = { ...existing, ...data };
    await run(
      `UPDATE transactions
       SET type=?, amount=?, category=?, date=?, note=?, updated_at=datetime('now')
       WHERE id = ?`,
      [updated.type, updated.amount, updated.category, updated.date, updated.note ?? null, req.params.id]
    );
    const row = await get(`SELECT * FROM transactions WHERE id = ?`, [req.params.id]);
    res.json(row);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { changes } = await run(`DELETE FROM transactions WHERE id = ?`, [req.params.id]);
    if (!changes) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;