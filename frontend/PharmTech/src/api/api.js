import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Don't redirect if it's the login attempt failing
      if (!error.config.url.includes('/auth/login')) {
        console.warn("Session expired. Redirecting to login...");
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
};

export const medicineAPI = {
  getAll: () => api.get('/medicines'),
  create: (data) => api.post('/medicines', data),
  update: (id, data) => api.put(`/medicines/${id}`, data),
  delete: (id) => api.delete(`/medicines/${id}`),
};

export const billingAPI = {
  create: (data) => api.post('/bills', data),
  getAll: () => api.get('/bills'),
};

export const ocrAPI = {
  extract: (formData) => api.post('/ocr/extract', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
};

export const userAPI = {
  getAll: () => api.get('/users'),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.post('/settings', data),
};

export default api;
