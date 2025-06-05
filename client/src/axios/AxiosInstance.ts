import axios from 'axios';
import { ENDPOINT } from './Endpoint';

const api = axios.create({
    baseURL: ENDPOINT,
    // Optional defaults:
    // headers: { 'Authorization': 'Bearer token' },
    // timeout: 5000,
});

export default api;