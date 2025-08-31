import express from 'express';
import authRouter from './routes/auth.js';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import transactionsRouter from './routes/transactions.js';
import ocrRouter from './routes/ocr.js';
import { initDb } from './db.js';
import errorHandler from './middleware/error.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(morgan('dev'));
app.use('/api/auth', authRouter);

await initDb();

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/transactions', transactionsRouter);
app.use('/api/ocr', ocrRouter);

// Serve frontend if built (optional)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDir = path.resolve(__dirname, '../../frontend/dist');
app.use(express.static(clientDir));
app.get('*', (req, res, next) => {
  // Only try to serve index.html if it exists
  res.sendFile(path.join(clientDir, 'index.html'), (err) => {
    if (err) next();
  });
});

// Error handler (keep last)
app.use(errorHandler);

export default app;