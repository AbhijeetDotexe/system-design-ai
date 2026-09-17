import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});

// Attach token if present in localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("systemcraft_token");
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
