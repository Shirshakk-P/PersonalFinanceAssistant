# PFA - Personal Finance Assistant

Backend: Node + Express + SQLite
Frontend: React + Vite

## Quick start

### Backend
```bash
cd backend
npm install
npm run migrate
npm run dev
```
Starts on http://localhost:3000

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Starts on http://localhost:5173 ```

### Receipt OCR
Upload a POS receipt image (PNG/JPG) or PDF on the "Receipt OCR" card. The server uses Tesseract.js (for images) and pdf-parse (for PDFs). Parsing is currently in naive stage.
```

### API overview
- `POST /api/transactions` create
- `GET /api/transactions?from=YYYY-MM-DD&to=YYYY-MM-DD&type=expense|income&category=Food`
- `GET /api/transactions/:id`
- `PUT /api/transactions/:id`
- `DELETE /api/transactions/:id`
- `GET /api/transactions/summary/by-category?from=&to=`
- `GET /api/transactions/summary/by-date?from=&to=`
- `POST /api/ocr/receipt` (multipart field: `file`)