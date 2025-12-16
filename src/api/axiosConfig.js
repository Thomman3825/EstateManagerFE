import axios from 'axios';

const api = axios.create({
    baseURL: process.env.REACT_APP_BASE_URL, // Matches your Backend Port
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers['x-auth-token'] = token;
    }
    return config;
});

export default api;