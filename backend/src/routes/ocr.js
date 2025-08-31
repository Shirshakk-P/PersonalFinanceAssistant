import express from 'express';
import multer from 'multer';
import Tesseract from 'tesseract.js';
import pdf from 'pdf-parse';
import fs from 'fs';
import path from 'path';

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

function parseReceiptText(text) {
  // Log for debugging
  console.log("Extracted text:", text);

  // Try to match amount with keywords
  let amount = null;
  let amountMatch = text.match(/total[:\s]*([\d,]+\.\d{2})/i);
  if (amountMatch) {
    amount = parseFloat(amountMatch[1].replace(/,/g, ""));
  } else {
    // Fallback: find all numbers, pick the largest
    let nums = Array.from(text.matchAll(/([\d,]+\.\d{2})/g)).map((m) =>
      parseFloat(m[1].replace(/,/g, ""))
    );
    if (nums.length) amount = Math.max(...nums);
  }

  // Try to match date
  let date = null;
  let dateMatch = text.match(/date[:\s]*([\d\/\-\.]+)/i);
  if (dateMatch) {
    date = dateMatch[1];
  } else {
    // Fallback: find first date-like string
    let dateFallback = text.match(/(\d{2,4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,4})/);
    if (dateFallback) date = dateFallback[1];
  }

  return { amount, date, raw: text };
}

// function parseReceiptText(text) {
//   // naive parsing: try to find TOTAL/AMOUNT and a date-like string
//   const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

//   let amount = null;
//   let date = null;

//   // Amount candidates with keywords
//   for (const line of lines) {
//     const m = line.match(/(?:total|amount|grand\s*total)\s*[:\-]?\s*\$?\s*([0-9]+(?:\.[0-9]{2})?)/i);
//     if (m) { amount = parseFloat(m[1]); break; }
//   }
//   // Fallback: biggest currency-like number
//   if (amount === null) {
//     let nums = [];
//     for (const line of lines) {
//       const matches = line.match(/\$?\s*([0-9]+(?:\.[0-9]{2})?)/g);
//       if (matches) {
//         for (const frag of matches) {
//           const nm = frag.replace(/[^0-9.]/g, '');
//           if (nm) nums.push(parseFloat(nm));
//         }
//       }
//     }
//     if (nums.length) amount = Math.max(...nums);
//   }

//   // Date candidates (very rough)
//   for (const line of lines) {
//     const m = line.match(/\b(20\d{2}[-\/.](0[1-9]|1[0-2])[-\/.](0[1-9]|[12]\d|3[01]))\b/);
//     if (m) { date = m[1].replace(/\./g,'-'); break; }
//   }
//   if (!date) {
//     for (const line of lines) {
//       const m = line.match(/\b((0[1-9]|1[0-2])[-\/.](0[1-9]|[12]\d|3[01])[-\/.](20\d{2}))\b/);
//       if (m) {
//         const [mm,dd,yyyy] = m[0].replace(/\./g,'-').split(/[-\/]/);
//         date = `${yyyy}-${mm}-${dd}`;
//         break;
//       }
//     }
//   }

//   return { amount, date, raw: text };
// }

async function extractTextFromPdf(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdf(dataBuffer);
  return data.text || '';
}

async function extractTextFromImage(filePath) {
  const result = await Tesseract.recognize(filePath, 'eng');
  return result.data.text || '';
}

router.post('/receipt', upload.single('file'), async (req, res, next) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    let text = '';
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.pdf') text = await extractTextFromPdf(file.path);
    else text = await extractTextFromImage(file.path);

    const parsed = parseReceiptText(text);
    // Cleanup temp file
    fs.unlink(file.path, () => {});

    res.json({
      success: true,
      suggestion: {
        type: 'expense',
        amount: parsed.amount,
        category: 'Uncategorized',
        date: parsed.date,
        note: 'Parsed from receipt'
      },
      rawText: parsed.raw
    });
  } catch (err) {
    next(err);
  }
});

export default router;