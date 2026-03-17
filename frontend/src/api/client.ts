import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api';

const client = axios.create({
  baseURL: API_BASE_URL,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const tenantId = localStorage.getItem('tenantId') || 'default'; // Multi-tenant ready
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['X-Tenant-ID'] = tenantId;
  
  return config;
});

export default client;
