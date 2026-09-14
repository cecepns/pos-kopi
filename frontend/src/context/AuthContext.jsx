import React, { createContext, useContext, useState, useEffect } from "react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("kopi_pos_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [riderInfo, setRiderInfo] = useState(() => {
    const saved = localStorage.getItem("kopi_pos_rider");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const response = await request.post(API_ENDPOINTS.AUTH.LOGIN, {
        username,
        password,
      });

      if (response.success && response.data) {
        const { token, user: userData, rider } = response.data;
        localStorage.setItem("kopi_pos_token", token);
        localStorage.setItem("kopi_pos_user", JSON.stringify(userData));
        setUser(userData);

        if (rider) {
          localStorage.setItem("kopi_pos_rider", JSON.stringify(rider));
          setRiderInfo(rider);
        } else {
          localStorage.removeItem("kopi_pos_rider");
          setRiderInfo(null);
        }

        return { success: true, user: userData };
      }
      return { success: false, message: response.message };
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("kopi_pos_token");
    localStorage.removeItem("kopi_pos_user");
    localStorage.removeItem("kopi_pos_rider");
    setUser(null);
    setRiderInfo(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        riderInfo,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        isOwner: user?.role === "owner",
        isAdmin: user?.role === "admin" || user?.role === "owner",
        isRider: user?.role === "rider",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
