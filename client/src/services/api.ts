import axios from 'axios';

// Used for production builds when VITE_API_URL is not set at build time.
const DEPLOYED_API = 'https://tripsync-backend-true.onrender.com/api';

const resolveBaseUrl = (): string => {
  const configured = import.meta.env.VITE_API_URL as string | undefined;
  const raw = configured || (import.meta.env.DEV ? 'http://localhost:3001/api' : DEPLOYED_API);
  const trimmed = raw.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

export const STORAGE_KEY = 'tripsync-user';
export const UNAUTHORIZED_EVENT = 'tripsync:unauthorized';

const api = axios.create({
  baseURL: resolveBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
});

const readToken = (): string | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored).token ?? null) : null;
  } catch {
    return null;
  }
};

api.interceptors.request.use((config) => {
  const token = readToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// An expired or revoked token comes back as 401 on a request that carried it.
// A wrong password on /auth/login is also a 401, but that request had no token.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.config?.headers?.Authorization) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    return Promise.reject(error);
  },
);

/** Pulls the server's message out of an axios error, with a fallback. */
export const errorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    if (error.response?.data?.message) return error.response.data.message;
    if (!error.response) return 'Cannot reach the server. Check your connection and try again.';
  }
  return fallback;
};

export default api;
