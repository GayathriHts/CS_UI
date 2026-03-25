import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';

const API_BASE_URL = '/api/v1'; 

const BOARD_API_BASE_URL = '/board-api/v1';

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
      ...config,
      headers: {
        ...(config.headers ?? {}),
        Authorization: isValidToken(token)
          ? `Bearer ${token}`
          : undefined,
       
      },
    });
  },

  put: (url: string, data: any, config: BoardApiConfig = {}) => {
    const token = getBoardToken();

    return axios.put(BOARD_API_BASE_URL + url, data, {
      ...config,
      headers: {
        ...(config.headers ?? {}),
        Authorization: isValidToken(token)
          ? `Bearer ${token}`
          : undefined,
        
      },
    });
  },

  delete: (url: string, config: BoardApiConfig = {}) => {
    const token = getBoardToken();

    return axios.delete(BOARD_API_BASE_URL + url, {
      ...config,
      headers: {
        ...(config.headers ?? {}),
        Authorization: isValidToken(token)
          ? `Bearer ${token}`
          : undefined,
      },
    });
  },
};

export { boardApi };

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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !isAuthRequest(error.config?.url)) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
