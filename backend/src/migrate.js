import { initDb } from './db.js';
await initDb();
console.log('Database ready.');
await run(`ALTER TABLE users ADD COLUMN name TEXT;`);
process.exit(0);