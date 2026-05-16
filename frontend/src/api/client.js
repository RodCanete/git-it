import axios from 'axios';
import useAuthStore from '../store/authStore';

const client = axios.create({
  baseURL: 'http://localhost:8000/api',
});

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = useAuthStore.getState().refreshToken;
      if (refresh) {
        try {
          const { data } = await axios.post('http://localhost:8000/api/auth/token/refresh/', { refresh });
          useAuthStore.getState().setTokens(data.access, refresh);
          original.headers.Authorization = `Bearer ${data.access}`;
          return client(original);
        } catch {
          useAuthStore.getState().logout();
        }
      }
    }
    return Promise.reject(error);
  }
);

export default client;
