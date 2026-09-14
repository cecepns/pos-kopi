/**
 * Centralized API Endpoints Definition
 * In compliance with AGENTS.md:
 * - NO endpoints should ever be hardcoded in components or pages.
 * - All requests must import from this file.
 */

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "https://api.kingcreativestudio.my.id/pos-kopi/api"
).replace(/\/+$/, "");

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    PROFILE: "/auth/profile",
  },

  DASHBOARD: {
    STATS: "/dashboard/stats",
    CHART: "/dashboard/chart",
    TOP_RIDERS: "/dashboard/top-riders",
    POPULAR_PRODUCTS: "/dashboard/popular-products",
  },

  RIDERS: {
    LIST: "/riders",
    ACTIVE_LIST: "/riders/all/active",
    DETAIL: (id) => `/riders/${id}`,
    CREATE: "/riders",
    UPDATE: (id) => `/riders/${id}`,
    DELETE: (id) => `/riders/${id}`,
  },

  CATEGORIES: {
    LIST: "/categories",
    DETAIL: (id) => `/categories/${id}`,
    CREATE: "/categories",
    UPDATE: (id) => `/categories/${id}`,
    DELETE: (id) => `/categories/${id}`,
  },

  PRODUCTS: {
    LIST: "/products",
    STOCK_HO: "/products/stock-ho",
    DETAIL: (id) => `/products/${id}`,
    CREATE: "/products",
    UPDATE: (id) => `/products/${id}`,
    DELETE: (id) => `/products/${id}`,
  },

  SALES: {
    LIST: "/sales",
    DETAIL: (id) => `/sales/${id}`,
    CREATE: "/sales",
    UPDATE: (id) => `/sales/${id}`,
    DELETE: (id) => `/sales/${id}`,
    DAILY_RECAP: "/sales/recap/daily",
  },

  ATTENDANCES: {
    TODAY: "/attendances/today",
    CLOCK_IN: "/attendances/clock-in",
    CLOCK_OUT: "/attendances/clock-out",
    LIST: "/attendances",
  },

  TRACKING: {
    UPDATE_LOCATION: "/riders/location",
    LIVE_LOCATIONS: "/riders/live-locations",
  },

  RIDER_PERFORMANCE: {
    LIST: "/rider-performance",
  },

  RIDER_TARGETS: {
    LIST: "/rider-targets",
    CREATE: "/rider-targets",
    UPDATE: (id) => `/rider-targets/${id}`,
    DELETE: (id) => `/rider-targets/${id}`,
  },

  USERS: {
    LIST: "/users",
    DETAIL: (id) => `/users/${id}`,
    CREATE: "/users",
    UPDATE: (id) => `/users/${id}`,
    DELETE: (id) => `/users/${id}`,
  },

  SETTINGS: {
    GET: "/settings",
    UPDATE: "/settings",
  },
};
