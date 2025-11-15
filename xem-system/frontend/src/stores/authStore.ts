import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        try {
          const response = await api.post('/auth/login', {
            email,
            password,
          });

          const { user, token } = response.data;

          localStorage.setItem('xem_token', token);
          localStorage.setItem('xem_user', JSON.stringify(user));

          set({
            user,
            token,
            isAuthenticated: true,
          });
        } catch (error: any) {
          throw new Error(error.response?.data?.message || 'Login failed');
        }
      },

      logout: () => {
        localStorage.removeItem('xem_token');
        localStorage.removeItem('xem_user');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      checkAuth: async () => {
        const token = localStorage.getItem('xem_token');
        const userStr = localStorage.getItem('xem_user');

        if (!token || !userStr) {
          set({ isAuthenticated: false });
          return;
        }

        try {
          const user = JSON.parse(userStr);
          set({
            user,
            token,
            isAuthenticated: true,
          });
        } catch (error) {
          localStorage.removeItem('xem_token');
          localStorage.removeItem('xem_user');
          set({ isAuthenticated: false });
        }
      },
    }),
    {
      name: 'xem-auth',
    }
  )
);
