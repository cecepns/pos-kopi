import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Menu,
  LogOut,
  User,
  MapPin,
  Bell,
  RotateCcw,
  Check,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Phone,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Coffee,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useRiderLocationTracker } from "../../hooks/useRiderLocationTracker";
import { request } from "../../utils/request";
import { API_ENDPOINTS } from "../../utils/endpoints";
import toast from "react-hot-toast";

export default function Navbar({ toggleSidebar, isSidebarOpen }) {
  const { user, logout, isRider, riderInfo } = useAuth();
  const { isOnDuty, toggleDuty } = useRiderLocationTracker();

  // Refill notification states for Admin/Owner/Kasir
  const [pendingRefills, setPendingRefills] = useState([]);
  const [isRefillDropdownOpen, setIsRefillDropdownOpen] = useState(false);

  // Rider refill request modal states
  const [isRiderRefillModalOpen, setIsRiderRefillModalOpen] = useState(false);
  const [productList, setProductList] = useState([]);
  const [refillProduct, setRefillProduct] = useState("");
  const [refillQty, setRefillQty] = useState(10);
  const [refillNotes, setRefillNotes] = useState("");
  const [isSubmittingRefill, setIsSubmittingRefill] = useState(false);

  // Rider incoming customer order states
  const [riderOrders, setRiderOrders] = useState([]);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const prevPendingCountRef = useRef(0);

  // Fetch pending refills for Admin/Kasir/Owner
  const fetchPendingRefills = async () => {
    if (isRider) return;
    try {
      const res = await request.get(API_ENDPOINTS.REFILLS.LIST, { status: "pending" });
      if (res.success) {
        setPendingRefills(res.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch products for Rider refill dropdown
  const fetchProducts = async () => {
    if (!isRider) return;
    try {
      const res = await request.get(API_ENDPOINTS.PRODUCTS.LIST, { limit: 100 });
      if (res.success) {
        setProductList(res.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch incoming customer orders for Rider
  const fetchRiderOrders = async () => {
    if (!isRider || !riderInfo?.id) return;
    try {
      const res = await request.get(API_ENDPOINTS.CUSTOMER_APP.RIDER_ORDERS, {
        rider_id: riderInfo.id,
        status: "pending,accepted,brewing,ready",
      });
      if (res.success) {
        const orders = res.data || [];
        setRiderOrders(orders);
        const pendingCount = orders.filter((o) => o.order_status === "pending").length;
        if (pendingCount > prevPendingCountRef.current && prevPendingCountRef.current !== 0) {
          toast.success(`🔔 Pesanan Baru Masuk! Ada ${pendingCount} pesanan online menunggu.`, {
            duration: 6000,
            icon: "☕",
          });
        }
        prevPendingCountRef.current = pendingCount;
      }
    } catch (err) {
      console.error("Error fetching rider orders:", err);
    }
  };

  useEffect(() => {
    fetchPendingRefills();
    fetchProducts();
    fetchRiderOrders();

    // Polling refills for Admin/Kasir & Orders for Rider
    let interval = null;
    if (!isRider) {
      interval = setInterval(fetchPendingRefills, 20000);
    } else if (riderInfo?.id) {
      interval = setInterval(fetchRiderOrders, 15000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRider, riderInfo?.id]);

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    setIsUpdatingStatus(true);
    try {
      const res = await request.put(API_ENDPOINTS.CUSTOMER_APP.UPDATE_STATUS(orderId), {
        order_status: newStatus,
      });
      if (res.success) {
        toast.success(`Status pesanan diperbarui ke: ${newStatus}`);
        fetchRiderOrders();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleApproveRefill = async (id) => {
    try {
      const res = await request.put(API_ENDPOINTS.REFILLS.APPROVE(id));
      if (res.success) {
        toast.success(res.message || "Refill stok berhasil disetujui!");
        fetchPendingRefills();
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRiderSubmitRefill = async (e) => {
    e.preventDefault();
    if (!refillProduct) {
      toast.error("Pilih produk kopi yang ingin di-refill!");
      return;
    }
    setIsSubmittingRefill(true);
    try {
      const res = await request.post(API_ENDPOINTS.REFILLS.REQUEST, {
        product_id: refillProduct,
        qty: refillQty,
        notes: refillNotes,
      });
      if (res.success) {
        toast.success("Permintaan refill berhasil dikirim ke Admin/HO!");
        setIsRiderRefillModalOpen(false);
        setRefillProduct("");
        setRefillNotes("");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmittingRefill(false);
    }
  };

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
            className="p-2 rounded-xl text-espresso hover:bg-amber-50 hover:text-coffee-600 transition-colors focus:outline-hidden cursor-pointer"
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

        {/* Right: Quick Actions, Alerts & Profile */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Rider GPS Broadcast Toggle */}
          {isRider && (
            <button
              type="button"
              onClick={toggleDuty}
              className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs border cursor-pointer ${
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

          {/* Owner / Admin / Cashier Quick Live GPS Link */}
          {!isRider && (
            <Link
              to="/live-tracking"
              className="px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs border bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
              title="Pantau Lokasi GPS Rider Realtime"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden sm:inline">Live GPS Rider</span>
            </Link>
          )}

          {/* Refill Notifications Bell for Admin / Kasir / Owner */}
          {!isRider && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsRefillDropdownOpen((prev) => !prev)}
                className="relative p-2 rounded-xl text-espresso hover:bg-amber-50 hover:text-coffee-600 transition-colors cursor-pointer"
                title="Notifikasi Permintaan Refill Rider"
              >
                <Bell className="w-5 h-5 text-gray-700" />
                {pendingRefills.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                    {pendingRefills.length}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {isRefillDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-amber-200 z-50 overflow-hidden">
                  <div className="p-3.5 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
                    <span className="font-extrabold text-xs text-espresso flex items-center gap-1.5">
                      <Bell className="w-4 h-4 text-coffee-600" />
                      <span>Permintaan Refill Stok ({pendingRefills.length})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsRefillDropdownOpen(false)}
                      className="text-gray-400 hover:text-gray-600 text-xs font-bold cursor-pointer"
                    >
                      Tutup
                    </button>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 text-xs">
                    {pendingRefills.length === 0 ? (
                      <div className="py-6 text-center text-gray-400">
                        <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-1" />
                        <p className="font-semibold text-xs text-gray-600">Tidak ada permintaan refill aktif</p>
                        <p className="text-[10px] text-gray-400">Semua rider beroperasi normal.</p>
                      </div>
                    ) : (
                      pendingRefills.map((rf) => (
                        <div key={rf.id} className="p-3 hover:bg-amber-50/30 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="font-bold text-espresso text-xs block">{rf.rider_name}</span>
                              <span className="text-[10px] text-gray-400">Rider #{rf.rider_code}</span>
                            </div>
                            <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded-full">
                              Minta +{rf.qty} Cup
                            </span>
                          </div>

                          <div className="text-[11px] text-gray-700 bg-gray-50 p-2 rounded-xl">
                            Produk: <strong>{rf.product_name}</strong>
                            <div className="text-[10px] text-gray-500 mt-0.5">
                              Sisa Stok HO: {rf.current_ho_stock} cup • {rf.notes || "Refill stok keliling"}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleApproveRefill(rf.id)}
                            className="w-full py-1.5 bg-coffee-600 hover:bg-coffee-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Setujui & Kirim Refill</span>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Rider Refill Request Trigger Button */}
          {isRider && (
            <button
              type="button"
              onClick={() => setIsRiderRefillModalOpen(true)}
              className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-coffee-800 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-amber-300 shadow-2xs"
              title="Ajukan Tambahan Stok Kopi ke HO"
            >
              <RotateCcw className="w-3.5 h-3.5 text-coffee-700" />
              <span>Minta Refill</span>
            </button>
          )}

          {/* Rider Incoming Customer Orders Button & Badge */}
          {isRider && (
            <button
              type="button"
              onClick={() => setIsOrderModalOpen(true)}
              className={`relative px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border shadow-2xs ${
                riderOrders.some((o) => o.order_status === "pending")
                  ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-600 animate-pulse"
                  : riderOrders.length > 0
                  ? "bg-coffee-700 hover:bg-coffee-800 text-white border-coffee-800"
                  : "bg-coffee-50 hover:bg-coffee-100 text-coffee-800 border-coffee-200"
              }`}
              title="Pesanan Online dari Pelanggan"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Order ({riderOrders.length})</span>
              {riderOrders.some((o) => o.order_status === "pending") && (
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 absolute -top-1 -right-1 ring-2 ring-white animate-ping" />
              )}
            </button>
          )}

          {/* Customer Portal Link (Open Customer Mode) */}
          <Link
            to="/customer"
            target="_blank"
            className="px-2.5 py-1.5 bg-espresso text-white rounded-full text-[11px] font-bold flex items-center gap-1.5 hover:bg-espresso-light transition-colors"
            title="Buka Mode Pemesanan Customer (PWA)"
          >
            <span>Customer PWA</span>
          </Link>

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
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Modal for Rider to Request Refill */}
      {isRiderRefillModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-amber-100 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="font-extrabold text-sm text-espresso flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-coffee-600" />
                <span>Ajukan Refill Stok ke HO</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsRiderRefillModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRiderSubmitRefill} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Pilih Produk Kopi *</label>
                <select
                  required
                  value={refillProduct}
                  onChange={(e) => setRefillProduct(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                >
                  <option value="">-- Pilih Produk --</option>
                  {productList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Jumlah Refill (Cup) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={refillQty}
                  onChange={(e) => setRefillQty(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  value={refillNotes}
                  onChange={(e) => setRefillNotes(e.target.value)}
                  placeholder="Contoh: Stok Kopi Aren hampir habis di Sudirman..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsRiderRefillModalOpen(false)}
                  className="px-3 py-2 border border-gray-200 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRefill}
                  className="px-4 py-2 bg-coffee-600 hover:bg-coffee-700 text-white font-bold rounded-xl disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingRefill ? "Mengirim..." : "Kirim Request Refill"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Rider to Manage Incoming Customer Orders */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-amber-100 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-black text-base text-espresso flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-amber-600" />
                  <span>Pesanan Pelanggan Masuk</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Daftar pesanan aktif dari web / aplikasi pelanggan secara online
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOrderModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold flex items-center justify-center text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {riderOrders.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Coffee className="w-12 h-12 mx-auto mb-3 opacity-30 stroke-[1.5]" />
                  <p className="text-sm font-semibold">Belum ada pesanan masuk saat ini</p>
                  <p className="text-xs text-gray-400 mt-1">Pesanan pelanggan akan otomatis muncul di sini</p>
                </div>
              ) : (
                riderOrders.map((order) => {
                  const getStatusBadge = (status) => {
                    switch (status) {
                      case "pending":
                        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 animate-pulse">Menunggu Konfirmasi</span>;
                      case "accepted":
                        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800">Diterima</span>;
                      case "brewing":
                        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800">Sedang Diracik</span>;
                      case "ready":
                        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">Siap Diambil/Diantar</span>;
                      default:
                        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-700">{status}</span>;
                    }
                  };

                  const cleanPhone = (order.customer_phone || "").replace(/[^0-9]/g, "");
                  const waNumber = cleanPhone.startsWith("0") ? "62" + cleanPhone.slice(1) : cleanPhone;

                  return (
                    <div
                      key={order.id}
                      className="p-4 rounded-2xl border border-amber-100 bg-amber-50/20 hover:bg-white hover:border-amber-300 transition-all space-y-3 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-espresso">{order.sale_number}</span>
                            {getStatusBadge(order.order_status)}
                          </div>
                          <p className="text-xs font-bold text-gray-700 mt-1">
                            👤 {order.customer_name || "Pelanggan"} • {order.customer_phone}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-coffee-800">
                            Rp {Number(order.total_amount).toLocaleString("id-ID")}
                          </span>
                          <span className="block text-[10px] text-gray-400 capitalize">
                            {order.payment_method}
                          </span>
                        </div>
                      </div>

                      {/* Items Ordered */}
                      <div className="bg-white p-2.5 rounded-xl border border-gray-100 text-xs space-y-1">
                        <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Item Pesanan:</span>
                        {order.items && order.items.length > 0 ? (
                          order.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between items-center text-gray-700 text-xs">
                              <span>• {it.product_name} <strong className="text-coffee-700">x{it.qty}</strong></span>
                              <span className="font-semibold text-gray-500">Rp {Number(it.subtotal).toLocaleString("id-ID")}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 text-xs">{order.total_items} Cup Kopi</p>
                        )}
                        {order.notes && (
                          <p className="text-[11px] text-amber-700 font-medium bg-amber-50/60 p-1.5 rounded-lg mt-1">
                            📍 Titik/Catatan: {order.notes}
                          </p>
                        )}
                      </div>

                      {/* Action Progression & WhatsApp Button */}
                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        {order.customer_phone && (
                          <a
                            href={`https://wa.me/${waNumber}?text=Halo%20${encodeURIComponent(order.customer_name || 'Kak')},%20saya%20Rider%20KOPIGO%20yang%20menerima%20pesanan%20kopi%20Anda%20(${order.sale_number})...`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Chat WA</span>
                          </a>
                        )}

                        {order.order_status === "pending" && (
                          <button
                            type="button"
                            disabled={isUpdatingStatus}
                            onClick={() => handleUpdateOrderStatus(order.id, "accepted")}
                            className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                          >
                            ✓ Terima Pesanan
                          </button>
                        )}

                        {order.order_status === "accepted" && (
                          <button
                            type="button"
                            disabled={isUpdatingStatus}
                            onClick={() => handleUpdateOrderStatus(order.id, "brewing")}
                            className="flex-1 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                          >
                            ☕ Mulai Racik Kopi
                          </button>
                        )}

                        {order.order_status === "brewing" && (
                          <button
                            type="button"
                            disabled={isUpdatingStatus}
                            onClick={() => handleUpdateOrderStatus(order.id, "ready")}
                            className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                          >
                            🛵 Siap Diambil / Diantar
                          </button>
                        )}

                        {order.order_status === "ready" && (
                          <button
                            type="button"
                            disabled={isUpdatingStatus}
                            onClick={() => handleUpdateOrderStatus(order.id, "completed")}
                            className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                          >
                            🎉 Selesai Diantar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
              <span>Auto-refresh setiap 15 detik</span>
              <button
                type="button"
                onClick={fetchRiderOrders}
                className="font-bold text-coffee-700 hover:underline cursor-pointer"
              >
                Segarkan Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
