import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000',
});

// Автоматично додаємо токен до кожного запиту, якщо він є
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;