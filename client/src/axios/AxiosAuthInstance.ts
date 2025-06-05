import axios from 'axios';
import { ENDPOINT } from './Endpoint';
import { accessTokenGet } from '@/lib/utils';

export function AxiosAuthInstance() {
    return axios.create({
        baseURL: ENDPOINT,
        headers: {
            Authorization: `Bearer ${accessTokenGet()}`,
        },
        // Optional defaults:
        // timeout: 5000,
    });
}