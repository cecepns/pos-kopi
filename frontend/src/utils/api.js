import axios from "axios";
import { API_BASE_URL } from "./endpoints";

export { API_BASE_URL };

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

// Helper to resolve full image/asset URL from backend uploads
export function getImageUrl(imagePath) {
  if (!imagePath) return "";
  if (
    imagePath.startsWith("http://") ||
    imagePath.startsWith("https://") ||
    imagePath.startsWith("data:")
  ) {
    return imagePath;
  }
  // Strip trailing /api so static uploads map to root app path
  // e.g. https://api.kingcreativestudio.my.id/pos-kopi/api -> https://api.kingcreativestudio.my.id/pos-kopi
  const rootBaseUrl = API_BASE_URL.replace(/\/api\/?$/i, "").replace(/\/+$/, "");
  const cleanPath = imagePath.replace(/^\/+/, "").replace(/^api\//i, "");
  return `${rootBaseUrl}/${cleanPath}`;
}


// Request interceptor to format path and attach auth token if available
api.interceptors.request.use(
  (config) => {
    // If URL starts with slash, strip leading slash so axios appends to baseURL pathname properly
    if (config.url && config.url.startsWith("/")) {
      config.url = config.url.replace(/^\/+/, "");
    }

    const token = localStorage.getItem("kopi_pos_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for unified response handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Terjadi kesalahan pada koneksi server";
    return Promise.reject(new Error(message));
  }
);
