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

// Clients
export const getClients = async () => {
  const res = await api.get('/clients');
  return res.data;
};

export const createClient = async (data: any) => {
  const res = await api.post('/clients', data);
  return res.data;
};

export const updateClient = async (id: number, data: any) => {
  const res = await api.put(`/clients/${id}`, data);
  return res.data;
};

export const deleteClient = async (id: number) => {
  const res = await api.delete(`/clients/${id}`);
  return res.data;
};

// Invoices
export const getInvoices = async (params?: any) => {
  const res = await api.get('/invoices', { params });
  return res.data;
};

export const createInvoice = async (data: any) => {
  const res = await api.post('/invoices', data);
  return res.data;
};

export const getInvoice = async (id: number) => {
  const res = await api.get(`/invoices/${id}`);
  return res.data;
};

export const updateInvoice = async (id: number, data: any) => {
  const res = await api.put(`/invoices/${id}`, data);
  return res.data;
};

export const deleteInvoice = async (id: number) => {
  const res = await api.delete(`/invoices/${id}`);
  return res.data;
};

export const getPublicInvoice = async (token: string) => {
  const res = await api.get(`/invoices/public/${token}`);
  return res.data;
};

export const payInvoice = async (token: string) => {
  const res = await api.post(`/invoices/public/${token}/pay`);
  return res.data;
};

export const sendInvoice = async (id: number) => {
  const res = await api.post(`/invoices/${id}/send`);
  return res.data;
};

// Settings
export const getSettings = async () => {
  const res = await api.get('/settings');
  return res.data;
};

export const updateSettings = async (data: any) => {
  const res = await api.put('/settings', data);
  return res.data;
};

// Analytics
export const getDashboardStats = async () => {
  const res = await api.get('/analytics/dashboard');
  return res.data;
};
