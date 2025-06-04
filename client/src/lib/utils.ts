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
