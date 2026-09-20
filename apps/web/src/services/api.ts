import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});

let clerkTokenGetter: (() => Promise<string | null>) | null = null;

export const setClerkTokenGetter = (getter: () => Promise<string | null>) => {
  clerkTokenGetter = getter;
};

// Attach token dynamically: from Clerk token getter, window.Clerk, or localStorage
api.interceptors.request.use(async (config) => {
  let token: string | null = null;

  if (clerkTokenGetter) {
    try {
      token = await clerkTokenGetter();
    } catch {
      // ignore
    }
  }

  if (!token && typeof window !== "undefined" && (window as any).Clerk?.session) {
    try {
      token = await (window as any).Clerk.session.getToken();
    } catch {
      // ignore
    }
  }

  if (!token) {
    token = localStorage.getItem("systemcraft_token");
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("systemcraft_token");
      localStorage.removeItem("systemcraft_user");
    }
    return Promise.reject(error);
  }
);
