import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_CONFIG } from '../config/api';

const useAuthStore = create(
  persist(
    (set) => ({
      // State
      token: null,
      user: null,
      loading: false,
      error: null,

      // Actions
      signup: async (username, email, password) => {
        set({ loading: true, error: null });
        try {
          const response = await axios.post(`${API_CONFIG.baseUrl}/api/v1/auth/signup`, {
            username,
            email,
            password,
          });
          const { access_token, username: resUsername, user_id } = response.data;
          const token = access_token;
          const user = { username: resUsername, user_id };
          set({ token, user, loading: false });
          return response.data;
        } catch (err) {
          const errorMsg = err.response?.data?.detail || err.message || 'Signup failed';
          set({ error: errorMsg, loading: false });
          throw new Error(errorMsg);
        }
      },

      login: async (usernameOrEmail, password) => {
        set({ loading: true, error: null });
        try {
          const response = await axios.post(`${API_CONFIG.baseUrl}/api/v1/auth/login`, {
            username: usernameOrEmail,
            password,
          });
          const { access_token, username: resUsername, user_id } = response.data;
          const token = access_token;
          const user = { username: resUsername, user_id };
          set({ token, user, loading: false });
          return response.data;
        } catch (err) {
          const errorMsg = err.response?.data?.detail || err.message || 'Login failed';
          set({ error: errorMsg, loading: false });
          throw new Error(errorMsg);
        }
      },

      logout: () => {
        set({ token: null, user: null, error: null, loading: false });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
);

// Configure axios interceptor for JWT authorization headers
axios.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default useAuthStore;
