import axios from 'axios';
import { toast } from 'react-toastify';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api',
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.message || 'An unexpected error occurred';
    if (error.config && !error.config.__isRetryRequest && error.response?.status === 401) {
      toast.error('Your session has expired. Please log in again.');
    } else if (error.response?.status >= 400) {
      toast.error(message);
    }
    return Promise.reject(error);
  },
);

export default api;
