import axios from "axios";
import { clearToken, clearUser, loadToken } from "../utils/storage";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    timeout: 15000,
    headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
    const token = loadToken();

    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;

        if (status === 401) {
            clearToken();
            clearUser();

            const onLoginPage = window.location.pathname === "/login";
            if (!onLoginPage) {
                window.location.replace("/login");
            }
        }

        return Promise.reject(error);
    },
);

export default api;
