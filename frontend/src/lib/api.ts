import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const register = async (email: string, password: string) => {
  const res = await api.post('/auth/register', { email, password });
  localStorage.setItem('token', res.data.access_token);
  return res.data;
};

export const login = async (email: string, password: string) => {
  const res = await api.post('/auth/login', { email, password });
  localStorage.setItem('token', res.data.access_token);
  return res.data;
};

export const logout = () => {
  localStorage.removeItem('token');
};

export const getMe = async () => {
  const res = await api.get('/auth/me');
  return res.data;
};
