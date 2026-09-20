import { create } from "zustand";
import { api } from "../services/api";

export interface User {
  id: string;
  clerkId?: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  syncUser: (data: { clerkId: string; email: string; name?: string; avatar?: string }) => Promise<User | null>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem("systemcraft_user") || "null"),
  isLoading: false,

  setUser: (user) => {
    if (user) {
      localStorage.setItem("systemcraft_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("systemcraft_user");
    }
    set({ user });
  },

  syncUser: async (data) => {
    set({ isLoading: true });
    try {
      const res = await api.post("/auth/sync", data);
      const syncedUser = res.data.data.user;
      localStorage.setItem("systemcraft_user", JSON.stringify(syncedUser));
      set({ user: syncedUser, isLoading: false });
      return syncedUser;
    } catch {
      set({ isLoading: false });
      return null;
    }
  },

  logout: () => {
    localStorage.removeItem("systemcraft_token");
    localStorage.removeItem("systemcraft_user");
    set({ user: null });
  }
}));
