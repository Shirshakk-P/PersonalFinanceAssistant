import React, { useState } from 'react';
import { api } from '../api';

export function LoginForm({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      onLogin(data.token);
    } catch (err) {
      setError(err?.response?.data?.error || 'Login failed');
    }
  };
  return (
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>
      <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
      <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
      <button type="submit">Login</button>
      {error && <div style={{color:'red'}}>{error}</div>}
    </form>
  );
}

export function SignupForm({ onSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/register', { name, email, password });
      // Auto-login after signup
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      onSignup(data.token);
    } catch (err) {
      setError(err?.response?.data?.error || 'Signup failed');
    }
  };
  return (
    <form onSubmit={handleSubmit}>
      <h2>Sign Up</h2>
      <input type="text" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} required />
      <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
      <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
      <button type="submit">Sign Up</button>
      {error && <div style={{color:'red'}}>{error}</div>}
    </form>
  );
}