import axios from 'axios';

const RAW_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const baseNoTrailing = RAW_BASE.replace(/\/$/, '');
const API_BASE = baseNoTrailing.endsWith('/api') ? baseNoTrailing : `${baseNoTrailing}/api`;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export default api;
