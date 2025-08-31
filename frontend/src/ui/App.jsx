import React, { useEffect, useState } from 'react';
import { LoginForm, SignupForm } from './AuthForms';
import { createTransaction, listTransactions, summaryByCategory, summaryByDate, uploadReceipt } from '../api.js';
import { format, parseISO } from 'date-fns';
import chartImg from "../assets/chart.jpg"
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
ChartJS.register(BarElement, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

function Card({ title, children }) {
  return (
    <div style={{ border:'1px solid #e5e7eb', borderRadius:16, padding:16, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', background:'#fff' }}>
      <h3 style={{ marginTop:0 }}>{title}</h3>
      {children}
    </div>
  )
}

function Input({ label, ...props }) {
  return (
    <label style={{ display:'grid', gap:8 }}>
      <span style={{ fontSize:12, color:'#374151' }}>{label}</span>
      <input {...props} style={{ padding:10, border:'1px solid #d1d5db', borderRadius:8 }} />
    </label>
  )
}

function Select({ label, children, ...props }) {
  return (
    <label style={{ display:'grid', gap:8 }}>
      <span style={{ fontSize:12, color:'#374151' }}>{label}</span>
      <select {...props} style={{ padding:10, border:'1px solid #d1d5db', borderRadius:8 }}>
        {children}
      </select>
    </label>
  )
}

// Define a color palette for categories
const PIE_COLORS = [
  '#FF6384', // red
  '#36A2EB', // blue
  '#FFCE56', // yellow
  '#43cea2', // green
  '#f09819', // orange
  '#7b3f00', // brown
  '#8e44ad', // purple
  '#e67e22', // orange-dark
  '#2ecc71', // green-dark
  '#34495e', // blue-grey
];

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [form, setForm] = useState({ type:'expense', amount:'', category:'Food', date: new Date().toISOString().slice(0,10), note:'' });
  const [range, setRange] = useState({ from:'', to:'' });
  const [items, setItems] = useState([]);
  const [catSummary, setCatSummary] = useState([]);
  const [dateSummary, setDateSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ocrSuggestion, setOcrSuggestion] = useState(null);
  const [error, setError] = useState('');

  const refresh = async () => {
    setLoading(true);
    try {
      const [list, cats, dates] = await Promise.all([
        listTransactions({ ...range }),
        summaryByCategory({ ...range }),
        summaryByDate({ ...range }),
      ]);
      setItems(list);
      setCatSummary(cats);
      setDateSummary(dates);
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    } finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        type: form.type,
        amount: parseFloat(form.amount),
        category: form.category,
        date: form.date,
        note: form.note || undefined,
      };
      await createTransaction(payload);
      setForm(s => ({ ...s, amount:'', note:'' }));
      await refresh();
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    }
  };

  const onFilter = async (e) => {
    e.preventDefault();
    await refresh();
  };

  const onReceipt = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      const data = await uploadReceipt(file);
      setOcrSuggestion(data.suggestion);
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    }
  };

  const addFromSuggestion = async () => {
    if (!ocrSuggestion) return;
    try {
      const s = ocrSuggestion;
      await createTransaction({
        type: s.type,
        amount: s.amount || 0,
        category: s.category || 'Uncategorized',
        date: s.date || new Date().toISOString().slice(0,10),
        note: s.note || 'From OCR'
      });
      setOcrSuggestion(null);
      await refresh();
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    }
  };

  const expensesByCat = {
    labels: catSummary.map(c => c.category),
    datasets: [{
      label: 'Expenses by Category',
      data: catSummary.map(c => c.total),
      backgroundColor: catSummary.map((_, i) => PIE_COLORS[i % PIE_COLORS.length]), // <-- add this line
    }]
  };

  const flowByDate = {
    labels: dateSummary.map(r => r.date),
    datasets: [
      {
        label: 'Expenses',
        data: dateSummary.map(r => r.expenses),
        borderColor: '#FF6384',      // red line
        backgroundColor: 'rgba(255,99,132,0.2)', 
        tension: 0.3,
        fill: true,
      },
      {
        label: 'Income',
        data: dateSummary.map(r => r.income),
        borderColor: '#36A2EB',      // blue line
        backgroundColor: 'rgba(54,162,235,0.2)', 
        tension: 0.3,
        fill: true,
      }
    ]
  };

  if (!token) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #ff512f 0%, #f09819 50%, #7b3f00 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
        }}
      >
        <div style={{textAlign: 'center', marginBottom: 32}}>
          <h1 style={{color: '#fff', fontWeight: 700, fontSize: 40, marginBottom: 8, textShadow: '0 2px 8px #0004'}}>Personal Finance Assistant</h1>
          <p style={{color: '#fff', fontSize: 18, marginBottom: 24, textShadow: '0 1px 4px #0002'}}>
            Track your expenses, upload receipts, and visualize your financial health.
          </p>
          <div style={{display: 'flex', justifyContent: 'center', marginBottom: 24}}>
            <img
              src={chartImg}
              alt="Chart"
              style={{width: 180, height: 120, borderRadius: 16, boxShadow: '0 2px 8px #0002', objectFit: 'cover'}}
            />
          </div>
          <div style={{display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 24}}>
            <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="Money" style={{width: 64, height: 64, borderRadius: 16, boxShadow: '0 2px 8px #0002'}} />
            <img src="https://cdn-icons-png.flaticon.com/512/1828/1828919.png" alt="Dashboard" style={{width: 64, height: 64, borderRadius: 16, boxShadow: '0 2px 8px #0002'}} />
            <img src="https://cdn-icons-png.flaticon.com/512/1828/1828884.png" alt="Graphs" style={{width: 64, height: 64, borderRadius: 16, boxShadow: '0 2px 8px #0002'}} />
          </div>
        </div>
        <div style={{display: 'flex', gap: 32}}>
          <LoginForm onLogin={setToken} />
          <SignupForm onSignup={setToken} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:'100vh', background:'#f3f4f6' }}>
      <div style={{ maxWidth:1100, margin:'0 auto', padding:24, display:'grid', gap:16 }}>
        <h1 style={{ margin:0 }}>💸 PFA — Personal Finance Assistant</h1>
        {error && <div style={{ padding:12, background:'#fee2e2', border:'1px solid #fecaca', borderRadius:8 }}>{error}</div>}

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <Card title="Add Transaction">
            <form onSubmit={onSubmit} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Select label="Type" value={form.type} onChange={e => setForm(s => ({...s, type:e.target.value}))}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </Select>
              <Input label="Amount" type="number" step="0.01" min="0" required value={form.amount} onChange={e => setForm(s => ({...s, amount:e.target.value}))} />
              <Input label="Category" value={form.category} onChange={e => setForm(s => ({...s, category:e.target.value}))} />
              <Input label="Date" type="date" value={form.date} onChange={e => setForm(s => ({...s, date:e.target.value}))} />
              <label style={{ gridColumn:'1/-1', display:'grid', gap:8 }}>
                <span style={{ fontSize:12, color:'#374151' }}>Note</span>
                <textarea value={form.note} onChange={e => setForm(s => ({...s, note:e.target.value}))} style={{ padding:10, border:'1px solid #d1d5db', borderRadius:8 }} rows={2} />
              </label>
              <div style={{ gridColumn:'1/-1' }}>
                <button type="submit" style={{ padding:'10px 14px', border:'1px solid #10b981', background:'#10b981', color:'#fff', borderRadius:8 }}>Save</button>
              </div>
            </form>
          </Card>

          <Card title="Filters">
            <form onSubmit={onFilter} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Input label="From" type="date" value={range.from} onChange={e => setRange(s => ({...s, from:e.target.value}))} />
              <Input label="To" type="date" value={range.to} onChange={e => setRange(s => ({...s, to:e.target.value}))} />
              <div style={{ gridColumn:'1/-1' }}>
                <button type="submit" style={{ padding:'10px 14px', border:'1px solid #2563eb', background:'#2563eb', color:'#fff', borderRadius:8 }}>Apply</button>
              </div>
            </form>
            <div style={{ marginTop:12, fontSize:12, color:'#6b7280' }}>
              Tip: Leave empty to see all.
            </div>
          </Card>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16 }}>
          <Card title={loading ? 'Transactions (loading...)' : `Transactions (${items.length})`}>
            <div style={{ maxHeight:320, overflow:'auto' }}>
              <table width="100%" cellPadding="8" style={{ borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'#f9fafb' }}>
                    <th align="left">Date</th>
                    <th align="left">Type</th>
                    <th align="right">Amount</th>
                    <th align="left">Category</th>
                    <th align="left">Note</th>
                  </tr>
                </thead>
                <tbody>
                {items.map(it => (
                  <tr key={it.id} style={{ borderTop:'1px solid #eee' }}>
                    <td>{format(parseISO(it.date), 'yyyy-MM-dd')}</td>
                    <td>{it.type}</td>
                    <td align="right">{it.amount.toFixed(2)}</td>
                    <td>{it.category}</td>
                    <td>{it.note || ''}</td>
                  </tr>
                ))}
                {!items.length && <tr><td colSpan="5" style={{ color:'#6b7280' }}>No transactions</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Receipt OCR">
            <input type="file" accept="image/*,.pdf" onChange={onReceipt} />
            {ocrSuggestion && (
              <div style={{ marginTop:12, padding:12, background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:8 }}>
                <div style={{ fontSize:14, marginBottom:8 }}>Suggestion:</div>
                <pre style={{ margin:0, whiteSpace:'pre-wrap' }}>{JSON.stringify(ocrSuggestion, null, 2)}</pre>
                <button onClick={addFromSuggestion} style={{ marginTop:8, padding:'8px 12px', border:'1px solid #111827', borderRadius:8 }}>Add as Expense</button>
              </div>
            )}
          </Card>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <Card title="Expenses by Category">
            <Pie data={expensesByCat} />
          </Card>
          <Card title="Income vs Expenses by Date">
            <Line data={flowByDate} />
          </Card>
        </div>

        <button
          style={{
            position: 'absolute',
            top: 24,
            right: 24,
            padding: '8px 20px',
            background: '#c0392b',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 8px #0002'
          }}
          onClick={() => {
            localStorage.removeItem('token');
            setToken(null);
          }}
        >
          Logout
        </button>

        <footer style={{ color:'#6b7280', fontSize:12, padding:'8px 0' }}>
          Backend at <code>http://localhost:3000</code>. Change via <code>VITE_API_URL</code> env var.
        </footer>
      </div>
    </div>
  );
}