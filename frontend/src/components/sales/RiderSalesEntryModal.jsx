import React, { useState, useEffect } from "react";
import {
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Bike,
  Calendar,
  Search,
  Coffee,
  Phone,
  PhoneOff,
  X,
  CreditCard,
  Banknote,
  QrCode,
  Maximize2,
} from "lucide-react";
import Modal from "../common/Modal";
import QrisModal from "../common/QrisModal";
import { formatRupiah } from "../../utils/formatters";
import { getImageUrl } from "../../utils/api";

export default function RiderSalesEntryModal({
  isOpen,
  onClose,
  riders = [],
  products = [],
  onSubmit,
  isLoading = false,
  preselectedRiderId = null,
  storeSettings = null,
}) {
  const [riderId, setRiderId] = useState(preselectedRiderId || "");
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [isQrisModalOpen, setIsQrisModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRiderId(preselectedRiderId || (riders.length > 0 ? String(riders[0].id) : ""));
      setSaleDate(new Date().toISOString().split("T")[0]);
      setPaymentMethod("cash");
      setNotes("");
      setSelectedItems([]);
      setProductSearch("");
      setActiveCategory("all");
    }
  }, [isOpen, preselectedRiderId, riders]);

  const currentRider = riders.find((r) => String(r.id) === String(riderId));

  // Extract unique categories from products
  const categories = ["all", ...new Set(products.map((p) => p.category_name).filter(Boolean))];

  // Filter products by search and category
  const filteredProducts = products.filter((p) => {
    const matchSearch =
      !productSearch ||
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase()));
    const matchCat = activeCategory === "all" || p.category_name === activeCategory;
    return matchSearch && matchCat;
  });

  const handleAddItem = (product) => {
    setSelectedItems((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product_id === product.id
            ? { ...i, qty: i.qty + 1, subtotal: (i.qty + 1) * i.price }
            : i
        );
      } else {
        return [
          ...prev,
          {
            product_id: product.id,
            product_name: product.name,
            price: Number(product.price),
            qty: 1,
            subtotal: Number(product.price),
          },
        ];
      }
    });
  };

  const handleUpdateQty = (productId, newQty) => {
    if (newQty <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setSelectedItems((prev) =>
      prev.map((i) =>
        i.product_id === productId
          ? { ...i, qty: newQty, subtotal: newQty * i.price }
          : i
      )
    );
  };

  const handleRemoveItem = (productId) => {
    setSelectedItems((prev) => prev.filter((i) => i.product_id !== productId));
  };

  const totalAmount = selectedItems.reduce((acc, item) => acc + item.subtotal, 0);
  const totalCups = selectedItems.reduce((acc, item) => acc + item.qty, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!riderId) return;
    if (selectedItems.length === 0) return;

    onSubmit({
      rider_id: Number(riderId),
      sale_date: saleDate,
      sales_channel: "rider",
      input_source: currentRider?.has_app_access ? "rider" : "admin",
      items: selectedItems,
      total_amount: totalAmount,
      paid_amount: totalAmount,
      payment_method: paymentMethod,
      notes: notes || `Catatan penjualan fisik Rider ${currentRider?.name || ""}`,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Input Catatan Sales Rider"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Step 1: Rider & Tanggal (Clean Card) */}
        <div className="bg-[#fcfaf7] p-3.5 sm:p-4 rounded-2xl border border-amber-200/80 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-espresso uppercase tracking-wider mb-1">
                Pilih Rider Penjual *
              </label>
              <select
                value={riderId}
                onChange={(e) => setRiderId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold text-espresso focus:ring-2 focus:ring-coffee-400 focus:border-coffee-500 outline-hidden shadow-2xs"
              >
                <option value="" disabled>-- Pilih Rider --</option>
                {riders.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.code} - {r.name} {r.has_app_access ? "(📱 Ada HP)" : "(📝 Tanpa HP)"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-espresso uppercase tracking-wider mb-1">
                Tanggal Penjualan Aktual *
              </label>
              <input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-medium text-espresso focus:ring-2 focus:ring-coffee-400 outline-hidden shadow-2xs"
              />
            </div>
          </div>

          {currentRider && (
            <div className="flex items-center gap-2 pt-2 border-t border-amber-200/60 text-xs">
              <span className="text-gray-500 font-medium">Status Rider:</span>
              {currentRider.has_app_access ? (
                <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 text-[11px]">
                  <Phone className="w-3 h-3" /> Punya HP (Input Mandiri)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300 text-[11px]">
                  <PhoneOff className="w-3 h-3" /> Tanpa HP (Diinput Manual oleh Kasir)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Product Picker (Search + Clean Grid) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-espresso uppercase tracking-wider">
              Pilih Menu Kopi (Klik untuk Tambah)
            </label>
            <span className="text-[11px] text-gray-500 font-medium">
              {filteredProducts.length} menu tersedia
            </span>
          </div>

          {/* Search bar inside picker */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Cari kopi, espresso, donat..."
              className="w-full pl-8 pr-8 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-espresso focus:bg-white focus:ring-2 focus:ring-coffee-400 outline-hidden"
            />
            {productSearch && (
              <button
                type="button"
                onClick={() => setProductSearch("")}
                className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Product Items List - Clean, neat, responsive */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1 bg-gray-50/70 rounded-xl border border-gray-200">
            {filteredProducts.map((p) => {
              const countInOrder = selectedItems.find((i) => i.product_id === p.id)?.qty || 0;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleAddItem(p)}
                  className={`p-2 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                    countInOrder > 0
                      ? "border-coffee-500 bg-amber-50 text-coffee-950 ring-1 ring-coffee-400"
                      : "border-gray-200 bg-white hover:border-coffee-300 hover:bg-cream-light/30 text-gray-800"
                  }`}
                >
                  <div className="pr-4">
                    <p className="font-bold text-xs leading-tight line-clamp-1 text-espresso">
                      {p.name}
                    </p>
                    <span className="text-[11px] font-extrabold text-coffee-700 mt-1 block">
                      {formatRupiah(p.price)}
                    </span>
                  </div>

                  {countInOrder > 0 ? (
                    <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-coffee-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {countInOrder}
                    </span>
                  ) : (
                    <span className="absolute top-2 right-2 text-gray-400 group-hover:text-coffee-600">
                      <Plus className="w-3.5 h-3.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: Daftar Penjualan (Clean 2-Row layout that NEVER squishes or overlaps!) */}
        <div className="bg-white rounded-2xl border border-amber-200/80 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h4 className="text-xs font-bold text-espresso uppercase tracking-wider flex items-center gap-1.5">
              <span>Pesanan Tercatat</span>
              <span className="px-2 py-0.5 bg-coffee-100 text-coffee-800 rounded-full text-[10px] font-extrabold">
                {totalCups} cup
              </span>
            </h4>
            {selectedItems.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedItems([])}
                className="text-[11px] text-red-500 hover:text-red-700 font-semibold"
              >
                Reset Semua
              </button>
            )}
          </div>

          {selectedItems.length === 0 ? (
            <div className="py-4 text-center text-xs text-gray-400">
              Belum ada item. Klik produk di atas untuk menambahkan.
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {selectedItems.map((item) => (
                <div
                  key={item.product_id}
                  className="p-2.5 bg-cream-light/40 border border-gray-200 rounded-xl space-y-1.5"
                >
                  {/* Row 1: Product Name & Delete */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-espresso line-clamp-1 flex-1">
                      {item.product_name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.product_id)}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Row 2: Price per unit on left, Stepper & Subtotal on right */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100/80">
                    <span className="text-[11px] text-gray-500">
                      @ {formatRupiah(item.price)}
                    </span>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-gray-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.product_id, item.qty - 1)}
                          className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-bold text-xs text-espresso">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.product_id, item.qty + 1)}
                          className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="font-extrabold text-xs text-coffee-800 min-w-[70px] text-right">
                        {formatRupiah(item.subtotal)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Subtotal Display */}
          {selectedItems.length > 0 && (
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs sm:text-sm font-extrabold text-espresso">
              <span>Total Omzet Penjualan:</span>
              <span className="text-coffee-700 text-sm sm:text-base font-black">
                {formatRupiah(totalAmount)}
              </span>
            </div>
          )}
        </div>

        {/* Step 4: Metode Setoran & Catatan (Clean Form) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-espresso uppercase tracking-wider mb-1">
              Metode Setoran
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-semibold text-espresso focus:ring-2 focus:ring-coffee-400 outline-hidden"
            >
              <option value="cash">Tunai (Cash)</option>
              <option value="transfer">Transfer Bank</option>
              <option value="qris">QRIS</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-espresso uppercase tracking-wider mb-1">
              Catatan Rider / Rute (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Rute Senayan sore hari"
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-espresso focus:ring-2 focus:ring-coffee-400 outline-hidden"
            />
          </div>
        </div>

        {/* QRIS Quick Visual & Interactive Scanner if selected */}
        {paymentMethod === "qris" && (
          <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {storeSettings?.qris_image ? (
                <img
                  src={getImageUrl(storeSettings.qris_image)}
                  alt="QRIS"
                  className="w-12 h-12 object-contain bg-white p-1 rounded-lg border border-amber-200 shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                  <QrCode className="w-5 h-5" />
                </div>
              )}
              <div className="text-[11px] text-gray-700">
                <span className="font-bold text-coffee-800 block">QRIS Pembayaran Digital</span>
                <span className="text-gray-500">Tampilkan barcode agar pembeli bisa langsung scan</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsQrisModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-coffee-700 hover:bg-coffee-800 text-cream-light text-[11px] font-bold flex items-center gap-1.5 shrink-0 shadow-xs transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" /> Buka Layar QRIS
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2.5 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 px-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 font-semibold text-xs sm:text-sm transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isLoading || selectedItems.length === 0 || !riderId}
            className="flex-1 py-2.5 px-3 rounded-xl bg-coffee-600 hover:bg-coffee-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-coffee-950/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Simpan Transaksi
              </>
            )}
          </button>
        </div>
      </form>

      {/* Interactive Fullscreen QRIS Modal for Rider */}
      <QrisModal
        isOpen={isQrisModalOpen}
        onClose={() => setIsQrisModalOpen(false)}
        storeSettings={storeSettings}
        amount={selectedItems.reduce((sum, item) => sum + item.subtotal, 0)}
        title="QRIS Pembayaran Transaksi Rider"
      />
    </Modal>
  );
}
