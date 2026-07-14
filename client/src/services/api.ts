
import axios from 'axios';

let API_URL = import.meta.env.VITE_API_URL || 'https://tripsync-backend-true.onrender.com/api';
// Automatically append /api if the user forgot it in their environment variables
if (API_URL && !API_URL.endsWith('/api')) {
    API_URL = `${API_URL.replace(/\/$/, '')}/api`;
}

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the auth token in headers
api.interceptors.request.use(
    (config) => {
        const user = localStorage.getItem('tripsync-user');
        if (user) {
            const { token } = JSON.parse(user);
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
