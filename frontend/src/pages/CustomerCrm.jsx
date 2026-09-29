import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Repeat,
  UserX,
  Award,
  Ticket,
  Percent,
  Search,
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  ShoppingBag,
  Coins,
  CheckCircle2,
} from "lucide-react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import { formatRupiah, formatDateIndo } from "../utils/formatters";
import { usePagination } from "../hooks/usePagination";
import { useDebounce } from "../hooks/useDebounce";
import Pagination from "../components/common/Pagination";
import Modal from "../components/common/Modal";
import ConfirmDialog from "../components/common/ConfirmDialog";
import Badge from "../components/common/Badge";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import toast from "react-hot-toast";

export default function CustomerCrm() {
  const [activeTab, setActiveTab] = useState("customers"); // 'customers' | 'vouchers' | 'promos'
  const [crmStats, setCrmStats] = useState(null);

  // ===================== TAB 1: CUSTOMERS =====================
  const [customers, setCustomers] = useState([]);
  const [loadingCust, setLoadingCust] = useState(true);
  const [searchCust, setSearchCust] = useState("");
  const debouncedSearchCust = useDebounce(searchCust, 350);
  const { page, limit, total, totalPages, setPage, updatePaginationMeta } = usePagination(10);

  // Customer Modals
  const [isCustModalOpen, setIsCustModalOpen] = useState(false);
  const [editingCust, setEditingCust] = useState(null);
  const [custFormData, setCustFormData] = useState({ name: "", phone: "", email: "" });
  const [isSubmittingCust, setIsSubmittingCust] = useState(false);

  // Adjust Points Modal
  const [adjustingCust, setAdjustingCust] = useState(null);
  const [pointsDelta, setPointsDelta] = useState(10);
  const [isSubmittingPoints, setIsSubmittingPoints] = useState(false);

  // Delete Customer Dialog
  const [deletingCustId, setDeletingCustId] = useState(null);
  const [isDeletingCust, setIsDeletingCust] = useState(false);

  // ===================== TAB 2: VOUCHERS =====================
  const [vouchers, setVouchers] = useState([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [voucherFormData, setVoucherFormData] = useState({
    code: "",
    title: "",
    discount_type: "percent",
    discount_value: 10,
    min_order_amount: 0,
    max_discount: "",
    quota: 100,
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    status: "active",
  });
  const [isSubmittingVoucher, setIsSubmittingVoucher] = useState(false);

  // ===================== TAB 3: PROMOS =====================
  const [promos, setPromos] = useState([]);
  const [loadingPromos, setLoadingPromos] = useState(false);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [promoFormData, setPromoFormData] = useState({
    title: "",
    description: "",
    discount_percent: 15,
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
  });
  const [promoBanner, setPromoBanner] = useState(null);
  const [isSubmittingPromo, setIsSubmittingPromo] = useState(false);

  // Fetch CRM Stats
  const fetchStats = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.CRM.STATS);
      if (res.success) setCrmStats(res.data || null);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Customers
  const fetchCustomers = async () => {
    setLoadingCust(true);
    try {
      const res = await request.get(API_ENDPOINTS.CRM.CUSTOMERS, {
        page,
        limit,
        search: debouncedSearchCust,
      });
      if (res.success) {
        setCustomers(res.data || []);
        updatePaginationMeta(res.pagination);
      }
    } catch (err) {
      toast.error("Gagal memuat pelanggan: " + err.message);
    } finally {
      setLoadingCust(false);
    }
  };

  // Fetch Vouchers
  const fetchVouchers = async () => {
    setLoadingVouchers(true);
    try {
      const res = await request.get(API_ENDPOINTS.CRM.VOUCHERS);
      if (res.success) setVouchers(res.data || []);
    } catch (err) {
      toast.error("Gagal memuat voucher: " + err.message);
    } finally {
      setLoadingVouchers(false);
    }
  };

  // Fetch Promos
  const fetchPromos = async () => {
    setLoadingPromos(true);
    try {
      const res = await request.get(API_ENDPOINTS.CRM.PROMOS);
      if (res.success) setPromos(res.data || []);
    } catch (err) {
      toast.error("Gagal memuat promo: " + err.message);
    } finally {
      setLoadingPromos(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === "customers") fetchCustomers();
    else if (activeTab === "vouchers") fetchVouchers();
    else if (activeTab === "promos") fetchPromos();
  }, [activeTab, page, limit, debouncedSearchCust]);

  // Handle Save Customer
  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    setIsSubmittingCust(true);
    try {
      if (editingCust) {
        const res = await request.put(API_ENDPOINTS.CRM.UPDATE_CUSTOMER(editingCust.id), custFormData);
        if (res.success) {
          toast.success("Data pelanggan diperbarui");
          setIsCustModalOpen(false);
          fetchCustomers();
          fetchStats();
        }
      } else {
        const res = await request.post(API_ENDPOINTS.CRM.CREATE_CUSTOMER, custFormData);
        if (res.success) {
          toast.success("Pelanggan baru berhasil didaftarkan");
          setIsCustModalOpen(false);
          fetchCustomers();
          fetchStats();
        }
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmittingCust(false);
    }
  };

  // Handle Adjust Points
  const handleAdjustPoints = async (e) => {
    e.preventDefault();
    if (!adjustingCust) return;
    setIsSubmittingPoints(true);
    try {
      const res = await request.post(API_ENDPOINTS.CRM.ADJUST_POINTS(adjustingCust.id), {
        points_delta: pointsDelta,
      });
      if (res.success) {
        toast.success(res.message || "Poin berhasil disesuaikan");
        setAdjustingCust(null);
        fetchCustomers();
        fetchStats();
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmittingPoints(false);
    }
  };

  // Handle Delete Customer
  const handleDeleteCustomer = async () => {
    if (!deletingCustId) return;
    setIsDeletingCust(true);
    try {
      const res = await request.delete(API_ENDPOINTS.CRM.DELETE_CUSTOMER(deletingCustId));
      if (res.success) {
        toast.success("Pelanggan berhasil dihapus");
        setDeletingCustId(null);
        fetchCustomers();
        fetchStats();
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsDeletingCust(false);
    }
  };

  // Handle Save Voucher
  const handleSaveVoucher = async (e) => {
    e.preventDefault();
    setIsSubmittingVoucher(true);
    try {
      if (editingVoucher) {
        const res = await request.put(API_ENDPOINTS.CRM.UPDATE_VOUCHER(editingVoucher.id), voucherFormData);
        if (res.success) {
          toast.success("Voucher berhasil diperbarui");
          setIsVoucherModalOpen(false);
          fetchVouchers();
        }
      } else {
        const res = await request.post(API_ENDPOINTS.CRM.CREATE_VOUCHER, voucherFormData);
        if (res.success) {
          toast.success("Voucher baru berhasil dibuat");
          setIsVoucherModalOpen(false);
          fetchVouchers();
        }
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmittingVoucher(false);
    }
  };

  // Handle Save Promo
  const handleSavePromo = async (e) => {
    e.preventDefault();
    setIsSubmittingPromo(true);
    try {
      const formData = new FormData();
      formData.append("title", promoFormData.title);
      formData.append("description", promoFormData.description);
      formData.append("discount_percent", promoFormData.discount_percent);
      formData.append("start_date", promoFormData.start_date);
      formData.append("end_date", promoFormData.end_date);
      if (promoBanner) formData.append("banner", promoBanner);

      const res = await request.post(API_ENDPOINTS.CRM.CREATE_PROMO, formData);
      if (res.success) {
        toast.success("Promo banner berhasil diterbitkan");
        setIsPromoModalOpen(false);
        setPromoBanner(null);
        fetchPromos();
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmittingPromo(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-espresso flex items-center gap-2.5">
            <Users className="w-6 h-6 text-coffee-600" />
            <span>Customer & CRM Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Kelola pelanggan, database kontak, loyalty points, kupon voucher promo, dan retensi customer.
          </p>
        </div>

        {/* Action Button */}
        <div>
          {activeTab === "customers" && (
            <button
              type="button"
              onClick={() => {
                setEditingCust(null);
                setCustFormData({ name: "", phone: "", email: "" });
                setIsCustModalOpen(true);
              }}
              className="px-4 py-2.5 bg-coffee-600 hover:bg-coffee-700 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Pelanggan</span>
            </button>
          )}

          {activeTab === "vouchers" && (
            <button
              type="button"
              onClick={() => {
                setEditingVoucher(null);
                setVoucherFormData({
                  code: `KOPI${Math.floor(100 + Math.random() * 900)}`,
                  title: "",
                  discount_type: "percent",
                  discount_value: 10,
                  min_order_amount: 0,
                  max_discount: "",
                  quota: 100,
                  start_date: new Date().toISOString().split("T")[0],
                  end_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
                  status: "active",
                });
                setIsVoucherModalOpen(true);
              }}
              className="px-4 py-2.5 bg-coffee-600 hover:bg-coffee-700 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Voucher</span>
            </button>
          )}

          {activeTab === "promos" && (
            <button
              type="button"
              onClick={() => {
                setPromoFormData({
                  title: "",
                  description: "",
                  discount_percent: 15,
                  start_date: new Date().toISOString().split("T")[0],
                  end_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
                });
                setPromoBanner(null);
                setIsPromoModalOpen(true);
              }}
              className="px-4 py-2.5 bg-coffee-600 hover:bg-coffee-700 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Promo Banner</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-3xl border border-amber-100 shadow-2xs">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Total Customer</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-espresso">{crmStats?.total_customers || 0}</span>
            <Users className="w-5 h-5 text-coffee-600" />
          </div>
          <span className="text-[10px] text-gray-400 mt-1 block">Pelanggan terdaftar</span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-amber-100 shadow-2xs">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Customer Baru</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-emerald-600">{crmStats?.new_customers || 0}</span>
            <UserPlus className="w-5 h-5 text-emerald-500" />
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">30 hari terakhir</span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-amber-100 shadow-2xs">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Customer Repeat</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-coffee-700">{crmStats?.repeat_customers || 0}</span>
            <Repeat className="w-5 h-5 text-coffee-600" />
          </div>
          <span className="text-[10px] text-coffee-600 font-semibold mt-1 block">Order &gt; 1 kali (Loyal)</span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-amber-100 shadow-2xs">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Tidak Aktif</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-red-500">{crmStats?.inactive_customers || 0}</span>
            <UserX className="w-5 h-5 text-red-400" />
          </div>
          <span className="text-[10px] text-red-400 mt-1 block">&gt; 30 hari tanpa order</span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-amber-100 shadow-2xs col-span-2 lg:col-span-1">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Loyalty Points</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-amber-600">{crmStats?.total_loyalty_points || 0} Pts</span>
            <Sparkles className="w-5 h-5 text-amber-500" />
          </div>
          <span className="text-[10px] text-gray-400 mt-1 block">Total saldo poin customer</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-6 text-sm font-bold">
        <button
          type="button"
          onClick={() => setActiveTab("customers")}
          className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "customers"
              ? "border-coffee-600 text-coffee-700 font-extrabold"
              : "border-transparent text-gray-400 hover:text-gray-700"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Daftar Customer & Points</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("vouchers")}
          className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "vouchers"
              ? "border-coffee-600 text-coffee-700 font-extrabold"
              : "border-transparent text-gray-400 hover:text-gray-700"
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span>Kupon Voucher Diskon</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("promos")}
          className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "promos"
              ? "border-coffee-600 text-coffee-700 font-extrabold"
              : "border-transparent text-gray-400 hover:text-gray-700"
          }`}
        >
          <Percent className="w-4 h-4" />
          <span>Program Promo & Banner</span>
        </button>
      </div>

      {/* ======================= TAB 1: CUSTOMERS TABLE ======================= */}
      {activeTab === "customers" && (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="bg-white p-4 rounded-3xl border border-amber-100 shadow-2xs flex justify-between items-center">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={searchCust}
                onChange={(e) => setSearchCust(e.target.value)}
                placeholder="Cari nama, no WhatsApp, email..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm outline-hidden focus:ring-2 focus:ring-coffee-400"
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-amber-100 shadow-xs overflow-x-auto">
            {loadingCust ? (
              <LoadingSkeleton rows={5} />
            ) : customers.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <Users className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p className="font-semibold text-sm">Tidak ada pelanggan ditemukan</p>
                <p className="text-xs text-gray-400 mt-0.5">Customer baru akan otomatis tersimpan saat memesan.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-amber-50/60 uppercase font-bold text-[10px] text-gray-600 border-b border-amber-100">
                  <tr>
                    <th className="py-3 px-3">Nama Pelanggan</th>
                    <th className="py-3 px-3">Kontak (WhatsApp)</th>
                    <th className="py-3 px-3 text-center">Total Order</th>
                    <th className="py-3 px-3 text-right">Total Belanja (LTV)</th>
                    <th className="py-3 px-3 text-center">Loyalty Points</th>
                    <th className="py-3 px-3">Terakhir Order</th>
                    <th className="py-3 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-amber-50/20">
                      <td className="py-3 px-3">
                        <div className="font-extrabold text-espresso text-xs">{c.name}</div>
                        {c.email && <div className="text-[10px] text-gray-400">{c.email}</div>}
                      </td>
                      <td className="py-3 px-3 text-gray-700 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{c.phone}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-gray-800">
                        <span className="bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-200">
                          {c.total_orders} order
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-black text-sm text-coffee-700">
                        {formatRupiah(c.total_spend)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-300">
                          <Coins className="w-3 h-3 text-amber-500" />
                          {c.loyalty_points} Pts
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-500">
                        {c.last_order_date ? formatDateIndo(c.last_order_date) : "Belum pernah order"}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setAdjustingCust(c);
                              setPointsDelta(10);
                            }}
                            title="Sesuaikan Loyalty Points"
                            className="p-1.5 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Coins className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCust(c);
                              setCustFormData({
                                name: c.name,
                                phone: c.phone,
                                email: c.email || "",
                              });
                              setIsCustModalOpen(true);
                            }}
                            title="Edit Pelanggan"
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingCustId(c.id)}
                            title="Hapus Pelanggan"
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <Pagination page={page} limit={limit} total={total} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>
      )}

      {/* ======================= TAB 2: VOUCHERS ======================= */}
      {activeTab === "vouchers" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vouchers.map((v) => (
              <div key={v.id} className="bg-white rounded-3xl p-5 border border-amber-200/80 shadow-2xs space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-sm text-espresso bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-xl">
                    {v.code}
                  </span>
                  <Badge variant={v.status === "active" ? "success" : "default"} className="text-[10px]">
                    {v.status === "active" ? "Aktif" : "Non-Aktif"}
                  </Badge>
                </div>

                <div>
                  <h3 className="font-extrabold text-sm text-gray-900">{v.title}</h3>
                  <p className="text-xs text-coffee-700 font-bold mt-1">
                    {v.discount_type === "percent"
                      ? `Diskon ${v.discount_value}%`
                      : `Potongan ${formatRupiah(v.discount_value)}`}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-500 pt-2 border-t border-gray-100">
                  <div>
                    <span>Min. Belanja:</span>
                    <p className="font-semibold text-gray-700">{formatRupiah(v.min_order_amount)}</p>
                  </div>
                  <div>
                    <span>Kuota / Terpakai:</span>
                    <p className="font-semibold text-gray-700">{v.used_count} / {v.quota}</p>
                  </div>
                </div>

                <div className="text-[10px] text-gray-400">
                  Berlaku: {formatDateIndo(v.start_date)} - {formatDateIndo(v.end_date)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================= TAB 3: PROMOS ======================= */}
      {activeTab === "promos" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {promos.map((p) => (
              <div key={p.id} className="bg-white rounded-3xl p-5 border border-amber-100 shadow-2xs space-y-3">
                {p.banner_image && (
                  <img src={p.banner_image} alt={p.title} className="w-full h-32 object-cover rounded-2xl" />
                )}
                <div>
                  <h3 className="font-extrabold text-sm text-espresso">{p.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{p.description}</p>
                </div>
                <div className="flex justify-between items-center text-xs pt-2 border-t border-gray-100">
                  <span className="font-bold text-coffee-700">Diskon {p.discount_percent}%</span>
                  <span className="text-[10px] text-gray-400">
                    s/d {formatDateIndo(p.end_date)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================= MODAL: CUSTOMER ======================= */}
      {isCustModalOpen && (
        <Modal
          isOpen={isCustModalOpen}
          onClose={() => setIsCustModalOpen(false)}
          title={editingCust ? "Edit Data Pelanggan" : "Daftarkan Pelanggan Baru"}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSaveCustomer} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nama Lengkap *</label>
              <input
                type="text"
                required
                value={custFormData.name}
                onChange={(e) => setCustFormData({ ...custFormData, name: e.target.value })}
                placeholder="Contoh: Ricky Pratama"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-hidden focus:ring-2 focus:ring-coffee-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nomor WhatsApp *</label>
              <input
                type="text"
                required
                value={custFormData.phone}
                onChange={(e) => setCustFormData({ ...custFormData, phone: e.target.value })}
                placeholder="Contoh: 08123456789"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-hidden focus:ring-2 focus:ring-coffee-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Email (Opsional)</label>
              <input
                type="email"
                value={custFormData.email}
                onChange={(e) => setCustFormData({ ...custFormData, email: e.target.value })}
                placeholder="ricky@example.com"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-hidden focus:ring-2 focus:ring-coffee-400"
              />
            </div>

            <div className="flex gap-2.5 pt-3 border-t border-gray-100 justify-end">
              <button
                type="button"
                onClick={() => setIsCustModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-gray-200 hover:bg-gray-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmittingCust}
                className="px-4 py-2 text-xs font-bold text-white bg-coffee-600 hover:bg-coffee-700 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmittingCust ? "Menyimpan..." : "Simpan Pelanggan"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ======================= MODAL: ADJUST POINTS ======================= */}
      {adjustingCust && (
        <Modal
          isOpen={!!adjustingCust}
          onClose={() => setAdjustingCust(null)}
          title={`Sesuaikan Loyalty Points: ${adjustingCust.name}`}
          maxWidth="max-w-sm"
        >
          <form onSubmit={handleAdjustPoints} className="space-y-4">
            <div className="bg-amber-50 p-3 rounded-2xl text-xs text-gray-700 border border-amber-200">
              <span className="text-[10px] text-gray-500 uppercase font-bold block">Saldo Poin Saat Ini</span>
              <span className="text-xl font-black text-amber-700">{adjustingCust.loyalty_points} Poin</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Penambahan (+) atau Pengurangan (-) Poin
              </label>
              <input
                type="number"
                required
                value={pointsDelta}
                onChange={(e) => setPointsDelta(e.target.value)}
                placeholder="Contoh: 50 atau -20"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-hidden focus:ring-2 focus:ring-coffee-400 font-bold"
              />
              <span className="text-[10px] text-gray-400 mt-1 block">
                Masukkan angka positif untuk memberi bonus poin, negatif untuk menukar/memotong poin.
              </span>
            </div>

            <div className="flex gap-2.5 pt-3 border-t border-gray-100 justify-end">
              <button
                type="button"
                onClick={() => setAdjustingCust(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-gray-200 hover:bg-gray-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmittingPoints}
                className="px-4 py-2 text-xs font-bold text-white bg-coffee-600 hover:bg-coffee-700 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmittingPoints ? "Menyimpan..." : "Update Saldo Poin"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ======================= MODAL: VOUCHER ======================= */}
      {isVoucherModalOpen && (
        <Modal
          isOpen={isVoucherModalOpen}
          onClose={() => setIsVoucherModalOpen(false)}
          title="Buat Kupon Voucher Baru"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSaveVoucher} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Kode Voucher *</label>
              <input
                type="text"
                required
                value={voucherFormData.code}
                onChange={(e) => setVoucherFormData({ ...voucherFormData, code: e.target.value })}
                placeholder="Contoh: KOPISANTAI"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs uppercase font-mono font-bold outline-hidden focus:ring-2 focus:ring-coffee-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Judul Promo *</label>
              <input
                type="text"
                required
                value={voucherFormData.title}
                onChange={(e) => setVoucherFormData({ ...voucherFormData, title: e.target.value })}
                placeholder="Contoh: Diskon 20% Akhir Pekan"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-hidden focus:ring-2 focus:ring-coffee-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tipe Diskon</label>
                <select
                  value={voucherFormData.discount_type}
                  onChange={(e) => setVoucherFormData({ ...voucherFormData, discount_type: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-hidden"
                >
                  <option value="percent">Persentase (%)</option>
                  <option value="fixed">Potongan Nominal (Rp)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nilai Diskon *</label>
                <input
                  type="number"
                  required
                  value={voucherFormData.discount_value}
                  onChange={(e) => setVoucherFormData({ ...voucherFormData, discount_value: e.target.value })}
                  placeholder="Contoh: 15"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-hidden focus:ring-2 focus:ring-coffee-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Min. Belanja (Rp)</label>
                <input
                  type="number"
                  value={voucherFormData.min_order_amount}
                  onChange={(e) => setVoucherFormData({ ...voucherFormData, min_order_amount: e.target.value })}
                  placeholder="Contoh: 30000"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Kuota Pemakaian</label>
                <input
                  type="number"
                  value={voucherFormData.quota}
                  onChange={(e) => setVoucherFormData({ ...voucherFormData, quota: e.target.value })}
                  placeholder="100"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Mulai Berlaku</label>
                <input
                  type="date"
                  value={voucherFormData.start_date}
                  onChange={(e) => setVoucherFormData({ ...voucherFormData, start_date: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Selesai Berlaku</label>
                <input
                  type="date"
                  value={voucherFormData.end_date}
                  onChange={(e) => setVoucherFormData({ ...voucherFormData, end_date: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-hidden"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-3 border-t border-gray-100 justify-end">
              <button
                type="button"
                onClick={() => setIsVoucherModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-gray-200 hover:bg-gray-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmittingVoucher}
                className="px-4 py-2 text-xs font-bold text-white bg-coffee-600 hover:bg-coffee-700 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmittingVoucher ? "Menyimpan..." : "Buat Voucher"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Customer Confirm */}
      <ConfirmDialog
        isOpen={!!deletingCustId}
        onClose={() => setDeletingCustId(null)}
        onConfirm={handleDeleteCustomer}
        title="Hapus Data Pelanggan Ini?"
        message="Apakah Anda yakin ingin menghapus data pelanggan ini dari database CRM?"
        confirmText="Ya, Hapus"
        isLoading={isDeletingCust}
      />
    </div>
  );
}
