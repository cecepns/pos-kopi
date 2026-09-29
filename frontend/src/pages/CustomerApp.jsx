import React, { useState, useEffect } from "react";
import {
  Coffee,
  MapPin,
  Bike,
  Star,
  Clock,
  CheckCircle2,
  ChevronRight,
  ShoppingBag,
  Ticket,
  CreditCard,
  QrCode,
  DollarSign,
  Heart,
  History,
  ArrowLeft,
  X,
  Phone,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import { formatRupiah, formatDateTimeIndo } from "../utils/formatters";
import Badge from "../components/common/Badge";
import Modal from "../components/common/Modal";
import toast from "react-hot-toast";

export default function CustomerApp() {
  const [customerName, setCustomerName] = useState(
    () => localStorage.getItem("kopigo_cust_name") || "Ricky"
  );
  const [customerPhone, setCustomerPhone] = useState(
    () => localStorage.getItem("kopigo_cust_phone") || "08123456789"
  );

  // Views: 'home' | 'nearby' | 'order' | 'tracking' | 'history'
  const [activeView, setActiveView] = useState("home");

  // State: Nearby Riders
  const [nearbyRiders, setNearbyRiders] = useState([]);
  const [selectedRider, setSelectedRider] = useState(null);
  const [loadingRiders, setLoadingRiders] = useState(true);

  // State: Cart / Ordering
  const [cartItems, setCartItems] = useState({}); // { [productId]: qty }
  const [availableProducts, setAvailableProducts] = useState([]);
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("qris"); // 'qris' | 'cash'
  const [orderNotes, setOrderNotes] = useState("");
  const [pickupPoint, setPickupPoint] = useState("Depan Lobi Gedung A");
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // State: Active Order Tracking
  const [activeOrder, setActiveOrder] = useState(null);

  // State: Order History & Favorites
  const [orderHistory, setOrderHistory] = useState([]);
  const [favoriteRiders, setFavoriteRiders] = useState([]);
  const [favoriteProducts, setFavoriteProducts] = useState([]);
  const [customerStats, setCustomerStats] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Rating Modal
  const [ratingModalOrder, setRatingModalOrder] = useState(null);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingReview, setRatingReview] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  // Fetch Nearby Riders
  const fetchNearby = async () => {
    setLoadingRiders(true);
    try {
      // Default to Jakarta coordinate or user browser geolocation if available
      let lat = -6.2088;
      let lng = 106.8456;

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            lat = pos.coords.latitude;
            lng = pos.coords.longitude;
            callNearbyApi(lat, lng);
          },
          () => {
            callNearbyApi(lat, lng);
          }
        );
      } else {
        callNearbyApi(lat, lng);
      }
    } catch (err) {
      console.error(err);
      setLoadingRiders(false);
    }
  };

  const callNearbyApi = async (lat, lng) => {
    try {
      const res = await request.get(API_ENDPOINTS.CUSTOMER_APP.NEARBY_RIDERS, { lat, lng });
      if (res.success) {
        const list = res.data || [];
        setNearbyRiders(list);
        if (list.length > 0 && !selectedRider) {
          const firstOpen = list.find((r) => r.is_open) || list[0];
          setSelectedRider(firstOpen);
          setAvailableProducts(firstOpen.available_products || []);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRiders(false);
    }
  };

  // Fetch History & Favorites
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const [histRes, favRes] = await Promise.all([
        request.get(API_ENDPOINTS.CUSTOMER_APP.ORDER_HISTORY, { phone: customerPhone }),
        request.get(API_ENDPOINTS.CUSTOMER_APP.FAVORITES, { phone: customerPhone }),
      ]);

      if (histRes.success) {
        setOrderHistory(histRes.data?.orders || []);
        setFavoriteProducts(histRes.data?.favorite_products || []);
        setCustomerStats(histRes.data?.customer || null);
      }
      if (favRes.success) {
        setFavoriteRiders(favRes.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchNearby();
  }, []);

  useEffect(() => {
    if (activeView === "history") {
      fetchHistory();
    }
  }, [activeView, customerPhone]);

  // Polling active order tracking status
  useEffect(() => {
    let interval = null;
    if (activeOrder && activeOrder.order_status !== "ready" && activeOrder.order_status !== "completed") {
      interval = setInterval(async () => {
        try {
          const res = await request.get(API_ENDPOINTS.CUSTOMER_APP.ORDER_DETAIL(activeOrder.id));
          if (res.success && res.data) {
            setActiveOrder(res.data);
          }
        } catch (e) {
          console.error(e);
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [activeOrder]);

  const nearestRider = nearbyRiders[0];

  const handleSelectRider = (rider) => {
    setSelectedRider(rider);
    setAvailableProducts(rider.available_products || []);
    setCartItems({});
    setActiveView("order");
  };

  const handleQuantityChange = (productId, delta) => {
    setCartItems((prev) => {
      const current = prev[productId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return { ...prev, [productId]: next };
    });
  };

  // Subtotal calculation
  const subtotal = Object.entries(cartItems).reduce((sum, [pId, qty]) => {
    const prod = availableProducts.find((p) => p.product_id === Number(pId));
    return sum + (prod ? prod.price * qty : 0);
  }, 0);

  // Apply Voucher
  const handleApplyVoucher = async () => {
    if (!voucherCode) return;
    try {
      const res = await request.get(API_ENDPOINTS.CUSTOMER_APP.ACTIVE_VOUCHERS);
      if (res.success) {
        const list = res.data || [];
        const match = list.find((v) => v.code.toUpperCase() === voucherCode.toUpperCase().trim());
        if (!match) {
          toast.error("Kode voucher tidak valid atau sudah kedaluwarsa!");
          return;
        }
        if (subtotal < match.min_order_amount) {
          toast.error(`Minimal belanja untuk voucher ini adalah ${formatRupiah(match.min_order_amount)}`);
          return;
        }
        setAppliedVoucher(match);
        toast.success(`Voucher ${match.code} berhasil dipasang!`);
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const discountAmount = appliedVoucher
    ? appliedVoucher.discount_type === "percent"
      ? Math.round((subtotal * appliedVoucher.discount_value) / 100)
      : Math.min(subtotal, appliedVoucher.discount_value)
    : 0;

  const totalAmount = Math.max(0, subtotal - discountAmount);

  // Submit Order
  const handleSubmitOrder = async () => {
    if (Object.keys(cartItems).length === 0) {
      toast.error("Pilih minimal satu cup kopi!");
      return;
    }
    if (!customerPhone || !customerName) {
      toast.error("Nama dan nomor WhatsApp wajib diisi!");
      return;
    }

    setIsSubmittingOrder(true);
    try {
      localStorage.setItem("kopigo_cust_name", customerName);
      localStorage.setItem("kopigo_cust_phone", customerPhone);

      const itemsPayload = Object.entries(cartItems).map(([pId, qty]) => ({
        product_id: Number(pId),
        qty,
      }));

      const payload = {
        customer_name: customerName,
        customer_phone: customerPhone,
        rider_id: selectedRider?.id || null,
        items: itemsPayload,
        voucher_code: appliedVoucher ? appliedVoucher.code : "",
        payment_method: paymentMethod,
        pickup_location: pickupPoint,
        notes: orderNotes,
      };

      const res = await request.post(API_ENDPOINTS.CUSTOMER_APP.CREATE_ORDER, payload);
      if (res.success) {
        toast.success("Pesanan berhasil dikirim ke rider!");
        // Fetch full order for tracking
        const orderRes = await request.get(API_ENDPOINTS.CUSTOMER_APP.ORDER_DETAIL(res.data.sale_id));
        if (orderRes.success) {
          setActiveOrder(orderRes.data);
          setActiveView("tracking");
          setCartItems({});
          setAppliedVoucher(null);
        }
      }
    } catch (err) {
      toast.error("Gagal membuat pesanan: " + err.message);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Toggle Favorite Rider
  const handleToggleFavorite = async (riderId) => {
    try {
      const res = await request.post(API_ENDPOINTS.CUSTOMER_APP.TOGGLE_FAVORITE, {
        phone: customerPhone,
        rider_id: riderId,
      });
      if (res.success) {
        toast.success(res.message);
        fetchHistory();
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Submit Rating
  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    if (!ratingModalOrder) return;
    setIsSubmittingRating(true);
    try {
      const res = await request.post(API_ENDPOINTS.RATINGS.SUBMIT(ratingModalOrder.rider_id), {
        rating: ratingScore,
        review: ratingReview,
        sale_id: ratingModalOrder.id,
      });
      if (res.success) {
        toast.success("Terima kasih atas bintang dan ulasan Anda!");
        setRatingModalOrder(null);
        setRatingReview("");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#faf8f5] shadow-2xl flex flex-col font-sans pb-20 relative">
      {/* ===================== VIEW 1: HOME ===================== */}
      {activeView === "home" && (
        <div className="space-y-4 p-4">
          {/* Top Bar Greeting */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-black text-espresso">
                  Hi, {customerName} 👋
                </h1>
                <button
                  type="button"
                  onClick={() => {
                    const next = prompt("Masukkan nama Anda:", customerName);
                    if (next) setCustomerName(next);
                  }}
                  className="text-[10px] text-coffee-600 underline font-semibold"
                >
                  Ubah
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Mau ngopi segar apa hari ini?</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveView("history")}
                className="p-2.5 bg-white border border-amber-200 rounded-2xl shadow-2xs hover:bg-amber-50 transition-colors"
                title="Riwayat Pesanan & Akun"
              >
                <History className="w-5 h-5 text-coffee-700" />
              </button>
            </div>
          </div>

          {/* Big Featured Card: KOPIGO Terdekat */}
          <div className="bg-gradient-to-br from-espresso via-[#3d2b24] to-[#261b17] text-white rounded-3xl p-5 shadow-xl relative overflow-hidden space-y-4">
            <div className="flex items-start justify-between relative z-10">
              <div>
                <span className="text-[11px] font-bold text-coffee-300 uppercase tracking-widest block">
                  RADAR ON-DEMAND
                </span>
                <h2 className="text-2xl font-black mt-1">KOPIGO terdekat</h2>
                <div className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full text-xs font-semibold text-cream-light mt-2 border border-white/15">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>
                    📍 {nearestRider?.distance_formatted || "350 meter"}
                  </span>
                </div>
              </div>

              <div className="w-14 h-14 rounded-2xl bg-coffee-500/30 flex items-center justify-center border border-coffee-400/30">
                <Bike className="w-8 h-8 text-amber-300" />
              </div>
            </div>

            {nearestRider && (
              <div className="text-xs text-cream/80 relative z-10 flex items-center gap-2 border-t border-white/10 pt-3">
                <span className={`w-2 h-2 rounded-full ${nearestRider.is_open ? "bg-emerald-400 animate-pulse" : "bg-gray-400"}`} />
                <span>
                  Rider: <strong>{nearestRider.name}</strong> ({nearestRider.is_open ? "OPEN / Berjualan" : "CLOSED"})
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                if (nearestRider) handleSelectRider(nearestRider);
                else setActiveView("nearby");
              }}
              className="w-full py-3.5 bg-coffee-500 hover:bg-coffee-400 text-espresso font-black rounded-2xl text-sm tracking-wide shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              <span>[ ORDER NOW ]</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Menu Button: Nearby KOPIGO */}
          <div className="bg-white p-4 rounded-3xl border border-amber-100 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-espresso flex items-center gap-2">
                <MapPin className="w-4 h-4 text-coffee-600" />
                <span>Nearby KOPIGO (Gerobak Sekitar)</span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveView("nearby")}
                className="text-xs font-bold text-coffee-600 hover:underline"
              >
                Lihat Semua
              </button>
            </div>

            <div className="space-y-2">
              {loadingRiders ? (
                <LoadingSkeleton rows={2} />
              ) : nearbyRiders.slice(0, 3).map((r) => (
                <div
                  key={r.id}
                  onClick={() => handleSelectRider(r)}
                  className="p-3 bg-amber-50/40 hover:bg-amber-100/50 rounded-2xl border border-amber-200/50 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-200/60 flex items-center justify-center font-black text-espresso">
                      ☕
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-espresso">{r.name}</span>
                        <span className="flex items-center text-[10px] font-bold text-amber-600">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {r.average_rating || 5.0}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500">
                        {r.distance_formatted} • {r.cart_name || "Gerobak Kopi Keliling"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <Badge variant={r.is_open ? "success" : "default"} className="text-[9px]">
                      {r.is_open ? "OPEN" : "CLOSED"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Order Banner if exists */}
          {activeOrder && (
            <div
              onClick={() => setActiveView("tracking")}
              className="bg-coffee-900 text-white p-4 rounded-3xl border border-coffee-800 shadow-md flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
                <div>
                  <span className="text-[10px] text-coffee-300 uppercase font-bold block">Pesanan Sedang Berjalan</span>
                  <span className="text-xs font-bold text-white">
                    #{activeOrder.sale_number} • {activeOrder.order_status?.toUpperCase()}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-amber-300" />
            </div>
          )}
        </div>
      )}

      {/* ===================== VIEW 2: NEARBY KOPIGO ===================== */}
      {activeView === "nearby" && (
        <div className="space-y-4 p-4">
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveView("home")}
              className="p-2 bg-white rounded-xl border border-gray-200 hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4 text-gray-700" />
            </button>
            <h2 className="text-base font-extrabold text-espresso">Nearby KOPIGO (Rider Terdekat)</h2>
          </div>

          <div className="space-y-3">
            {loadingRiders ? (
              <LoadingSkeleton rows={4} />
            ) : nearbyRiders.map((r) => (
              <div
                key={r.id}
                className="bg-white p-4 rounded-3xl border border-amber-100 shadow-2xs space-y-3 hover:border-amber-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-extrabold text-sm text-espresso">{r.name}</h3>
                      <span className="flex items-center text-xs font-bold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded-md">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-0.5" />
                        {r.average_rating || 5.0}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      📍 Jarak: <strong>{r.distance_formatted}</strong> dari Anda
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Unit: {r.cart_code ? `${r.cart_code} - ${r.cart_name}` : "Gerobak Standar"}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <Badge variant={r.is_open ? "success" : "default"} className="text-[10px]">
                      {r.is_open ? "OPEN" : "CLOSED"}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => handleToggleFavorite(r.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500"
                      title="Simpan Rider Favorit"
                    >
                      <Heart className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Available Products in Cart */}
                <div>
                  <span className="text-[11px] font-bold text-gray-500 block mb-1">Produk Tersedia di Gerobak:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(r.available_products || []).length > 0 ? (
                      r.available_products.map((p, idx) => (
                        <span key={idx} className="text-[10px] bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg font-semibold text-coffee-800">
                          {p.product_name} ({p.stock_available})
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-gray-400 italic">Menu lengkap tersedia</span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectRider(r)}
                  className="w-full py-2.5 bg-coffee-600 hover:bg-coffee-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Pesan dari Rider Ini</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== VIEW 3: ORDER WORKFLOW ===================== */}
      {activeView === "order" && (
        <div className="space-y-4 p-4">
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveView("home")}
              className="p-2 bg-white rounded-xl border border-gray-200 hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4 text-gray-700" />
            </button>
            <div>
              <h2 className="text-base font-extrabold text-espresso">Pesan Kopi KOPIGO</h2>
              <p className="text-[11px] text-gray-500">Rider: {selectedRider?.name || "KOPIGO Terdekat"}</p>
            </div>
          </div>

          {/* Pickup Point Selection */}
          <div className="bg-white p-3.5 rounded-2xl border border-amber-100 space-y-1.5">
            <label className="block text-[11px] font-bold text-gray-600">Titik Jemput / Pickup Point</label>
            <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200">
              <MapPin className="w-4 h-4 text-coffee-600 shrink-0" />
              <input
                type="text"
                value={pickupPoint}
                onChange={(e) => setPickupPoint(e.target.value)}
                placeholder="Contoh: Depan Lobi Gedung A"
                className="w-full bg-transparent text-xs outline-hidden font-medium"
              />
            </div>
          </div>

          {/* Products List */}
          <div className="space-y-2">
            <span className="text-xs font-extrabold text-espresso block">Pilih Produk Kopi:</span>
            {availableProducts.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Tidak ada stok yang siap di gerobak rider ini.</p>
            ) : (
              availableProducts.map((p) => {
                const qty = cartItems[p.product_id] || 0;
                return (
                  <div
                    key={p.product_id}
                    className="bg-white p-3 rounded-2xl border border-amber-100 shadow-2xs flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-bold text-xs text-gray-900">{p.product_name}</h4>
                      <p className="text-xs font-black text-coffee-700">{formatRupiah(p.price)}</p>
                      <span className="text-[10px] text-gray-400">Sisa stok: {p.stock_available} cup</span>
                    </div>

                    <div className="flex items-center gap-2 bg-amber-50 p-1 rounded-xl border border-amber-200">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(p.product_id, -1)}
                        className="w-6 h-6 rounded-lg bg-white font-bold text-coffee-700 flex items-center justify-center text-xs shadow-2xs hover:bg-amber-100"
                      >
                        -
                      </button>
                      <span className="w-5 text-center font-extrabold text-xs text-espresso">{qty}</span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(p.product_id, 1)}
                        className="w-6 h-6 rounded-lg bg-coffee-600 font-bold text-white flex items-center justify-center text-xs shadow-2xs hover:bg-coffee-700"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Voucher Section */}
          <div className="bg-white p-3.5 rounded-2xl border border-amber-100 space-y-2">
            <span className="text-xs font-bold text-espresso block">Kupon Voucher Diskon</span>
            <div className="flex gap-2">
              <input
                type="text"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                placeholder="Masukkan kode voucher (e.g. KOPIHEMAT)"
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs uppercase font-mono outline-hidden"
              />
              <button
                type="button"
                onClick={handleApplyVoucher}
                className="px-3.5 py-2 bg-amber-100 hover:bg-amber-200 text-coffee-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Gunakan
              </button>
            </div>
            {appliedVoucher && (
              <div className="flex items-center justify-between text-xs text-emerald-700 font-bold bg-emerald-50 p-2 rounded-xl">
                <span>Voucher {appliedVoucher.code} Terpasang!</span>
                <span>-{formatRupiah(discountAmount)}</span>
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div className="bg-white p-3.5 rounded-2xl border border-amber-100 space-y-2">
            <span className="text-xs font-bold text-espresso block">Metode Pembayaran:</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("qris")}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  paymentMethod === "qris"
                    ? "bg-coffee-600 text-white border-coffee-600 shadow-xs"
                    : "bg-gray-50 text-gray-700 border-gray-200"
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>QRIS Instant</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  paymentMethod === "cash"
                    ? "bg-coffee-600 text-white border-coffee-600 shadow-xs"
                    : "bg-gray-50 text-gray-700 border-gray-200"
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>Tunai / COD</span>
              </button>
            </div>
          </div>

          {/* Customer Contacts & Notes */}
          <div className="bg-white p-3.5 rounded-2xl border border-amber-100 space-y-2 text-xs">
            <span className="font-bold text-espresso block">Data Pemesan:</span>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nama Anda"
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl"
              />
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="No WhatsApp"
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl"
              />
            </div>
            <textarea
              rows={2}
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="Catatan ke rider (e.g. less sugar, sedotan 2)..."
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-hidden"
            />
          </div>

          {/* Checkout Total Bar */}
          <div className="bg-white p-4 rounded-3xl border border-amber-200 shadow-md space-y-3">
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal ({Object.values(cartItems).reduce((a, b) => a + b, 0)} cup):</span>
                <span className="font-semibold text-gray-800">{formatRupiah(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Diskon Voucher:</span>
                  <span>-{formatRupiah(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-espresso pt-2 border-t border-gray-100">
                <span>TOTAL BAYAR:</span>
                <span className="text-coffee-700">{formatRupiah(totalAmount)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmitOrder}
              disabled={isSubmittingOrder || subtotal === 0}
              className="w-full py-3.5 bg-coffee-600 hover:bg-coffee-700 text-white font-extrabold text-sm rounded-2xl shadow-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{isSubmittingOrder ? "Memproses Order..." : "Kirim Pesanan Sekarang"}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ===================== VIEW 4: ORDER TRACKING ===================== */}
      {activeView === "tracking" && activeOrder && (
        <div className="space-y-4 p-4">
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveView("home")}
              className="p-2 bg-white rounded-xl border border-gray-200 hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4 text-gray-700" />
            </button>
            <div>
              <h2 className="text-base font-extrabold text-espresso">Order Tracking</h2>
              <p className="text-[11px] text-gray-500">Nota: #{activeOrder.sale_number}</p>
            </div>
          </div>

          {/* Stepper Status Box */}
          <div className="bg-white p-5 rounded-3xl border border-amber-100 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Status Pesanan</span>
                <span className="font-extrabold text-sm text-coffee-800 uppercase">
                  {activeOrder.order_status === "pending"
                    ? "Order Diterima"
                    : activeOrder.order_status === "accepted"
                    ? "Rider Menerima"
                    : activeOrder.order_status === "brewing"
                    ? "Sedang Dibuat"
                    : "Siap Diambil"}
                </span>
              </div>
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
            </div>

            {/* Visual Stepper */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center text-xs">
                  ✓
                </span>
                <div>
                  <h4 className="font-bold text-xs text-gray-800">Order diterima</h4>
                  <p className="text-[10px] text-gray-400">Sistem telah mencatat pesanan Anda</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full font-bold flex items-center justify-center text-xs ${
                  activeOrder.tracking_step >= 2 ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-500"
                }`}>
                  {activeOrder.tracking_step >= 2 ? "✓" : "2"}
                </span>
                <div>
                  <h4 className="font-bold text-xs text-gray-800">Rider menerima</h4>
                  <p className="text-[10px] text-gray-400">Rider {activeOrder.rider_name || ""} siap melayani</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full font-bold flex items-center justify-center text-xs ${
                  activeOrder.tracking_step >= 3 ? "bg-amber-500 text-white animate-pulse" : "bg-gray-200 text-gray-500"
                }`}>
                  {activeOrder.tracking_step >= 3 ? "●" : "3"}
                </span>
                <div>
                  <h4 className="font-bold text-xs text-gray-800">Sedang dibuat</h4>
                  <p className="text-[10px] text-gray-400">Kopi segar sedang diracik di gerobak</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full font-bold flex items-center justify-center text-xs ${
                  activeOrder.tracking_step >= 4 ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-500"
                }`}>
                  {activeOrder.tracking_step >= 4 ? "✓" : "○"}
                </span>
                <div>
                  <h4 className="font-bold text-xs text-gray-800">Siap diambil</h4>
                  <p className="text-[10px] text-gray-400">Silakan temui rider di titik jemput</p>
                </div>
              </div>
            </div>

            {/* Rider Info Card */}
            <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200/60 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-gray-500 font-bold block uppercase">Rider KOPIGO</span>
                <span className="font-bold text-espresso">{activeOrder.rider_name || "Rider KOPIGO"}</span>
                {activeOrder.rider_phone && (
                  <p className="text-[11px] text-gray-600">{activeOrder.rider_phone}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setRatingModalOrder(activeOrder)}
                className="px-3 py-1.5 bg-coffee-600 hover:bg-coffee-700 text-white font-bold text-[11px] rounded-xl transition-colors"
              >
                Beri Rating ⭐
              </button>
            </div>

            {/* Order Items Breakdown */}
            <div className="border-t border-gray-100 pt-3 space-y-1.5 text-xs">
              <span className="font-bold text-gray-700 block">Rincian Item Kopi:</span>
              {(activeOrder.items || []).map((it, idx) => (
                <div key={idx} className="flex justify-between text-gray-600">
                  <span>{it.qty}x {it.product_name}</span>
                  <span className="font-semibold text-gray-800">{formatRupiah(it.subtotal)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-black text-espresso pt-2 border-t border-dashed border-gray-200">
                <span>Total:</span>
                <span className="text-coffee-700">{formatRupiah(activeOrder.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== VIEW 5: HISTORY & FAVORITES ===================== */}
      {activeView === "history" && (
        <div className="space-y-4 p-4">
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveView("home")}
              className="p-2 bg-white rounded-xl border border-gray-200 hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4 text-gray-700" />
            </button>
            <h2 className="text-base font-extrabold text-espresso">Riwayat & Akun Saya</h2>
          </div>

          {/* Customer Summary Card */}
          <div className="bg-white p-4 rounded-3xl border border-amber-100 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-base text-espresso">{customerName}</h3>
                <p className="text-xs text-gray-500">{customerPhone}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Loyalty Points</span>
                <span className="text-lg font-black text-amber-600 flex items-center justify-end gap-1">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  {customerStats?.loyalty_points || 0} Pts
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-100">
              <div>
                <span className="text-[10px] text-gray-400 block uppercase font-bold">Total Transaksi</span>
                <span className="font-bold text-gray-800">{formatRupiah(customerStats?.total_spend || 0)}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block uppercase font-bold">Total Pesanan</span>
                <span className="font-bold text-gray-800">{orderHistory.length} kali</span>
              </div>
            </div>
          </div>

          {/* Rider Favorite / Top Rider */}
          <div className="bg-white p-4 rounded-3xl border border-amber-100 shadow-2xs space-y-3">
            <h3 className="font-extrabold text-xs text-espresso uppercase tracking-wider flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>Rider Favorit / Langganan</span>
            </h3>

            {favoriteRiders.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Belum ada rider favorit tersimpan.</p>
            ) : (
              <div className="space-y-2">
                {favoriteRiders.map((fr) => (
                  <div key={fr.id} className="p-3 bg-amber-50/50 rounded-2xl border border-amber-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-black text-espresso block">⭐ {fr.name}</span>
                      <span className="text-[10px] text-gray-500">📍 Sekitar Anda</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectRider(fr)}
                      className="px-3 py-1.5 bg-coffee-600 text-white font-bold text-[10px] rounded-xl"
                    >
                      Pesan Ulang
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Previous Orders */}
          <div className="space-y-2.5">
            <span className="text-xs font-extrabold text-espresso uppercase tracking-wider block">
              Pesanan Sebelumnya
            </span>

            {loadingHistory ? (
              <LoadingSkeleton rows={3} />
            ) : orderHistory.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-4 text-center">Belum ada riwayat pesanan.</p>
            ) : (
              orderHistory.map((ord) => (
                <div key={ord.id} className="bg-white p-4 rounded-3xl border border-amber-100 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-espresso">#{ord.sale_number}</span>
                    <span className="text-[10px] text-gray-400">{formatDateIndo(ord.sale_date)}</span>
                  </div>

                  {/* Items list */}
                  <div className="text-xs text-gray-700 space-y-0.5">
                    {(ord.items || []).map((it, idx) => (
                      <div key={idx} className="flex justify-between text-[11px]">
                        <span>{it.qty}x {it.product_name}</span>
                        <span className="font-semibold">{formatRupiah(it.subtotal)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                    <span className="font-bold text-coffee-700">{formatRupiah(ord.total_amount)}</span>
                    <button
                      type="button"
                      onClick={() => setRatingModalOrder(ord)}
                      className="text-[11px] text-amber-600 font-bold hover:underline"
                    >
                      Beri Penilaian ⭐
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ===================== BOTTOM NAV BAR ===================== */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-amber-100 px-6 py-2.5 flex items-center justify-around z-30 shadow-lg">
        <button
          type="button"
          onClick={() => setActiveView("home")}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold cursor-pointer ${
            activeView === "home" ? "text-coffee-600" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <Coffee className="w-5 h-5" />
          <span>Home</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView("nearby")}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold cursor-pointer ${
            activeView === "nearby" ? "text-coffee-600" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <MapPin className="w-5 h-5" />
          <span>Nearby</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView("history")}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold cursor-pointer ${
            activeView === "history" ? "text-coffee-600" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <History className="w-5 h-5" />
          <span>Pesanan Saya</span>
        </button>
      </div>

      {/* ===================== MODAL: RATING RIDER ===================== */}
      {ratingModalOrder && (
        <Modal
          isOpen={!!ratingModalOrder}
          onClose={() => setRatingModalOrder(null)}
          title={`Nilai Rider: ${ratingModalOrder.rider_name || "KOPIGO"}`}
          maxWidth="max-w-sm"
        >
          <form onSubmit={handleRatingSubmit} className="space-y-4">
            <p className="text-xs text-gray-600 text-center">
              Bagaimana pengalaman Anda menikmati kopi dari pesanan #{ratingModalOrder.sale_number}?
            </p>

            {/* Stars Picker */}
            <div className="flex justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setRatingScore(s)}
                  className="p-1 cursor-pointer transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      s <= ratingScore ? "fill-amber-400 text-amber-400" : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Ulasan Anda (Opsional)</label>
              <textarea
                rows={3}
                value={ratingReview}
                onChange={(e) => setRatingReview(e.target.value)}
                placeholder="Rasa kopi mantap, pelayanan cepat dan ramah..."
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-hidden focus:ring-2 focus:ring-coffee-400"
              />
            </div>

            <div className="flex gap-2.5 pt-3 border-t border-gray-100 justify-end">
              <button
                type="button"
                onClick={() => setRatingModalOrder(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-gray-200 hover:bg-gray-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmittingRating}
                className="px-4 py-2 text-xs font-bold text-white bg-coffee-600 hover:bg-coffee-700 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmittingRating ? "Mengirim..." : "Kirim Penilaian"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
