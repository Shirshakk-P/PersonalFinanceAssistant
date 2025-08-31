import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: BASE_URL + '/api',
  timeout: 15000
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function createTransaction(payload) {
  const { data } = await api.post('/transactions', payload);
  return data;
}

export async function listTransactions(params = {}) {
  const { data } = await api.get('/transactions', { params });
  return data;
}

export async function summaryByCategory(params = {}) {
  const { data } = await api.get('/transactions/summary/by-category', { params });
  return data;
}

export async function summaryByDate(params = {}) {
  const { data } = await api.get('/transactions/summary/by-date', { params });
  return data;
}

export async function uploadReceipt(file) {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post('/ocr/receipt', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
}