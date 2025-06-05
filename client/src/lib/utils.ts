import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export const pltSuffix = (plt: any) => {
    if (Number.isNaN(Number(plt))) return '';

    if (plt?.at(plt.length - 1) === '1') return 'st PLT';
    if (plt?.at(plt.length - 1) === '2') return 'nd PLT';
    if (plt?.at(plt.length - 1) === '3') return 'rd PLT';
    return 'th PLT';
}

export function localSet(key: string, value: any) {
    if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(value));
    }
}
export function localGet(key: string) {
    if (typeof window !== 'undefined') {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
    }
    return null;
}
export function localRemove(key: string) {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
    }
}
export function accessTokenSet(token: string) {
    localSet('access', token);
}
export function accessTokenGet() {
    return localGet('access');
}
export function accessTokenRemove() {
    localRemove('access');
}
export function refreshTokenSet(token: string) {
    localSet('refresh', token);
}
export function refreshTokenGet() {
    return localGet('refresh');
}
export function refreshTokenRemove() {
    localRemove('refresh');
}
