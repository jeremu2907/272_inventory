import axios from 'axios';

const api = axios.create({
    baseURL: 'http://172.20.10.14:8000/',
    // Optional defaults:
    // headers: { 'Authorization': 'Bearer token' },
    // timeout: 5000,
});

export default api;