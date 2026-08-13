import axios from 'axios';
import { getApiBaseURL } from './apiBase';

const api = axios.create({
  baseURL: getApiBaseURL(),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kra_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (!(config.data instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
  }
  return config;
});

export default api;
