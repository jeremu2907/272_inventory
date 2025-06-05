import axios from 'axios';
import { ENDPOINT } from './Endpoint';

export function AxiosAuthInstance(authToken: string) {
    return axios.create({
        baseURL: ENDPOINT,
        headers: {
            Authorization: `Bearer ${authToken}`,
        },
        // Optional defaults:
        // timeout: 5000,
    });
}