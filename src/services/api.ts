import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';

// In dev mode, use relative paths so Vite proxy handles CORS.
// In production (deployed build), use the actual backend URLs directly.
const isDev = import.meta.env.DEV;

const API_BASE_URL = isDev ? '/api/v1' : 'http://10.10.20.24:9002/api/v1';

const BOARD_API_BASE_URL = isDev ? '/board-api/v1' : 'http://10.10.20.24:9003/api/v1';

const UMPIRE_API_BASE_URL = isDev ? '/umpire-api/v1' : 'http://10.10.20.24:9004/api/v1';

const getBoardToken = () => {
  return sessionStorage.getItem('token') || localStorage.getItem('token');
};

const isValidToken = (token: string | null) =>
  token && token !== 'undefined' && token !== 'null';

type BoardApiConfig = AxiosRequestConfig;

const boardApi = {
  get: (url: string, config: BoardApiConfig = {}) => {
    const token = getBoardToken();

    return axios.get(BOARD_API_BASE_URL + url, {
        timeout: 15000,
      ...config,
      headers: {
        ...(config.headers ?? {}),
        Authorization: isValidToken(token)
          ? `Bearer ${token}`
          : undefined,
       },
    });
  },

  post: (url: string, data: any, config: BoardApiConfig = {}) => {
    const token = getBoardToken();

    return axios.post(BOARD_API_BASE_URL + url, data, {
      timeout: 15000,
      ...config,
      headers: {
        ...(config.headers ?? {}),
        Authorization: isValidToken(token)
          ? `Bearer ${token}`
          : undefined,
        'Content-Type': 'application/json',
      },
    });
  },

  put: (url: string, data: any, config: BoardApiConfig = {}) => {
    const token = getBoardToken();

    return axios.put(BOARD_API_BASE_URL + url, data, {
      timeout: 15000,
      ...config,
      headers: {
        ...(config.headers ?? {}),
        Authorization: isValidToken(token)
          ? `Bearer ${token}`
          : undefined,
        'Content-Type': 'application/json',
      },
    });
  },

  delete: (url: string, config: BoardApiConfig = {}) => {
    const token = getBoardToken();

    return axios.delete(BOARD_API_BASE_URL + url, {
      timeout: 15000,
      ...config,
      headers: {
        ...(config.headers ?? {}),
        Authorization: isValidToken(token)
          ? `Bearer ${token}`
          : undefined,
        'Content-Type': 'application/json',
      },
    });
  },
};

const umpireApi = {
  post: (url: string, data: any, config: BoardApiConfig = {}) => {
    const token = getBoardToken();
    return axios.post(UMPIRE_API_BASE_URL + url, data, {
      timeout: 15000,
      ...config,
      headers: {
        ...(config.headers ?? {}),
        Authorization: isValidToken(token) ? `Bearer ${token}` : undefined,
        'Content-Type': 'application/json',
      },
    });
  },
  get: (url: string, config: BoardApiConfig = {}) => {
    const token = getBoardToken();
    return axios.get(UMPIRE_API_BASE_URL + url, {
      timeout: 15000,
      ...config,
      headers: {
        ...(config.headers ?? {}),
        Authorization: isValidToken(token) ? `Bearer ${token}` : undefined,
      },
    });
  },
  put: (url: string, data: any, config: BoardApiConfig = {}) => {
    const token = getBoardToken();
    const { headers: extraHeaders, ...restConfig } = config;
    return axios.put(UMPIRE_API_BASE_URL + url, data, {
      timeout: 15000,
      ...restConfig,
      headers: {
        Authorization: isValidToken(token) ? `Bearer ${token}` : undefined,
        'Content-Type': 'application/json',
        ...(extraHeaders ?? {}),
      },
    });
  },
  delete: (url: string, config: BoardApiConfig = {}) => {
    const token = getBoardToken();
    return axios.delete(UMPIRE_API_BASE_URL + url, {
      timeout: 15000,
      ...config,
      headers: {
        ...(config.headers ?? {}),
        Authorization: isValidToken(token) ? `Bearer ${token}` : undefined,
        'Content-Type': 'application/json',
      },
    });
  },
};

export { boardApi, umpireApi };

const isAuthRequest = (url?: string) => !!url && /\/auth\//.test(url);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 → redirect to login
let isRedirecting = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !isAuthRequest(error.config?.url) && !isRedirecting) {
      isRedirecting = true;
      // Use dynamic import to avoid circular dependency
      import('../store/slices/authStore').then(({ useAuthStore }) => {
        useAuthStore.getState().logout();
        isRedirecting = false;
      });
    }
    return Promise.reject(error);
  }
);

export default api;
