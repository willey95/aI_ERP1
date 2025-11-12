import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { User, AuthState } from '@/types';
import { authApi } from '@/lib/api';

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,

        login: async (email: string, password: string) => {
          try {
            set({ isLoading: true });
            const response = await authApi.login(email, password);

            localStorage.setItem('access_token', response.accessToken);
            localStorage.setItem('refresh_token', response.refreshToken);

            set({
              user: response.user,
              accessToken: response.accessToken,
              isAuthenticated: true,
              isLoading: false,
            });
          } catch (error) {
            set({ isLoading: false });
            throw error;
          }
        },

        logout: async () => {
          try {
            await authApi.logout();
          } catch (error) {
            console.error('Logout error:', error);
          } finally {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            set({
              user: null,
              accessToken: null,
              isAuthenticated: false,
            });
          }
        },

        setUser: (user: User | null) => {
          set({ user, isAuthenticated: !!user });
        },

        setToken: (token: string | null) => {
          set({ accessToken: token, isAuthenticated: !!token });
          if (token) {
            localStorage.setItem('access_token', token);
          } else {
            localStorage.removeItem('access_token');
          }
        },

        initialize: async () => {
          const token = localStorage.getItem('access_token');
          if (!token) {
            set({ isAuthenticated: false, isLoading: false });
            return;
          }

          try {
            set({ isLoading: true });
            const user = await authApi.getCurrentUser();
            set({
              user,
              accessToken: token,
              isAuthenticated: true,
              isLoading: false,
            });
          } catch (error) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            set({
              user: null,
              accessToken: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        },
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          user: state.user,
          accessToken: state.accessToken,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    )
  )
);
