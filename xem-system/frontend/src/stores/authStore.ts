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
    (set, get) => ({
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

          // Store token in localStorage for API interceptor
          localStorage.setItem('xem_token', token);

          // Zustand persist middleware handles localStorage automatically
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
        // Remove token from localStorage
        localStorage.removeItem('xem_token');

        // Zustand persist middleware handles localStorage cleanup automatically
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      checkAuth: async () => {
        // No need to manually check localStorage - persist middleware handles this
        // This function is kept for future API validation if needed
        const state = useAuthStore.getState();

        if (!state.token || !state.user) {
          set({ isAuthenticated: false });
          return;
        }

        // State is already loaded from localStorage by persist middleware
        set({ isAuthenticated: true });
      },
    }),
    {
      name: 'xem-auth',
      onRehydrateStorage: () => (state) => {
        // When zustand restores state from localStorage, also set token in localStorage
        if (state?.token) {
          localStorage.setItem('xem_token', state.token);
        }
      },
    }
  )
);
