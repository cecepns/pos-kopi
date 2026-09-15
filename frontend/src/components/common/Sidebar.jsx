import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  PlusCircle,
  Receipt,
  CalendarCheck,
  Bike,
  Coffee,
  Tags,
  Users,
  TrendingUp,
  Target,
  Settings,
  X,
  MapPin,
  UserCheck,
  Boxes,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export default function Sidebar({ isOpen, onClose }) {
  const { user, isOwner, isAdmin, isRider } = useAuth();

  const menuSections = [
    {
      title: "UTAMA",
      items: [
        { name: "Dashboard", path: "/", icon: LayoutDashboard, show: true },
        { name: "Live Tracking GPS", path: "/live-tracking", icon: MapPin, show: !isRider, highlight: true, isLive: true },
      ],
    },
    {
      title: "OPERASIONAL",
      items: [
        { name: "Kasir (POS)", path: "/pos", icon: ShoppingCart, show: !isRider },
        { name: "Input Sales Rider", path: "/input-sales", icon: PlusCircle, show: true, highlight: true },
        { name: "Presensi Absensi", path: "/attendance", icon: UserCheck, show: isRider },
        { name: "Distribusi & Stok HO", path: "/ho-stock", icon: Boxes, show: true },
        { name: "Transaksi", path: "/transactions", icon: Receipt, show: true },
        { name: "Rekap Harian", path: "/daily-recap", icon: CalendarCheck, show: !isRider },
        { name: "Rekap Presensi", path: "/attendances", icon: UserCheck, show: !isRider },
      ],
    },
    {
      title: "MASTER DATA",
      items: [
        { name: "Data Rider", path: "/riders", icon: Bike, show: !isRider },
        { name: "Produk Kopi", path: "/products", icon: Coffee, show: !isRider },
        { name: "Kategori", path: "/categories", icon: Tags, show: !isRider },
        { name: "Pengguna (User)", path: "/users", icon: Users, show: isOwner },
      ],
    },
    {
      title: "EVALUASI & LAPORAN",
      items: [
        { name: "Performa Rider", path: "/rider-performance", icon: TrendingUp, show: true },
        { name: "Target Rider", path: "/rider-targets", icon: Target, show: !isRider },
      ],
    },
    {
      title: "SISTEM",
      items: [
        { name: "Pengaturan Toko", path: "/settings", icon: Settings, show: isOwner },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-espresso text-cream-light border-r border-espresso-light transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"
          } flex flex-col`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-white/10 bg-black/20">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
            <span className="font-bold text-white text-base tracking-wide">
              KOPI <span className="text-coffee-400">NUSANTARA</span>
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-cream/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menus */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {menuSections.map((section, sIdx) => {
            const visibleItems = section.items.filter((item) => item.show);
            if (visibleItems.length === 0) return null;

            return (
              <div key={sIdx}>
                <p className="px-3 text-[11px] font-bold text-cream/40 uppercase tracking-wider mb-2">
                  {section.title}
                </p>
                <div className="space-y-1">
                  {visibleItems.map((item, iIdx) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={iIdx}
                        to={item.path}
                        onClick={() => {
                          if (window.innerWidth < 1024) onClose();
                        }}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                            ? "bg-coffee-600 text-white shadow-md shadow-coffee-950/40"
                            : item.highlight
                              ? "bg-coffee-900/40 text-coffee-300 hover:bg-coffee-800/50 hover:text-white"
                              : "text-cream/80 hover:bg-white/10 hover:text-white"
                          }`
                        }
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.name}</span>
                        {item.isLive ? (
                          <span className="ml-auto inline-flex items-center gap-1 text-[10px] bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                            LIVE
                          </span>
                        ) : item.highlight ? (
                          <span className="ml-auto text-[10px] bg-coffee-500/30 text-coffee-300 border border-coffee-500/40 px-1.5 py-0.5 rounded-md font-semibold">
                            Cepat
                          </span>
                        ) : null}

                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-white/10 bg-black/20 text-center">
          <p className="text-[11px] text-cream/50">Kopi POS & Rider v1.0.0</p>
        </div>
      </aside>
    </>
  );
}
