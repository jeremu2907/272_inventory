function getEndpoint() {
    if (import.meta.env.VITE_LOCAL === undefined || import.meta.env.VITE_LOCAL === 'false')
        return "https://two72-inventory.onrender.com/";
    else {
        return (import.meta.env.VITE_LOCAL_ENDPOINT ?? "http://127.0.0.1:8000/")
    }
}

export const ENDPOINT = getEndpoint();