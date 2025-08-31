import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

let db;

export function getDb() {
  if (!db) throw new Error('DB not initialized');
  return db;
}

export async function initDb() {
  if (db) return db;
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const dbPath = path.resolve(__dirname, '../data/pfa.db');

  sqlite3.verbose();
  db = new sqlite3.Database(dbPath);

  await run(`PRAGMA foreign_keys = ON;`);

  await run(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    category TEXT,
    date TEXT,
    note TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );`);

  await run(`CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);`);
  await run(`CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);`);
  await run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );`);

  return db;
}

export function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ changes: this.changes, lastID: this.lastID });
    });
  });
}

export function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().all(sql, params, function (err, rows) {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

export function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().get(sql, params, function (err, row) {
      if (err) reject(err);
      else resolve(row);
    });
  });
}