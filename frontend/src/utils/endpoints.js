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

  STOCKS: {
    RESTOCK_HO: "/stocks/restock-ho",
    ALLOCATE_RIDER: "/stocks/allocate-rider",
    RIDER_STOCKS: "/stocks/rider-stocks",
    REJECT: "/stocks/reject",
    REJECTS_LIST: "/stocks/rejects",
    RETURN_HO: "/stocks/return-ho",
  },

  CARTS: {
    LIST: "/carts",
    CREATE: "/carts",
    UPDATE: (id) => `/carts/${id}`,
    DELETE: (id) => `/carts/${id}`,
    ASSIGN_RIDER: (id) => `/carts/${id}/assign-rider`,
    CHECKLISTS: "/cart-checklists",
    CREATE_CHECKLIST: "/cart-checklists",
    DAMAGE_REPORTS: "/cart-damage-reports",
    CREATE_DAMAGE_REPORT: "/cart-damage-reports",
    UPDATE_DAMAGE_REPORT: (id) => `/cart-damage-reports/${id}`,
  },

  LOCATIONS: {
    SALES: "/locations/sales",
    TOP_PRODUCTIVE: "/locations/top-productive",
  },

  CRM: {
    STATS: "/crm/stats",
    CUSTOMERS: "/crm/customers",
    CREATE_CUSTOMER: "/crm/customers",
    UPDATE_CUSTOMER: (id) => `/crm/customers/${id}`,
    DELETE_CUSTOMER: (id) => `/crm/customers/${id}`,
    ADJUST_POINTS: (id) => `/crm/customers/${id}/adjust-points`,
    VOUCHERS: "/crm/vouchers",
    CREATE_VOUCHER: "/crm/vouchers",
    UPDATE_VOUCHER: (id) => `/crm/vouchers/${id}`,
    DELETE_VOUCHER: (id) => `/crm/vouchers/${id}`,
    PROMOS: "/crm/promos",
    CREATE_PROMO: "/crm/promos",
    UPDATE_PROMO: (id) => `/crm/promos/${id}`,
    DELETE_PROMO: (id) => `/crm/promos/${id}`,
  },

  REFILLS: {
    LIST: "/refills",
    REQUEST: "/refills",
    APPROVE: (id) => `/refills/${id}/approve`,
    REJECT: (id) => `/refills/${id}/reject`,
  },

  RATINGS: {
    SUBMIT: (riderId) => `/riders/${riderId}/ratings`,
    LIST: (riderId) => `/riders/${riderId}/ratings`,
  },

  CUSTOMER_APP: {
    NEARBY_RIDERS: "/customer-app/nearby-riders",
    ACTIVE_VOUCHERS: "/customer-app/active-vouchers",
    CREATE_ORDER: "/customer-app/orders",
    ORDER_DETAIL: (id) => `/customer-app/orders/${id}`,
    UPDATE_STATUS: (id) => `/customer-app/orders/${id}/status`,
    ORDER_HISTORY: "/customer-app/orders/history",
    FAVORITES: "/customer-app/favorites",
    TOGGLE_FAVORITE: "/customer-app/favorites/toggle",
    RIDER_ORDERS: "/customer-app/rider-orders",
  },
};
