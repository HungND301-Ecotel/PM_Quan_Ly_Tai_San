import axios from "axios";
import { store } from "../redux/store";
import { logout } from "../redux/userSlice";
import { ROUTES } from "../utils/routes";

const API_URL = import.meta.env.VITE_BASE_API || "/taisan";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config: any) => {
    const state = store.getState();
    const token = state.user?.user?.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    if (error.response?.status === 401) {
      store.dispatch(logout());
      window.location.href = ROUTES.LOGIN;
    }
    return Promise.reject(error);
  },
);

export default api;
