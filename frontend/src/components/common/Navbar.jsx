import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, LogOut, Coffee, ShoppingBag, PlusCircle, User, MapPin } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useRiderLocationTracker } from "../../hooks/useRiderLocationTracker";
import toast from "react-hot-toast";

export default function Navbar({ toggleSidebar, isSidebarOpen }) {
  const { user, logout, isRider } = useAuth();
  const { isOnDuty, toggleDuty } = useRiderLocationTracker();

  const handleLogout = () => {
    logout();
    toast.success("Berhasil logout!");
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "owner":
        return <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">Owner</span>;
      case "admin":
        return <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-coffee-100 text-coffee-800">Admin/Kasir</span>;
      case "rider":
        return <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Rider</span>;
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-amber-100 shadow-xs">
      <div className="flex items-center justify-between px-4 sm:px-6 h-16">
        {/* Left: Sidebar Toggle & Brand */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label="Toggle Sidebar"
            className="p-2 rounded-xl text-espresso hover:bg-amber-50 hover:text-coffee-600 transition-colors focus:outline-hidden"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Logo Kopi POS" className="w-9 h-9 object-contain drop-shadow-xs" />
            <div className="hidden sm:block">
              <span className="font-extrabold text-base text-espresso tracking-tight flex items-center gap-1.5">
                KOPI POS <span className="text-xs px-1.5 py-0.5 bg-coffee-600 text-white rounded font-medium">RIDER</span>
              </span>
              <p className="text-[11px] text-gray-500 font-medium">Manajemen Kasir & Sales Rider</p>
            </div>
          </div>
        </div>

        {/* Right: Quick Actions & Profile */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Rider GPS Broadcast Toggle */}
          {isRider && (
            <button
              type="button"
              onClick={toggleDuty}
              className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs border ${
                isOnDuty
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-400/20"
                  : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
              }`}
              title={isOnDuty ? "GPS Keliling Aktif & Terpantau" : "Klik untuk Aktifkan GPS Keliling"}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnDuty ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
                }`}
              />
              <span className="hidden sm:inline">Mode Keliling:</span>
              <span>{isOnDuty ? "ON" : "OFF"}</span>
            </button>
          )}

          {/* User profile info */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-amber-100">
            <div className="w-9 h-9 rounded-full bg-amber-100/80 border border-amber-200 flex items-center justify-center text-coffee-800 font-bold text-sm shadow-inner">
              {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
            </div>
            <div className="hidden md:block text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-espresso truncate max-w-[140px]">{user?.name || "User"}</span>
                {getRoleBadge(user?.role)}
              </div>
              <span className="text-[11px] text-gray-500">@{user?.username}</span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            title="Keluar"
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
