import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

// Components
import Navbar from "./components/common/Navbar";
import Sidebar from "./components/common/Sidebar";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PosCashier from "./pages/PosCashier";
import InputSalesRider from "./pages/InputSalesRider";
import Transactions from "./pages/Transactions";
import DailyRecap from "./pages/DailyRecap";
import Riders from "./pages/Riders";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import RiderPerformance from "./pages/RiderPerformance";
import RiderTargets from "./pages/RiderTargets";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import AttendanceRider from "./pages/AttendanceRider";
import Attendances from "./pages/Attendances";
import HoStock from "./pages/HoStock";
import LiveTracking from "./pages/LiveTracking";

// Protected Layout Component
const AppLayout = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#fcfaf7] flex overflow-x-hidden">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 overflow-x-hidden">
        <Navbar
          toggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          isSidebarOpen={isSidebarOpen}
        />
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

// Login Route Wrapper
const LoginRoute = () => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <Login />;
};

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          {/* Toast Notification Container */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: "#261b17",
                color: "#fbf9f6",
                borderRadius: "16px",
                padding: "12px 18px",
                fontSize: "13px",
                fontWeight: "600",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
              },
              success: {
                iconTheme: {
                  primary: "#10b981",
                  secondary: "#ffffff",
                },
              },
              error: {
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#ffffff",
                },
              },
            }}
          />

          <Routes>
            <Route path="/login" element={<LoginRoute />} />

            {/* Protected Application Routes */}
            <Route
              path="/"
              element={
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              }
            />
            <Route
              path="/pos"
              element={
                <AppLayout>
                  <PosCashier />
                </AppLayout>
              }
            />
            <Route
              path="/input-sales"
              element={
                <AppLayout>
                  <InputSalesRider />
                </AppLayout>
              }
            />
            <Route
              path="/transactions"
              element={
                <AppLayout>
                  <Transactions />
                </AppLayout>
              }
            />
            <Route
              path="/daily-recap"
              element={
                <AppLayout>
                  <DailyRecap />
                </AppLayout>
              }
            />
            <Route
              path="/riders"
              element={
                <AppLayout>
                  <Riders />
                </AppLayout>
              }
            />
            <Route
              path="/products"
              element={
                <AppLayout>
                  <Products />
                </AppLayout>
              }
            />
            <Route
              path="/categories"
              element={
                <AppLayout>
                  <Categories />
                </AppLayout>
              }
            />
            <Route
              path="/rider-performance"
              element={
                <AppLayout>
                  <RiderPerformance />
                </AppLayout>
              }
            />
            <Route
              path="/rider-targets"
              element={
                <AppLayout>
                  <RiderTargets />
                </AppLayout>
              }
            />
            <Route
              path="/users"
              element={
                <AppLayout>
                  <Users />
                </AppLayout>
              }
            />
            <Route
              path="/settings"
              element={
                <AppLayout>
                  <Settings />
                </AppLayout>
              }
            />
            <Route
              path="/attendance"
              element={
                <AppLayout>
                  <AttendanceRider />
                </AppLayout>
              }
            />
            <Route
              path="/attendances"
              element={
                <AppLayout>
                  <Attendances />
                </AppLayout>
              }
            />
            <Route
              path="/ho-stock"
              element={
                <AppLayout>
                  <HoStock />
                </AppLayout>
              }
            />
            <Route
              path="/live-tracking"
              element={
                <AppLayout>
                  <LiveTracking />
                </AppLayout>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
