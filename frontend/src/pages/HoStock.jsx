import React, { useState, useEffect } from "react";
import {
  Package,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Coffee,
  Boxes,
  Sparkles,
} from "lucide-react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import { formatRupiah } from "../utils/formatters";
import { getImageUrl } from "../utils/api";
import { useDebounce } from "../hooks/useDebounce";
import SearchInput from "../components/common/SearchInput";
import Badge from "../components/common/Badge";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import toast from "react-hot-toast";

export default function HoStock() {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({
    total_products: 0,
    available_count: 0,
    low_count: 0,
    out_count: 0,
    total_ho_units: 0,
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStockStatus, setSelectedStockStatus] = useState("all");

  const fetchCategories = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.CATEGORIES.LIST, { limit: 100, status: "active" });
      if (res.success) {
        setCategories(res.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStockData = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.PRODUCTS.STOCK_HO, {
        search: debouncedSearch,
        category_id: selectedCategory !== "all" ? selectedCategory : undefined,
        stock_status: selectedStockStatus !== "all" ? selectedStockStatus : undefined,
      });

      if (res.success && res.data) {
        setItems(res.data.items || []);
        setSummary(res.data.summary || {});
      }
    } catch (err) {
      toast.error("Gagal memuat data stok HO: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchStockData();
  }, [debouncedSearch, selectedCategory, selectedStockStatus]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-black text-espresso">
              Katalog & Sisa Stok Gudang HO
            </h1>
            <Badge variant="coffee">Live Inventory</Badge>
          </div>
          <p className="text-xs sm:text-sm text-gray-500">
            Cek ketersediaan cup dan bahan kopi di Head Office (HO) sebelum memutuskan untuk refill stok keliling.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchStockData}
          disabled={loading}
          className="px-3.5 py-2.5 bg-white hover:bg-gray-50 text-coffee-800 border border-amber-200/80 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Segarkan Stok</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-amber-200/70 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-coffee-50 text-coffee-700 flex items-center justify-center shrink-0">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Total Unit di HO
            </span>
            <span className="text-xl font-black text-espresso">
              {Number(summary.total_ho_units || 0).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Stok Tersedia
            </span>
            <span className="text-xl font-black text-emerald-700">
              {summary.available_count || 0} Menu
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Stok Menipis
            </span>
            <span className="text-xl font-black text-amber-700">
              {summary.low_count || 0} Menu
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Stok Habis
            </span>
            <span className="text-xl font-black text-rose-600">
              {summary.out_count || 0} Menu
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex-1 max-w-md">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Cari nama produk kopi / SKU..."
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-hidden"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Stock Status Filter */}
          <select
            value={selectedStockStatus}
            onChange={(e) => setSelectedStockStatus(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-hidden"
          >
            <option value="all">Semua Kondisi Stok</option>
            <option value="available">Hanya Tersedia (Aman)</option>
            <option value="low">Menipis (&lt;= Minimum)</option>
            <option value="out">Habis (Kosong)</option>
          </select>
        </div>
      </div>

      {/* Product Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <LoadingSkeleton rows={4} />
          <LoadingSkeleton rows={4} />
          <LoadingSkeleton rows={4} />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-3xl border border-amber-200/80 py-16 px-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <Package className="w-7 h-7" />
          </div>
          <h4 className="font-bold text-gray-800 text-sm">Produk Tidak Ditemukan</h4>
          <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
            Tidak ada produk yang cocok dengan pencarian atau filter stok yang dipilih.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((prod) => {
            const isOut = prod.stock_ho <= 0;
            const isLow = prod.stock_ho > 0 && prod.stock_ho <= prod.min_stock;

            return (
              <div
                key={prod.id}
                className={`bg-white rounded-2xl border transition-all overflow-hidden flex flex-col justify-between shadow-xs ${
                  isOut
                    ? "border-rose-200 bg-rose-50/20"
                    : isLow
                    ? "border-amber-300 bg-amber-50/20"
                    : "border-amber-200/70 hover:border-coffee-400 hover:shadow-md"
                }`}
              >
                <div>
                  {/* Top Image / Banner */}
                  <div className="relative h-36 bg-cream-light flex items-center justify-center overflow-hidden border-b border-gray-100">
                    {prod.image ? (
                      <img
                        src={getImageUrl(prod.image)}
                        alt={prod.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-coffee-300 flex flex-col items-center">
                        <Coffee className="w-10 h-10 opacity-40" />
                        <span className="text-[10px] font-bold text-gray-400 mt-1">Kopi Nusantara</span>
                      </div>
                    )}

                    {/* Stock Status Floating Badge */}
                    <div className="absolute top-2.5 right-2.5">
                      {isOut ? (
                        <span className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Habis di HO
                        </span>
                      ) : isLow ? (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Stok Menipis
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Siap Refill
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      {prod.category_name} • {prod.sku}
                    </span>
                    <h3 className="font-extrabold text-sm text-espresso leading-snug line-clamp-1">
                      {prod.name}
                    </h3>
                    <div className="text-xs font-bold text-coffee-700">
                      {formatRupiah(prod.price)}
                    </div>
                  </div>
                </div>

                {/* Stock Indicator Bar & Number */}
                <div className="p-4 pt-0">
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-500">Sisa di Gudang HO:</span>
                      <span
                        className={`font-black text-sm ${
                          isOut ? "text-rose-600" : isLow ? "text-amber-700" : "text-emerald-700"
                        }`}
                      >
                        {prod.stock_ho} {prod.unit || "cup"}
                      </span>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isOut ? "bg-rose-500 w-0" : isLow ? "bg-amber-500 w-1/4" : "bg-emerald-500 w-3/4"
                        }`}
                      />
                    </div>

                    <div className="text-[10px] text-gray-400 text-right">
                      Batas min: {prod.min_stock} {prod.unit}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
