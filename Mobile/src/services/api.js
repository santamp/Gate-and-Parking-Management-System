import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Note: For Android Emulator use 10.0.2.2. For iOS use localhost or machine IP.
export const API_BASE_URL = 'http://10.0.2.2:5001/api/v1';
export const SOCKET_BASE_URL = API_BASE_URL.split('/api')[0];

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error fetching token from storage', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      // Navigation handling should be done in a separate service or context
    }
    return Promise.reject(error);
  }
);

export default api;
