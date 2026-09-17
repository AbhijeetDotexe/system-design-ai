import { create } from "zustand";
import { api } from "../services/api";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem("systemcraft_user") || "null"),
  token: localStorage.getItem("systemcraft_token"),
  isAuthenticated: !!localStorage.getItem("systemcraft_token"),
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await api.post("/auth/login", { email, password });
      const { user, token } = res.data.data;
      localStorage.setItem("systemcraft_token", token);
      localStorage.setItem("systemcraft_user", JSON.stringify(user));
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true });
    try {
      const res = await api.post("/auth/register", { name, email, password });
      const { user, token } = res.data.data;
      localStorage.setItem("systemcraft_token", token);
      localStorage.setItem("systemcraft_user", JSON.stringify(user));
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore
    } finally {
      localStorage.removeItem("systemcraft_token");
      localStorage.removeItem("systemcraft_user");
      set({ user: null, token: null, isAuthenticated: false });
    }
  },

  checkAuth: async () => {
    const token = localStorage.getItem("systemcraft_token");
    if (!token) {
      set({ user: null, isAuthenticated: false });
      return;
    }
    try {
      const res = await api.get("/auth/me");
      const user = res.data.data.user;
      localStorage.setItem("systemcraft_user", JSON.stringify(user));
      set({ user, isAuthenticated: true });
    } catch {
      localStorage.removeItem("systemcraft_token");
      localStorage.removeItem("systemcraft_user");
      set({ user: null, token: null, isAuthenticated: false });
    }
  }
}));
