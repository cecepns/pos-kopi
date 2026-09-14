import React, { useState, useEffect } from "react";
import { Search, ShoppingBag, Filter, RefreshCw, X } from "lucide-react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import { useCart } from "../context/CartContext";
import { useDebounce } from "../hooks/useDebounce";
import ProductCard from "../components/pos/ProductCard";
import CartDrawer from "../components/pos/CartDrawer";
import PaymentModal from "../components/pos/PaymentModal";
import ReceiptModal from "../components/pos/ReceiptModal";
import SearchInput from "../components/common/SearchInput";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import toast from "react-hot-toast";

export default function PosCashier() {
  const {
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalAmount,
    totalItemsCount,
  } = useCart();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [riders, setRiders] = useState([]);
  const [storeSettings, setStoreSettings] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mobile cart drawer state
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Fetch products and categories
  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, riderRes, settingsRes] = await Promise.all([
        request.get(API_ENDPOINTS.PRODUCTS.LIST, {
          limit: 100,
          search: debouncedSearch,
          category_id: selectedCategory || undefined,
          status: "active",
        }),
        request.get(API_ENDPOINTS.CATEGORIES.LIST, { limit: 50, status: "active" }),
        request.get(API_ENDPOINTS.RIDERS.ACTIVE_LIST),
        request.get(API_ENDPOINTS.SETTINGS.GET),
      ]);

      if (prodRes.success) setProducts(prodRes.data || []);
      if (catRes.success) setCategories(catRes.data || []);
      if (riderRes.success) setRiders(riderRes.data || []);
      if (settingsRes.success) setStoreSettings(settingsRes.data || null);
    } catch (err) {
      toast.error("Gagal memuat data POS: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [debouncedSearch, selectedCategory]);

  const handleCheckout = async (paymentData) => {
    if (cartItems.length === 0) {
      toast.error("Keranjang belanja masih kosong!");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        sales_channel: paymentData.rider_id ? "rider" : "counter",
        input_source: "operator",
        rider_id: paymentData.rider_id || null,
        payment_method: paymentData.payment_method,
        paid_amount: paymentData.paid_amount,
        notes: paymentData.notes,
        sale_date: new Date().toISOString().split("T")[0],
        items: cartItems.map((item) => ({
          product_id: item.product_id,
          product_name: item.name,
          price: item.price,
          qty: item.qty,
        })),
      };

      const res = await request.post(API_ENDPOINTS.SALES.CREATE, payload);

      if (res.success && res.data) {
        toast.success("Transaksi berhasil dibuat!");
        setLastTransaction(res.data);
        clearCart();
        setIsPaymentOpen(false);
        setIsMobileCartOpen(false);
        setIsReceiptOpen(true); // Open receipt modal for printing
      } else {
        toast.error(res.message || "Gagal membuat transaksi");
      }
    } catch (err) {
      toast.error(err.message || "Terjadi kesalahan saat transaksi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] lg:h-[calc(100vh-5.5rem)] flex flex-col lg:flex-row gap-4 pb-20 lg:pb-0">
      {/* Left Area: Catalog, Filters, Search */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Search & Category Header */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-amber-100 shadow-xs mb-3 sm:mb-4 space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Cari menu kopi, latte, donat..."
              className="w-full sm:max-w-md"
            />
            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium self-end sm:self-auto">
              <span>{products.length} Menu</span>
              <button
                type="button"
                onClick={fetchData}
                title="Muat Ulang Menu"
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-amber-50 text-gray-600 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategory("")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === ""
                  ? "bg-coffee-600 text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Semua Menu
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? "bg-coffee-600 text-white shadow-xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          {loading ? (
            <LoadingSkeleton type="card" rows={8} />
          ) : products.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
              <ShoppingBag className="w-10 h-10 mb-2 text-amber-200" />
              <p className="font-semibold text-sm text-gray-600">Tidak ada produk ditemukan</p>
              <p className="text-xs text-gray-400 mt-1">
                Coba ubah kata kunci pencarian atau kategori.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5">
              {products.map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  onAddToCart={addToCart}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Area: Cart Drawer (Desktop) */}
      <div className="hidden lg:block w-96 shrink-0 h-full">
        <CartDrawer
          cartItems={cartItems}
          onUpdateQty={updateQuantity}
          onRemoveItem={removeFromCart}
          onClearCart={clearCart}
          totalAmount={totalAmount}
          totalItemsCount={totalItemsCount}
          onOpenPayment={() => setIsPaymentOpen(true)}
        />
      </div>

      {/* Mobile Floating Cart Button */}
      <div className="lg:hidden fixed bottom-4 left-4 right-4 z-20">
        {cartItems.length > 0 && !isMobileCartOpen && (
          <button
            type="button"
            onClick={() => setIsMobileCartOpen(true)}
            className="w-full py-3.5 px-5 bg-coffee-600 hover:bg-coffee-700 text-white font-bold rounded-2xl shadow-xl flex items-center justify-between border border-white/20 active:scale-98 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-white text-coffee-800 text-xs flex items-center justify-center font-extrabold shadow-xs">
                {totalItemsCount}
              </span>
              <span className="text-xs sm:text-sm font-bold">Lihat Pesanan ({totalItemsCount} item)</span>
            </div>
            <span className="text-sm sm:text-base font-black tracking-tight">{formatRupiah(totalAmount)}</span>
          </button>
        )}
      </div>

      {/* Mobile Cart Modal Drawer */}
      {isMobileCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end lg:hidden">
          <div
            className="fixed inset-0"
            onClick={() => setIsMobileCartOpen(false)}
          />
          <div className="relative w-full max-h-[85vh] bg-white rounded-t-3xl overflow-hidden flex flex-col shadow-2xl z-10">
            <div className="p-3 border-b border-gray-100 flex justify-end bg-[#fdfaf7]">
              <button
                type="button"
                onClick={() => setIsMobileCartOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden p-3">
              <CartDrawer
                cartItems={cartItems}
                onUpdateQty={updateQuantity}
                onRemoveItem={removeFromCart}
                onClearCart={clearCart}
                totalAmount={totalAmount}
                totalItemsCount={totalItemsCount}
                onOpenPayment={() => {
                  setIsMobileCartOpen(false);
                  setIsPaymentOpen(true);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        totalAmount={totalAmount}
        riders={riders}
        onSubmitPayment={handleCheckout}
        isLoading={isSubmitting}
        storeSettings={storeSettings}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        transaction={lastTransaction}
        storeSettings={storeSettings}
      />
    </div>
  );
}
