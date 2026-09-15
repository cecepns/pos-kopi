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
  Bike,
  Plus,
  ArrowRightLeft,
  Trash2,
  Download,
  AlertOctagon,
  Calendar,
  RotateCcw,
  User,
  Layers,
} from "lucide-react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import { formatRupiah, formatDateIndo } from "../utils/formatters";
import { exportToExcel } from "../utils/excel";
import { useDebounce } from "../hooks/useDebounce";
import { useAuth } from "../hooks/useAuth";
import SearchInput from "../components/common/SearchInput";
import Badge from "../components/common/Badge";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import ProductAvatar from "../components/common/ProductAvatar";
import Modal from "../components/common/Modal";
import ConfirmDialog from "../components/common/ConfirmDialog";
import Pagination from "../components/common/Pagination";
import toast from "react-hot-toast";

export default function HoStock() {
  const { user, isOwner, isAdmin, isRider } = useAuth();
  const canManage = isOwner || isAdmin;

  // Active Tab: 'ho' | 'rider' | 'reject'
  const [activeTab, setActiveTab] = useState("ho");

  // ==========================================
  // TAB 1: STOK GUDANG HO
  // ==========================================
  const [hoItems, setHoItems] = useState([]);
  const [hoSummary, setHoSummary] = useState({
    total_products: 0,
    available_count: 0,
    low_count: 0,
    out_count: 0,
    total_ho_units: 0,
  });
  const [categories, setCategories] = useState([]);
  const [loadingHo, setLoadingHo] = useState(true);
  const [searchHo, setSearchHo] = useState("");
  const debouncedSearchHo = useDebounce(searchHo, 300);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStockStatus, setSelectedStockStatus] = useState("all");

  // ==========================================
  // TAB 2: ALOKASI & SISA STOK RIDER
  // ==========================================
  const [riderStockItems, setRiderStockItems] = useState([]);
  const [riderStockSummary, setRiderStockSummary] = useState({
    total_allocated: 0,
    total_sold: 0,
    total_reject: 0,
    total_returned: 0,
    total_remaining: 0,
  });
  const [loadingRiderStock, setLoadingRiderStock] = useState(false);
  const [riderStockDate, setRiderStockDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedRiderFilter, setSelectedRiderFilter] = useState("");
  const [searchRiderStock, setSearchRiderStock] = useState("");
  const debouncedSearchRiderStock = useDebounce(searchRiderStock, 300);
  const [pageRiderStock, setPageRiderStock] = useState(1);
  const [limitRiderStock, setLimitRiderStock] = useState(10);
  const [totalRiderStock, setTotalRiderStock] = useState(0);
  const [totalPagesRiderStock, setTotalPagesRiderStock] = useState(1);

  // ==========================================
  // TAB 3: BARANG REJECT
  // ==========================================
  const [rejectItems, setRejectItems] = useState([]);
  const [totalRejectUnits, setTotalRejectUnits] = useState(0);
  const [loadingRejects, setLoadingRejects] = useState(false);
  const [rejectDateFilter, setRejectDateFilter] = useState("");
  const [rejectReasonFilter, setRejectReasonFilter] = useState("");
  const [rejectSourceFilter, setRejectSourceFilter] = useState("all");
  const [searchReject, setSearchReject] = useState("");
  const debouncedSearchReject = useDebounce(searchReject, 300);
  const [pageReject, setPageReject] = useState(1);
  const [limitReject, setLimitReject] = useState(10);
  const [totalRejects, setTotalRejects] = useState(0);
  const [totalPagesReject, setTotalPagesReject] = useState(1);

  // Common Metadata
  const [activeRiders, setActiveRiders] = useState([]);
  const [activeProducts, setActiveProducts] = useState([]);

  // ==========================================
  // MODALS STATE
  // ==========================================
  // 1. Restock HO Modal
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [restockData, setRestockData] = useState({
    product_id: "",
    qty: "",
    notes: "",
  });
  const [isSubmittingRestock, setIsSubmittingRestock] = useState(false);

  // 2. Allocate to Rider Modal
  const [isAllocateOpen, setIsAllocateOpen] = useState(false);
  const [allocateData, setAllocateData] = useState({
    rider_id: "",
    stock_date: new Date().toISOString().split("T")[0],
    product_id: "",
    qty: "",
    notes: "",
  });
  const [isSubmittingAllocate, setIsSubmittingAllocate] = useState(false);

  // 3. Reject Stock Modal
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectFormData, setRejectFormData] = useState({
    source: "rider", // 'rider' | 'ho'
    rider_id: "",
    product_id: "",
    reject_date: new Date().toISOString().split("T")[0],
    qty: 1,
    reason: "bocor",
    notes: "",
  });
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  // 4. Return to HO Confirm Dialog
  const [returnTarget, setReturnTarget] = useState(null);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  // ==========================================
  // FETCH FUNCTIONS
  // ==========================================
  const fetchMetadata = async () => {
    try {
      const [catRes, riderRes, prodRes] = await Promise.all([
        request.get(API_ENDPOINTS.CATEGORIES.LIST, { limit: 100, status: "active" }),
        request.get(API_ENDPOINTS.RIDERS.ACTIVE_LIST),
        request.get(API_ENDPOINTS.PRODUCTS.LIST, { limit: 200, status: "active" }),
      ]);
      if (catRes.success) setCategories(catRes.data || []);
      if (riderRes.success) setActiveRiders(riderRes.data || []);
      if (prodRes.success) setActiveProducts(prodRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHoStockData = async () => {
    setLoadingHo(true);
    try {
      const res = await request.get(API_ENDPOINTS.PRODUCTS.STOCK_HO, {
        search: debouncedSearchHo,
        category_id: selectedCategory !== "all" ? selectedCategory : undefined,
        stock_status: selectedStockStatus !== "all" ? selectedStockStatus : undefined,
      });
      if (res.success && res.data) {
        setHoItems(res.data.items || []);
        setHoSummary(res.data.summary || {});
      }
    } catch (err) {
      toast.error("Gagal memuat stok HO: " + err.message);
    } finally {
      setLoadingHo(false);
    }
  };

  const fetchRiderStocks = async () => {
    setLoadingRiderStock(true);
    try {
      const res = await request.get(API_ENDPOINTS.STOCKS.RIDER_STOCKS, {
        page: pageRiderStock,
        limit: limitRiderStock,
        search: debouncedSearchRiderStock,
        date: riderStockDate || undefined,
        rider_id: selectedRiderFilter || undefined,
      });
      if (res.success && res.data) {
        setRiderStockItems(res.data.items || []);
        setRiderStockSummary(res.data.summary || {});
        if (res.pagination) {
          setTotalRiderStock(res.pagination.total);
          setTotalPagesRiderStock(res.pagination.totalPages);
        }
      }
    } catch (err) {
      toast.error("Gagal memuat stok rider: " + err.message);
    } finally {
      setLoadingRiderStock(false);
    }
  };

  const fetchRejects = async () => {
    setLoadingRejects(true);
    try {
      const res = await request.get(API_ENDPOINTS.STOCKS.REJECTS_LIST, {
        page: pageReject,
        limit: limitReject,
        search: debouncedSearchReject,
        date: rejectDateFilter || undefined,
        reason: rejectReasonFilter || undefined,
        source: rejectSourceFilter !== "all" ? rejectSourceFilter : undefined,
      });
      if (res.success && res.data) {
        setRejectItems(res.data.items || []);
        setTotalRejectUnits(res.data.total_reject_units || 0);
        if (res.pagination) {
          setTotalRejects(res.pagination.total);
          setTotalPagesReject(res.pagination.totalPages);
        }
      }
    } catch (err) {
      toast.error("Gagal memuat data reject: " + err.message);
    } finally {
      setLoadingRejects(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    if (activeTab === "ho") {
      fetchHoStockData();
    } else if (activeTab === "rider") {
      fetchRiderStocks();
    } else if (activeTab === "reject") {
      fetchRejects();
    }
  }, [
    activeTab,
    debouncedSearchHo,
    selectedCategory,
    selectedStockStatus,
    pageRiderStock,
    limitRiderStock,
    debouncedSearchRiderStock,
    riderStockDate,
    selectedRiderFilter,
    pageReject,
    limitReject,
    debouncedSearchReject,
    rejectDateFilter,
    rejectReasonFilter,
    rejectSourceFilter,
  ]);

  // ==========================================
  // HANDLERS: ACTIONS
  // ==========================================
  // 1. Submit Restock HO
  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!restockData.product_id || !restockData.qty || Number(restockData.qty) <= 0) {
      toast.error("Pilih menu dan isi jumlah restock yang valid");
      return;
    }

    setIsSubmittingRestock(true);
    try {
      const res = await request.post(API_ENDPOINTS.STOCKS.RESTOCK_HO, {
        product_id: Number(restockData.product_id),
        qty: Number(restockData.qty),
        notes: restockData.notes,
      });
      if (res.success) {
        toast.success(res.message || "Stok HO berhasil ditambah!");
        setIsRestockOpen(false);
        setRestockData({ product_id: "", qty: "", notes: "" });
        fetchHoStockData();
        fetchMetadata();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmittingRestock(false);
    }
  };

  // 2. Submit Allocate to Rider
  const handleAllocateSubmit = async (e) => {
    e.preventDefault();
    if (!allocateData.rider_id || !allocateData.product_id || !allocateData.qty || Number(allocateData.qty) <= 0) {
      toast.error("Lengkapi rider, produk, dan jumlah stok alokasi");
      return;
    }

    setIsSubmittingAllocate(true);
    try {
      const res = await request.post(API_ENDPOINTS.STOCKS.ALLOCATE_RIDER, {
        rider_id: Number(allocateData.rider_id),
        stock_date: allocateData.stock_date,
        items: [{ product_id: Number(allocateData.product_id), qty: Number(allocateData.qty) }],
        notes: allocateData.notes,
      });
      if (res.success) {
        toast.success(res.message || "Stok awal dagang berhasil digeser ke rider!");
        setIsAllocateOpen(false);
        setAllocateData({
          rider_id: "",
          stock_date: new Date().toISOString().split("T")[0],
          product_id: "",
          qty: "",
          notes: "",
        });
        fetchHoStockData();
        fetchRiderStocks();
        fetchMetadata();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmittingAllocate(false);
    }
  };

  // 3. Submit Reject Stock
  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (rejectFormData.source === "rider" && !rejectFormData.rider_id) {
      toast.error("Pilih rider pemilik stok yang rusak/reject");
      return;
    }
    if (!rejectFormData.product_id || !rejectFormData.qty || Number(rejectFormData.qty) <= 0) {
      toast.error("Pilih menu dan masukkan jumlah cup reject");
      return;
    }

    setIsSubmittingReject(true);
    try {
      const res = await request.post(API_ENDPOINTS.STOCKS.REJECT, {
        source: rejectFormData.source,
        rider_id: rejectFormData.source === "rider" ? Number(rejectFormData.rider_id) : null,
        product_id: Number(rejectFormData.product_id),
        reject_date: rejectFormData.reject_date,
        qty: Number(rejectFormData.qty),
        reason: rejectFormData.reason,
        notes: rejectFormData.notes,
      });
      if (res.success) {
        toast.success(res.message || "Barang reject berhasil dicatat!");
        setIsRejectOpen(false);
        setRejectFormData({
          source: "rider",
          rider_id: "",
          product_id: "",
          reject_date: new Date().toISOString().split("T")[0],
          qty: 1,
          reason: "bocor",
          notes: "",
        });
        fetchHoStockData();
        fetchRiderStocks();
        fetchRejects();
        fetchMetadata();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmittingReject(false);
    }
  };

  // 4. Return Rider Stock to HO
  const handleConfirmReturn = async () => {
    if (!returnTarget) return;
    setIsSubmittingReturn(true);
    try {
      const res = await request.post(API_ENDPOINTS.STOCKS.RETURN_HO, {
        rider_id: returnTarget.rider_id,
        product_id: returnTarget.product_id,
        stock_date: returnTarget.stock_date,
        qty: returnTarget.remaining_qty,
        notes: `Pengembalian sisa stok fisik harian dari ${returnTarget.rider_name}`,
      });
      if (res.success) {
        toast.success(res.message || "Sisa stok berhasil dikembalikan ke Gudang HO!");
        setIsReturnDialogOpen(false);
        setReturnTarget(null);
        fetchHoStockData();
        fetchRiderStocks();
        fetchMetadata();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  // ==========================================
  // EXPORT HANDLERS (.xlsx)
  // ==========================================
  const handleExportRiderStocksExcel = () => {
    if (riderStockItems.length === 0) {
      toast.error("Tidak ada data stok rider untuk diekspor");
      return;
    }
    try {
      const exportData = riderStockItems.map((r, i) => ({
        "No": i + 1,
        "Tanggal": r.stock_date,
        "Kode Rider": r.rider_code,
        "Nama Rider": r.rider_name,
        "Nama Menu / Produk": r.product_name,
        "Stok Awal (Bawa)": r.allocated_qty,
        "Terjual (Cup)": r.sold_qty,
        "Reject (Cup)": r.reject_qty,
        "Kembali ke HO": r.returned_qty,
        "Sisa Fisik": r.remaining_qty,
        "Catatan": r.notes || "-",
      }));

      exportToExcel({
        data: exportData,
        filename: `Alokasi_Stok_Rider_${riderStockDate || "Semua"}`,
        sheetName: "Stok Dagang Rider",
        columnWidths: [6, 14, 14, 22, 24, 16, 14, 14, 14, 14, 20],
      });
      toast.success("File Excel (.xlsx) stok rider berhasil diunduh!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleExportRejectsExcel = () => {
    if (rejectItems.length === 0) {
      toast.error("Tidak ada data reject untuk diekspor");
      return;
    }
    try {
      const exportData = rejectItems.map((rj, i) => ({
        "No": i + 1,
        "Tanggal": rj.reject_date,
        "Sumber": rj.source_name,
        "Nama Produk": rj.product_name,
        "Jumlah (Cup)": rj.qty,
        "Alasan Reject": rj.reason.toUpperCase(),
        "Keterangan / Catatan": rj.notes || "-",
        "Pencatat": rj.recorder_name || "-",
      }));

      exportToExcel({
        data: exportData,
        filename: `Laporan_Barang_Reject_${new Date().toISOString().split("T")[0]}`,
        sheetName: "Barang Reject",
        columnWidths: [6, 14, 24, 24, 14, 18, 25, 18],
      });
      toast.success("File Excel (.xlsx) barang reject berhasil diunduh!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-black text-espresso">
              Manajemen & Distribusi Stok
            </h1>
            <Badge variant="coffee">
              {canManage ? "Gudang & Alokasi Rider" : "Status Stok"}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-gray-500">
            Kelola stok keseluruhan Gudang HO, geser menjadi stok awal dagang rider, serta catat rekonsiliasi barang reject.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {canManage && (
            <>
              <button
                type="button"
                onClick={() => setIsRestockOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Restock HO</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAllocateOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-coffee-600 hover:bg-coffee-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>+ Geser ke Rider</span>
              </button>

              <button
                type="button"
                onClick={() => setIsRejectOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all"
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>+ Geser ke Reject</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => {
              if (activeTab === "ho") fetchHoStockData();
              if (activeTab === "rider") fetchRiderStocks();
              if (activeTab === "reject") fetchRejects();
            }}
            className="p-2 bg-white hover:bg-gray-50 text-coffee-800 border border-amber-200/80 rounded-xl shadow-xs transition-all"
            title="Muat Ulang"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                loadingHo || loadingRiderStock || loadingRejects ? "animate-spin" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Modern Navigation Tabs */}
      <div className="flex border-b border-amber-200/80 gap-2 sm:gap-4 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab("ho")}
          className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === "ho"
              ? "border-coffee-600 text-coffee-700"
              : "border-transparent text-gray-500 hover:text-espresso"
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>1. Stok Gudang HO (Pusat)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("rider")}
          className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === "rider"
              ? "border-coffee-600 text-coffee-700"
              : "border-transparent text-gray-500 hover:text-espresso"
          }`}
        >
          <Bike className="w-4 h-4" />
          <span>2. Alokasi & Sisa Stok Rider</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("reject")}
          className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === "reject"
              ? "border-rose-600 text-rose-700"
              : "border-transparent text-gray-500 hover:text-espresso"
          }`}
        >
          <AlertOctagon className="w-4 h-4" />
          <span>3. Barang Reject / Rusak</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: STOK GUDANG HO CONTENT                                             */}
      {/* ========================================================================= */}
      {activeTab === "ho" && (
        <div className="space-y-5">
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
                  {Number(hoSummary.total_ho_units || 0).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Stok Aman (&gt; Min)
                </span>
                <span className="text-xl font-black text-emerald-700">
                  {hoSummary.available_count || 0} Menu
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
                  {hoSummary.low_count || 0} Menu
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Habis / Kosong
                </span>
                <span className="text-xl font-black text-rose-700">
                  {hoSummary.out_count || 0} Menu
                </span>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl sm:rounded-3xl border border-amber-100 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
            <SearchInput
              value={searchHo}
              onChange={setSearchHo}
              placeholder="Cari nama kopi, SKU, atau kategori..."
              className="w-full md:max-w-md"
            />
            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full md:w-auto px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-hidden focus:border-coffee-500"
              >
                <option value="all">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedStockStatus}
                onChange={(e) => setSelectedStockStatus(e.target.value)}
                className="w-full md:w-auto px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-hidden focus:border-coffee-500"
              >
                <option value="all">Semua Status Stok</option>
                <option value="available">Stok Tersedia</option>
                <option value="low">Menipis (&lt;= Minimum)</option>
                <option value="out">Habis (Kosong)</option>
              </select>
            </div>
          </div>

          {/* Product Cards Grid */}
          {loadingHo ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <LoadingSkeleton rows={4} />
              <LoadingSkeleton rows={4} />
              <LoadingSkeleton rows={4} />
              <LoadingSkeleton rows={4} />
            </div>
          ) : hoItems.length === 0 ? (
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
              {hoItems.map((prod) => {
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
                        <ProductAvatar
                          image={prod.image}
                          name={prod.name}
                          size="full"
                          mode="initials"
                          rounded="rounded-none"
                          className="w-full h-full"
                        />

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
                              <CheckCircle2 className="w-3 h-3" /> Tersedia
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Product Content Details */}
                      <div className="p-4 space-y-2.5">
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            {prod.category_name} &bull; {prod.sku}
                          </span>
                          <h3 className="font-extrabold text-espresso text-sm sm:text-base line-clamp-1">
                            {prod.name}
                          </h3>
                        </div>

                        {/* Stock Counter Bar */}
                        <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-100 space-y-1">
                          <div className="flex justify-between items-baseline">
                            <span className="text-xs text-gray-500 font-semibold">Sisa Gudang HO:</span>
                            <span
                              className={`text-lg font-black ${
                                isOut ? "text-rose-600" : isLow ? "text-amber-600" : "text-coffee-700"
                              }`}
                            >
                              {prod.stock_ho}{" "}
                              <span className="text-xs font-bold text-gray-400 uppercase">
                                {prod.unit || "cup"}
                              </span>
                            </span>
                          </div>
                          <div className="flex justify-between text-[11px] text-gray-400">
                            <span>Batas Minimum:</span>
                            <span className="font-bold text-gray-600">
                              {prod.min_stock} {prod.unit || "cup"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Quick Restock action for Admin */}
                    {canManage && (
                      <div className="p-3 bg-gray-50/70 border-t border-gray-100 flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setRestockData({ product_id: prod.id, qty: "50", notes: "" });
                            setIsRestockOpen(true);
                          }}
                          className="flex-1 py-1.5 px-2 bg-white hover:bg-amber-50 text-coffee-700 border border-amber-200 rounded-lg text-xs font-bold transition-colors"
                        >
                          + Tambah Stok HO
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAllocateData({
                              rider_id: "",
                              stock_date: new Date().toISOString().split("T")[0],
                              product_id: prod.id,
                              qty: "20",
                              notes: "",
                            });
                            setIsAllocateOpen(true);
                          }}
                          className="py-1.5 px-2.5 bg-coffee-600 hover:bg-coffee-700 text-white rounded-lg text-xs font-bold transition-colors"
                          title="Alokasikan ke Rider"
                        >
                          Alokasikan
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ALOKASI & SISA STOK RIDER CONTENT                                  */}
      {/* ========================================================================= */}
      {activeTab === "rider" && (
        <div className="space-y-5">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-amber-200/70 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-coffee-50 text-coffee-700 flex items-center justify-center shrink-0">
                <Bike className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Total Bawa (Awal)
                </span>
                <span className="text-xl font-black text-espresso">
                  {Number(riderStockSummary.total_allocated || 0).toLocaleString()} Cup
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Total Terjual (Sales)
                </span>
                <span className="text-xl font-black text-emerald-700">
                  {Number(riderStockSummary.total_sold || 0).toLocaleString()} Cup
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Total Reject (Rusak)
                </span>
                <span className="text-xl font-black text-rose-700">
                  {Number(riderStockSummary.total_reject || 0).toLocaleString()} Cup
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-coffee-200 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-coffee-100 text-coffee-800 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Sisa Fisik di Rider
                </span>
                <span className="text-xl font-black text-coffee-800">
                  {Number(riderStockSummary.total_remaining || 0).toLocaleString()} Cup
                </span>
              </div>
            </div>
          </div>

          {/* Filter & Export Bar */}
          <div className="bg-white p-4 rounded-2xl sm:rounded-3xl border border-amber-100 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
            <SearchInput
              value={searchRiderStock}
              onChange={setSearchRiderStock}
              placeholder="Cari rider atau nama menu..."
              className="w-full md:max-w-xs"
            />

            <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-xs">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <input
                  type="date"
                  value={riderStockDate}
                  onChange={(e) => setRiderStockDate(e.target.value)}
                  className="bg-transparent font-bold text-gray-700 outline-hidden"
                />
              </div>

              <select
                value={selectedRiderFilter}
                onChange={(e) => setSelectedRiderFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-hidden"
              >
                <option value="">Semua Rider</option>
                {activeRiders.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.code} - {r.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleExportRiderStocksExcel}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
                title="Unduh Laporan Excel"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Ekspor Excel</span>
              </button>
            </div>
          </div>

          {/* Table of Rider Stock Allocations */}
          <div className="bg-white rounded-3xl border border-amber-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-amber-100/80 bg-cream-light/40 text-[11px] font-black uppercase tracking-wider text-gray-500">
                    <th className="py-3.5 px-4 whitespace-nowrap">Rider</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Tanggal</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Menu / Produk</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap">Bawa Awal</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap">Terjual</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap">Reject</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap">Kembali HO</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap">Sisa Fisik</th>
                    {canManage && <th className="py-3.5 px-4 text-center whitespace-nowrap">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {loadingRiderStock ? (
                    <tr>
                      <td colSpan={canManage ? 9 : 8} className="p-4">
                        <LoadingSkeleton rows={4} />
                      </td>
                    </tr>
                  ) : riderStockItems.length === 0 ? (
                    <tr>
                      <td colSpan={canManage ? 9 : 8} className="p-8 text-center text-gray-400">
                        Belum ada data alokasi stok rider pada filter / tanggal ini.
                      </td>
                    </tr>
                  ) : (
                    riderStockItems.map((item) => (
                      <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-espresso">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-amber-100 text-coffee-800 text-[10px] font-mono">
                              {item.rider_code}
                            </span>
                            <span>{item.rider_name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-gray-500 font-mono whitespace-nowrap">
                          {formatDateIndo(item.stock_date)}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-espresso">
                          <div className="flex items-center gap-2">
                            <ProductAvatar
                              image={item.product_image}
                              name={item.product_name}
                              size="xs"
                              rounded="rounded-lg"
                            />
                            <span>{item.product_name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center font-extrabold text-espresso">
                          {item.allocated_qty}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-emerald-600">
                          {item.sold_qty}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-rose-600">
                          {item.reject_qty}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-gray-500">
                          {item.returned_qty}
                        </td>
                        <td className="py-3.5 px-4 text-center font-black text-sm text-coffee-800">
                          <span
                            className={`px-2.5 py-1 rounded-lg ${
                              item.remaining_qty > 0
                                ? "bg-amber-100 text-amber-900 font-black"
                                : "bg-gray-100 text-gray-500 font-semibold"
                            }`}
                          >
                            {item.remaining_qty} Cup
                          </span>
                        </td>
                        {canManage && (
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            {item.remaining_qty > 0 ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setReturnTarget(item);
                                  setIsReturnDialogOpen(true);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-coffee-50 hover:bg-coffee-100 text-coffee-700 text-xs font-bold border border-coffee-200 transition-colors"
                                title="Kembalikan sisa fisik ke gudang HO"
                              >
                                Return ke HO
                              </button>
                            ) : (
                              <span className="text-gray-300 text-xs">&mdash;</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="p-4 border-t border-gray-100">
              <Pagination
                page={pageRiderStock}
                limit={limitRiderStock}
                total={totalRiderStock}
                totalPages={totalPagesRiderStock}
                onPageChange={setPageRiderStock}
                onLimitChange={(l) => {
                  setLimitRiderStock(l);
                  setPageRiderStock(1);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BARANG REJECT CONTENT                                              */}
      {/* ========================================================================= */}
      {activeTab === "reject" && (
        <div className="space-y-5">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Total Cup Rusak / Reject
                </span>
                <span className="text-xl font-black text-rose-700">
                  {Number(totalRejectUnits || 0).toLocaleString()} Cup
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Total Kejadian Reject
                </span>
                <span className="text-xl font-black text-espresso">
                  {totalRejects} Insiden
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between col-span-2 lg:col-span-1">
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Audit Integritas Stok
                </span>
                <p className="text-xs text-gray-500 mt-0.5">
                  Setiap reject memotong stok rider/HO secara transparan.
                </p>
              </div>
              {canManage && (
                <button
                  type="button"
                  onClick={() => setIsRejectOpen(true)}
                  className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0"
                >
                  + Catat Reject
                </button>
              )}
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl sm:rounded-3xl border border-amber-100 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
            <SearchInput
              value={searchReject}
              onChange={setSearchReject}
              placeholder="Cari produk atau sumber reject..."
              className="w-full md:max-w-xs"
            />

            <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
              <input
                type="date"
                value={rejectDateFilter}
                onChange={(e) => setRejectDateFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-hidden"
              />

              <select
                value={rejectSourceFilter}
                onChange={(e) => setRejectSourceFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-hidden"
              >
                <option value="all">Semua Sumber</option>
                <option value="rider">Khusus Rider</option>
                <option value="ho">Khusus Gudang HO</option>
              </select>

              <select
                value={rejectReasonFilter}
                onChange={(e) => setRejectReasonFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-hidden"
              >
                <option value="">Semua Alasan</option>
                <option value="bocor">Bocor</option>
                <option value="tumpah">Tumpah</option>
                <option value="basi">Basi / Salah Racik</option>
                <option value="rusak">Kemasan Rusak</option>
                <option value="lainnya">Lainnya</option>
              </select>

              <button
                type="button"
                onClick={handleExportRejectsExcel}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
                title="Unduh Laporan Excel"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Ekspor Excel</span>
              </button>
            </div>
          </div>

          {/* Table of Rejects */}
          <div className="bg-white rounded-3xl border border-amber-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-amber-100/80 bg-cream-light/40 text-[11px] font-black uppercase tracking-wider text-gray-500">
                    <th className="py-3.5 px-4 whitespace-nowrap">Tanggal</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Sumber Stok</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Menu / Produk</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap">Jumlah Reject</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Alasan</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Keterangan</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Dicatat Oleh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {loadingRejects ? (
                    <tr>
                      <td colSpan={7} className="p-4">
                        <LoadingSkeleton rows={4} />
                      </td>
                    </tr>
                  ) : rejectItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-400">
                        Tidak ada catatan barang reject pada filter ini.
                      </td>
                    </tr>
                  ) : (
                    rejectItems.map((item) => (
                      <tr key={item.id} className="hover:bg-rose-50/20 transition-colors">
                        <td className="py-3.5 px-4 text-gray-500 font-mono whitespace-nowrap">
                          {formatDateIndo(item.reject_date)}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-espresso">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] ${
                              item.rider_id
                                ? "bg-amber-100 text-coffee-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {item.source_name}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-espresso">
                          <div className="flex items-center gap-2">
                            <ProductAvatar
                              image={item.product_image}
                              name={item.product_name}
                              size="xs"
                              rounded="rounded-lg"
                            />
                            <span>{item.product_name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center font-black text-rose-600 text-sm">
                          {item.qty} Cup
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 text-[10px] font-black uppercase tracking-wide">
                            {item.reason}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-gray-600 max-w-xs truncate">
                          {item.notes || "-"}
                        </td>
                        <td className="py-3.5 px-4 text-gray-500 text-[11px]">
                          {item.recorder_name || "Admin"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="p-4 border-t border-gray-100">
              <Pagination
                page={pageReject}
                limit={limitReject}
                total={totalRejects}
                totalPages={totalPagesReject}
                onPageChange={setPageReject}
                onLimitChange={(l) => {
                  setLimitReject(l);
                  setPageReject(1);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: RESTOCK GUDANG HO                                                */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isRestockOpen}
        onClose={() => setIsRestockOpen(false)}
        title="Tambah Stok Keseluruhan Gudang HO"
      >
        <form onSubmit={handleRestockSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Pilih Menu / Produk Kopi *
            </label>
            <select
              value={restockData.product_id}
              onChange={(e) => setRestockData({ ...restockData, product_id: e.target.value })}
              required
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-espresso focus:outline-hidden focus:border-coffee-500"
            >
              <option value="">-- Pilih Produk --</option>
              {activeProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Sisa HO: {p.stock_ho} cup)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Jumlah Penambahan Stok (Cup) *
            </label>
            <input
              type="number"
              min="1"
              value={restockData.qty}
              onChange={(e) => setRestockData({ ...restockData, qty: e.target.value })}
              placeholder="Contoh: 100"
              required
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-espresso focus:outline-hidden focus:border-coffee-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Catatan Pengadaan (Opsional)
            </label>
            <textarea
              value={restockData.notes}
              onChange={(e) => setRestockData({ ...restockData, notes: e.target.value })}
              placeholder="Contoh: Pengadaan bahan batch pagi, restock supplier..."
              rows={2}
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-hidden"
            />
          </div>

          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsRestockOpen(false)}
              className="flex-1 py-2.5 text-xs font-semibold rounded-xl border border-gray-200 hover:bg-gray-100"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmittingRestock}
              className="flex-1 py-2.5 text-xs font-bold text-white bg-coffee-600 hover:bg-coffee-700 rounded-xl disabled:opacity-50"
            >
              {isSubmittingRestock ? "Menyimpan..." : "Tambah ke HO"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: GESER STOK KE RIDER (ALOKASI)                                   */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAllocateOpen}
        onClose={() => setIsAllocateOpen(false)}
        title="Geser Stok HO menjadi Stok Awal Dagang Rider"
      >
        <form onSubmit={handleAllocateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Pilih Rider Tujuan *
              </label>
              <select
                value={allocateData.rider_id}
                onChange={(e) => setAllocateData({ ...allocateData, rider_id: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-espresso focus:outline-hidden focus:border-coffee-500"
              >
                <option value="">-- Pilih Rider --</option>
                {activeRiders.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.code} - {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Tanggal Dagang *
              </label>
              <input
                type="date"
                value={allocateData.stock_date}
                onChange={(e) => setAllocateData({ ...allocateData, stock_date: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-espresso focus:outline-hidden focus:border-coffee-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Menu / Produk yang Dibawa *
            </label>
            <select
              value={allocateData.product_id}
              onChange={(e) => setAllocateData({ ...allocateData, product_id: e.target.value })}
              required
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-espresso focus:outline-hidden focus:border-coffee-500"
            >
              <option value="">-- Pilih Produk --</option>
              {activeProducts.map((p) => (
                <option key={p.id} value={p.id} disabled={p.stock_ho <= 0}>
                  {p.name} {p.stock_ho <= 0 ? "(HABIS DI HO)" : `(Sisa HO: ${p.stock_ho} cup)`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Jumlah Cup Bawaan *
            </label>
            <input
              type="number"
              min="1"
              value={allocateData.qty}
              onChange={(e) => setAllocateData({ ...allocateData, qty: e.target.value })}
              placeholder="Contoh: 30"
              required
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-espresso focus:outline-hidden focus:border-coffee-500"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Stok Gudang HO akan otomatis berkurang dan dicatat sebagai stok awal dagang rider.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Catatan Alokasi (Opsional)
            </label>
            <textarea
              value={allocateData.notes}
              onChange={(e) => setAllocateData({ ...allocateData, notes: e.target.value })}
              placeholder="Contoh: Bawaan shift pagi area Sudirman..."
              rows={2}
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-hidden"
            />
          </div>

          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsAllocateOpen(false)}
              className="flex-1 py-2.5 text-xs font-semibold rounded-xl border border-gray-200 hover:bg-gray-100"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmittingAllocate}
              className="flex-1 py-2.5 text-xs font-bold text-white bg-coffee-600 hover:bg-coffee-700 rounded-xl disabled:opacity-50"
            >
              {isSubmittingAllocate ? "Mengalokasikan..." : "Alokasikan ke Rider"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: GESER KE BARANG REJECT                                           */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        title="Catat Barang / Cup Reject (Rusak / Bocor)"
      >
        <form onSubmit={handleRejectSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Sumber Barang Reject *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRejectFormData({ ...rejectFormData, source: "rider" })}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  rejectFormData.source === "rider"
                    ? "bg-amber-100 border-coffee-500 text-coffee-800 shadow-2xs"
                    : "bg-gray-50 border-gray-200 text-gray-600"
                }`}
              >
                Stok Bawaan Rider
              </button>
              <button
                type="button"
                onClick={() => setRejectFormData({ ...rejectFormData, source: "ho", rider_id: "" })}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  rejectFormData.source === "ho"
                    ? "bg-amber-100 border-coffee-500 text-coffee-800 shadow-2xs"
                    : "bg-gray-50 border-gray-200 text-gray-600"
                }`}
              >
                Gudang HO (Pusat)
              </button>
            </div>
          </div>

          {rejectFormData.source === "rider" && (
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Pilih Rider *
              </label>
              <select
                value={rejectFormData.rider_id}
                onChange={(e) => setRejectFormData({ ...rejectFormData, rider_id: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-espresso focus:outline-hidden focus:border-coffee-500"
              >
                <option value="">-- Pilih Rider Pemilik Stok --</option>
                {activeRiders.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.code} - {r.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Pilih Menu / Produk *
              </label>
              <select
                value={rejectFormData.product_id}
                onChange={(e) => setRejectFormData({ ...rejectFormData, product_id: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-espresso focus:outline-hidden focus:border-coffee-500"
              >
                <option value="">-- Pilih Produk --</option>
                {activeProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Tanggal Kejadian *
              </label>
              <input
                type="date"
                value={rejectFormData.reject_date}
                onChange={(e) => setRejectFormData({ ...rejectFormData, reject_date: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-espresso focus:outline-hidden focus:border-coffee-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Jumlah Cup Reject *
              </label>
              <input
                type="number"
                min="1"
                value={rejectFormData.qty}
                onChange={(e) => setRejectFormData({ ...rejectFormData, qty: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-espresso focus:outline-hidden focus:border-coffee-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Alasan Kerusakan *
              </label>
              <select
                value={rejectFormData.reason}
                onChange={(e) => setRejectFormData({ ...rejectFormData, reason: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-espresso focus:outline-hidden focus:border-coffee-500"
              >
                <option value="bocor">Kemasan / Cup Bocor</option>
                <option value="tumpah">Tumpah di Perjalanan</option>
                <option value="basi">Basi / Rasa Berubah / Salah Racik</option>
                <option value="rusak">Kemasan Cacat / Rusak Fisik</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Catatan / Kronologi (Opsional)
            </label>
            <textarea
              value={rejectFormData.notes}
              onChange={(e) => setRejectFormData({ ...rejectFormData, notes: e.target.value })}
              placeholder="Contoh: Cup tertindih saat motor rem mendadak..."
              rows={2}
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-hidden"
            />
          </div>

          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsRejectOpen(false)}
              className="flex-1 py-2.5 text-xs font-semibold rounded-xl border border-gray-200 hover:bg-gray-100"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmittingReject}
              className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl disabled:opacity-50"
            >
              {isSubmittingReject ? "Mencatat..." : "Simpan Barang Reject"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* CONFIRM DIALOG: RETURN SISA STOK KE HO                                    */}
      {/* ========================================================================= */}
      <ConfirmDialog
        isOpen={isReturnDialogOpen}
        onClose={() => setIsReturnDialogOpen(false)}
        onConfirm={handleConfirmReturn}
        title="Kembalikan Sisa Stok ke Gudang HO?"
        message={`Apakah Anda yakin ingin mengembalikan sisa ${returnTarget?.remaining_qty || 0} cup ${returnTarget?.product_name || ""} dari ${returnTarget?.rider_name || ""} ke Gudang HO? Stok gudang pusat akan otomatis bertambah.`}
        confirmText={isSubmittingReturn ? "Memproses..." : "Ya, Kembalikan ke HO"}
        type="warning"
      />
    </div>
  );
}
