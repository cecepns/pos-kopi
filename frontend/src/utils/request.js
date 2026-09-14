import { api } from "./api";

/**
 * Reusable request helper for standard REST interactions
 */
export const request = {
  get: async (url, params = {}) => {
    const response = await api.get(url, { params });
    return response.data;
  },

  post: async (url, data = {}, config = {}) => {
    const response = await api.post(url, data, config);
    return response.data;
  },

  put: async (url, data = {}, config = {}) => {
    const response = await api.put(url, data, config);
    return response.data;
  },

  delete: async (url, params = {}) => {
    const response = await api.delete(url, { params });
    return response.data;
  },
};
