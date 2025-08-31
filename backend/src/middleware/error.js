export default function errorHandler(err, req, res, next) {
  // zod validation
  if (err?.name === 'ZodError') {
    return res.status(400).json({ error: 'Validation failed', details: err.errors });
  }
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
}