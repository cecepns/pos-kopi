import React, { useState, useEffect } from "react";
import {
  Truck,
  Plus,
  Search,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Bike,
  Clock,
  ClipboardCheck,
  ShieldAlert,
  Edit,
  Trash2,
  Eye,
  Filter,
  DollarSign,
} from "lucide-react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import { formatRupiah, formatDateIndo, formatDateTimeIndo } from "../utils/formatters";
import { usePagination } from "../hooks/usePagination";
import { useDebounce } from "../hooks/useDebounce";
import { useAuth } from "../hooks/useAuth";
import Pagination from "../components/common/Pagination";
import Modal from "../components/common/Modal";
import ConfirmDialog from "../components/common/ConfirmDialog";
import Badge from "../components/common/Badge";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import toast from "react-hot-toast";

export default function FleetManagement() {
  const { user, isOwner, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("carts"); // 'carts' | 'checklists' | 'damage'

  // ===================== TAB 1: CARTS STATE =====================
  const [carts, setCarts] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loadingCarts, setLoadingCarts] = useState(true);
  const [searchCart, setSearchCart] = useState("");
  const debouncedSearchCart = useDebounce(searchCart, 350);
  const [conditionFilter, setConditionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const { page, limit, total, totalPages, setPage, updatePaginationMeta } = usePagination(10);

  // Cart Modals
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [editingCart, setEditingCart] = useState(null);
  const [cartFormData, setCartFormData] = useState({
    cart_code: "",
    name: "",
    cart_type: "sepeda_listrik",
    condition_status: "good",
    status: "active",
    notes: "",
  });
  const [isSubmittingCart, setIsSubmittingCart] = useState(false);

  // Assign Rider Modal
  const [assigningCart, setAssigningCart] = useState(null);
  const [selectedRiderId, setSelectedRiderId] = useState("");
  const [isSubmittingAssign, setIsSubmittingAssign] = useState(false);

  // Delete Cart Dialog
  const [deletingCartId, setDeletingCartId] = useState(null);
  const [isDeletingCart, setIsDeletingCart] = useState(false);

  // ===================== TAB 2: CHECKLISTS STATE =====================
  const [checklists, setChecklists] = useState([]);
  const [loadingChecklists, setLoadingChecklists] = useState(false);
  const [checklistTypeFilter, setChecklistTypeFilter] = useState("");
  const [checklistDateFilter, setChecklistDateFilter] = useState("");
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [checklistFormData, setChecklistFormData] = useState({
    cart_id: "",
    rider_id: "",
    checklist_type: "pre_sales",
    checklist_date: new Date().toISOString().split("T")[0],
    tire_condition: "good",
    brakes_chain_condition: "good",
    box_ice_cleanliness: "clean",
    cup_sealer_ready: "ready",
    general_cleanliness: "clean",
    notes: "",
  });
  const [isSubmittingChecklist, setIsSubmittingChecklist] = useState(false);

  // ===================== TAB 3: DAMAGE REPORTS STATE =====================
  const [damageReports, setDamageReports] = useState([]);
  const [loadingDamage, setLoadingDamage] = useState(false);
  const [damageStatusFilter, setDamageStatusFilter] = useState("");
  const [isDamageModalOpen, setIsDamageModalOpen] = useState(false);
  const [damageFormData, setDamageFormData] = useState({
    cart_id: "",
    rider_id: "",
    title: "",
    description: "",
    severity: "medium",
  });
  const [damagePhoto, setDamagePhoto] = useState(null);
  const [isSubmittingDamage, setIsSubmittingDamage] = useState(false);

  // Update Damage Status Modal
  const [resolvingDamage, setResolvingDamage] = useState(null);
  const [resolveFormData, setResolveFormData] = useState({
    status: "repaired",
    repair_cost: 0,
  });
  const [isSubmittingResolve, setIsSubmittingResolve] = useState(false);

  // Fetch Carts
  const fetchCarts = async () => {
    setLoadingCarts(true);
    try {
      const res = await request.get(API_ENDPOINTS.CARTS.LIST, {
        page,
        limit,
        search: debouncedSearchCart,
        status: statusFilter || undefined,
        condition_status: conditionFilter || undefined,
      });
      if (res.success) {
        setCarts(res.data || []);
        updatePaginationMeta(res.pagination);
      }
    } catch (err) {
      toast.error("Gagal memuat armada: " + err.message);
    } finally {
      setLoadingCarts(false);
    }
  };

  // Fetch Riders for Dropdown
  const fetchRiders = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.RIDERS.ACTIVE_LIST);
      if (res.success) setRiders(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Checklists
  const fetchChecklists = async () => {
    setLoadingChecklists(true);
    try {
      const res = await request.get(API_ENDPOINTS.CARTS.CHECKLISTS, {
        checklist_type: checklistTypeFilter || undefined,
        date: checklistDateFilter || undefined,
      });
      if (res.success) setChecklists(res.data || []);
    } catch (err) {
      toast.error("Gagal memuat checklist: " + err.message);
    } finally {
      setLoadingChecklists(false);
    }
  };

  // Fetch Damage Reports
  const fetchDamageReports = async () => {
    setLoadingDamage(true);
    try {
      const res = await request.get(API_ENDPOINTS.CARTS.DAMAGE_REPORTS, {
        status: damageStatusFilter || undefined,
      });
      if (res.success) setDamageReports(res.data || []);
    } catch (err) {
      toast.error("Gagal memuat laporan kerusakan: " + err.message);
    } finally {
      setLoadingDamage(false);
    }
  };

  useEffect(() => {
    fetchRiders();
  }, []);

  useEffect(() => {
    if (activeTab === "carts") fetchCarts();
    else if (activeTab === "checklists") fetchChecklists();
    else if (activeTab === "damage") fetchDamageReports();
  }, [activeTab, page, limit, debouncedSearchCart, statusFilter, conditionFilter, checklistTypeFilter, checklistDateFilter, damageStatusFilter]);

  // Handle Save Cart
  const handleSaveCart = async (e) => {
    e.preventDefault();
    setIsSubmittingCart(true);
    try {
      if (editingCart) {
        const res = await request.put(API_ENDPOINTS.CARTS.UPDATE(editingCart.id), cartFormData);
        if (res.success) {
          toast.success("Armada berhasil diperbarui");
          setIsCartModalOpen(false);
          fetchCarts();
        }
      } else {
        const res = await request.post(API_ENDPOINTS.CARTS.CREATE, cartFormData);
        if (res.success) {
          toast.success("Armada baru berhasil didaftarkan");
          setIsCartModalOpen(false);
          fetchCarts();
        }
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmittingCart(false);
    }
  };

  // Handle Assign Rider
  const handleAssignRider = async (e) => {
    e.preventDefault();
    if (!assigningCart) return;
    setIsSubmittingAssign(true);
    try {
      const res = await request.post(API_ENDPOINTS.CARTS.ASSIGN_RIDER(assigningCart.id), {
        rider_id: selectedRiderId || null,
      });
      if (res.success) {
        toast.success(selectedRiderId ? "Rider berhasil ditugaskan ke armada ini" : "Armada dikembalikan ke pangkalan");
        setAssigningCart(null);
        fetchCarts();
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmittingAssign(false);
    }
  };

  // Handle Delete Cart
  const handleDeleteCart = async () => {
    if (!deletingCartId) return;
    setIsDeletingCart(true);
    try {
      const res = await request.delete(API_ENDPOINTS.CARTS.DELETE(deletingCartId));
      if (res.success) {
        toast.success("Armada berhasil dihapus");
        setDeletingCartId(null);
        fetchCarts();
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsDeletingCart(false);
    }
  };

  // Handle Save Checklist
  const handleSaveChecklist = async (e) => {
    e.preventDefault();
    setIsSubmittingChecklist(true);
    try {
      const res = await request.post(API_ENDPOINTS.CARTS.CREATE_CHECKLIST, checklistFormData);
      if (res.success) {
        toast.success("Checklist inspeksi berhasil dicatat");
        setIsChecklistModalOpen(false);
        fetchChecklists();
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmittingChecklist(false);
    }
  };

  // Handle Save Damage Report
  const handleSaveDamage = async (e) => {
    e.preventDefault();
    setIsSubmittingDamage(true);
    try {
      const formData = new FormData();
      formData.append("cart_id", damageFormData.cart_id);
      if (damageFormData.rider_id) formData.append("rider_id", damageFormData.rider_id);
      formData.append("title", damageFormData.title);
      formData.append("description", damageFormData.description);
      formData.append("severity", damageFormData.severity);
      if (damagePhoto) formData.append("photo", damagePhoto);

      const res = await request.post(API_ENDPOINTS.CARTS.CREATE_DAMAGE_REPORT, formData);
      if (res.success) {
        toast.success("Laporan kerusakan berhasil dikirim");
        setIsDamageModalOpen(false);
        setDamagePhoto(null);
        fetchDamageReports();
        fetchCarts();
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmittingDamage(false);
    }
  };

  // Handle Resolve Damage
  const handleResolveDamage = async (e) => {
    e.preventDefault();
    if (!resolvingDamage) return;
    setIsSubmittingResolve(true);
    try {
      const res = await request.put(API_ENDPOINTS.CARTS.UPDATE_DAMAGE_REPORT(resolvingDamage.id), resolveFormData);
      if (res.success) {
        toast.success("Status perbaikan armada diperbarui");
        setResolvingDamage(null);
        fetchDamageReports();
        fetchCarts();
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmittingResolve(false);
    }
  };

  // Stats calculation
  const totalInUse = carts.filter((c) => c.current_rider_id || c.status === "in_use").length;
  const totalNeedsRepair = carts.filter((c) => c.condition_status === "needs_repair" || c.condition_status === "broken").length;
  const totalGood = carts.filter((c) => c.condition_status === "good").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-espresso flex items-center gap-2.5">
            <Truck className="w-6 h-6 text-coffee-600" />
            <span>Manajemen Armada & Cart Kopi</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Tracking gerobak keliling, penugasan rider, inspeksi harian, dan laporan kerusakan armada.
          </p>
        </div>

        {/* Tab-based Actions */}
        <div className="flex items-center gap-2">
          {activeTab === "carts" && (
            <button
              type="button"
              onClick={() => {
                setEditingCart(null);
                setCartFormData({
                  cart_code: `CART-${(carts.length + 1).toString().padStart(2, "0")}`,
                  name: "",
                  cart_type: "sepeda_listrik",
                  condition_status: "good",
                  status: "active",
                  notes: "",
                });
                setIsCartModalOpen(true);
              }}
              className="px-4 py-2.5 bg-coffee-600 hover:bg-coffee-700 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Cart</span>
            </button>
          )}

          {activeTab === "checklists" && (
            <button
              type="button"
              onClick={() => {
                setChecklistFormData({
                  cart_id: carts[0]?.id || "",
                  rider_id: riders[0]?.id || "",
                  checklist_type: "pre_sales",
                  checklist_date: new Date().toISOString().split("T")[0],
                  tire_condition: "good",
                  brakes_chain_condition: "good",
                  box_ice_cleanliness: "clean",
                  cup_sealer_ready: "ready",
                  general_cleanliness: "clean",
                  notes: "",
                });
                setIsChecklistModalOpen(true);
              }}
              className="px-4 py-2.5 bg-coffee-600 hover:bg-coffee-700 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Isi Checklist</span>
            </button>
          )}

          {activeTab === "damage" && (
            <button
              type="button"
              onClick={() => {
                setDamageFormData({
                  cart_id: carts[0]?.id || "",
                  rider_id: riders[0]?.id || "",
                  title: "",
                  description: "",
                  severity: "medium",
                });
                setDamagePhoto(null);
                setIsDamageModalOpen(true);
              }}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Lapor Kerusakan</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-3xl border border-amber-100 shadow-2xs">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Total Armada</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-espresso">{total} Unit</span>
            <Bike className="w-5 h-5 text-coffee-600" />
          </div>
          <span className="text-[10px] text-gray-400 mt-1 block">Gerobak & sepeda terdaftar</span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-amber-100 shadow-2xs">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Sedang Beroperasi</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-coffee-700">{totalInUse} Unit</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">Dibawa oleh rider</span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-amber-100 shadow-2xs">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Kondisi Prima</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-emerald-600">{totalGood} Unit</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <span className="text-[10px] text-gray-400 mt-1 block">Siap bertugas keliling</span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-amber-100 shadow-2xs">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Perlu Perbaikan</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-red-600">{totalNeedsRepair} Unit</span>
            <Wrench className="w-5 h-5 text-red-500" />
          </div>
          <span className="text-[10px] text-red-500 font-semibold mt-1 block">Butuh servis pangkalan</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200 gap-6 text-sm font-bold">
        <button
          type="button"
          onClick={() => setActiveTab("carts")}
          className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "carts"
              ? "border-coffee-600 text-coffee-700 font-extrabold"
              : "border-transparent text-gray-400 hover:text-gray-700"
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Daftar Cart & Penugasan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("checklists")}
          className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "checklists"
              ? "border-coffee-600 text-coffee-700 font-extrabold"
              : "border-transparent text-gray-400 hover:text-gray-700"
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>Checklist Sebelum / Sesudah Jualan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("damage")}
          className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "damage"
              ? "border-red-600 text-red-600 font-extrabold"
              : "border-transparent text-gray-400 hover:text-gray-700"
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Laporan Kerusakan Armada</span>
        </button>
      </div>

      {/* ======================= TAB 1: CARTS TABLE ======================= */}
      {activeTab === "carts" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-3xl border border-amber-100 shadow-2xs flex flex-col sm:flex-row gap-3 justify-between items-center">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={searchCart}
                onChange={(e) => setSearchCart(e.target.value)}
                placeholder="Cari kode cart, nama, atau rider..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm outline-hidden focus:ring-2 focus:ring-coffee-400"
              />
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <select
                value={conditionFilter}
                onChange={(e) => setConditionFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-hidden"
              >
                <option value="">Semua Kondisi</option>
                <option value="good">Kondisi Baik</option>
                <option value="fair">Kondisi Cukup</option>
                <option value="needs_repair">Perlu Servis</option>
                <option value="broken">Rusak</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-hidden"
              >
                <option value="">Semua Status</option>
                <option value="active">Standby / Aktif</option>
                <option value="in_use">Sedang Digunakan</option>
                <option value="maintenance">Dalam Perbaikan</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-3xl p-5 border border-amber-100 shadow-xs overflow-x-auto">
            {loadingCarts ? (
              <LoadingSkeleton rows={5} />
            ) : carts.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <Truck className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p className="font-semibold text-sm">Tidak ada armada ditemukan</p>
                <p className="text-xs text-gray-400 mt-0.5">Daftarkan cart baru melalui tombol di atas.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-amber-50/60 uppercase font-bold text-[10px] text-gray-600 border-b border-amber-100">
                  <tr>
                    <th className="py-3 px-3">Kode Cart</th>
                    <th className="py-3 px-3">Nama Armada</th>
                    <th className="py-3 px-3">Tipe</th>
                    <th className="py-3 px-3">Digunakan Siapa</th>
                    <th className="py-3 px-3">Kondisi Fisik</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Servis Terakhir</th>
                    <th className="py-3 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {carts.map((c) => (
                    <tr key={c.id} className="hover:bg-amber-50/20 transition-colors">
                      <td className="py-3 px-3 font-extrabold text-espresso">
                        <span className="bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-200">
                          {c.cart_code}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-gray-800">{c.name}</td>
                      <td className="py-3 px-3 text-gray-600 capitalize">
                        {c.cart_type.replace("_", " ")}
                      </td>
                      <td className="py-3 px-3">
                        {c.current_rider_name ? (
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="font-bold text-espresso">{c.current_rider_name}</span>
                            <span className="text-[10px] text-gray-400">({c.current_rider_code})</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Pangkalan (Standby)</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={
                            c.condition_status === "good"
                              ? "success"
                              : c.condition_status === "fair"
                              ? "coffee"
                              : "danger"
                          }
                          className="capitalize text-[10px]"
                        >
                          {c.condition_status === "good"
                            ? "Sangat Baik"
                            : c.condition_status === "fair"
                            ? "Cukup"
                            : c.condition_status === "needs_repair"
                            ? "Perlu Servis"
                            : "Rusak"}
                        </Badge>
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={
                            c.status === "in_use"
                              ? "coffee"
                              : c.status === "active"
                              ? "success"
                              : "danger"
                          }
                          className="capitalize text-[10px]"
                        >
                          {c.status === "in_use"
                            ? "In Use"
                            : c.status === "active"
                            ? "Standby"
                            : "Maintenance"}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-gray-500">
                        {c.last_service_date ? formatDateIndo(c.last_service_date) : "-"}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setAssigningCart(c);
                              setSelectedRiderId(c.current_rider_id ? String(c.current_rider_id) : "");
                            }}
                            title="Tugaskan Rider"
                            className="p-1.5 text-gray-500 hover:text-coffee-700 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCart(c);
                              setCartFormData({
                                cart_code: c.cart_code,
                                name: c.name,
                                cart_type: c.cart_type,
                                condition_status: c.condition_status,
                                status: c.status,
                                notes: c.notes || "",
                                last_service_date: c.last_service_date || "",
                              });
                              setIsCartModalOpen(true);
                            }}
                            title="Edit Cart"
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingCartId(c.id)}
                            title="Hapus Cart"
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

      {/* ======================= TAB 2: CHECKLISTS ======================= */}
      {activeTab === "checklists" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-3xl border border-amber-100 shadow-2xs flex flex-col sm:flex-row gap-3 justify-between items-center">
            <div className="flex gap-2 w-full sm:w-auto">
              <select
                value={checklistTypeFilter}
                onChange={(e) => setChecklistTypeFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-hidden"
              >
                <option value="">Semua Tipe Checklist</option>
                <option value="pre_sales">Sebelum Jualan (Pre-Sales)</option>
                <option value="post_sales">Sesudah Jualan (Post-Sales)</option>
              </select>

              <input
                type="date"
                value={checklistDateFilter}
                onChange={(e) => setChecklistDateFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-hidden"
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-amber-100 shadow-xs overflow-x-auto">
            {loadingChecklists ? (
              <LoadingSkeleton rows={5} />
            ) : checklists.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <ClipboardCheck className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p className="font-semibold text-sm">Belum ada riwayat checklist inspeksi</p>
                <p className="text-xs text-gray-400 mt-0.5">Isi checklist sebelum rider mulai keliling.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs min-w-[750px]">
                <thead className="bg-amber-50/60 uppercase font-bold text-[10px] text-gray-600 border-b border-amber-100">
                  <tr>
                    <th className="py-3 px-3">Tanggal</th>
                    <th className="py-3 px-3">Tipe</th>
                    <th className="py-3 px-3">Cart & Rider</th>
                    <th className="py-3 px-3">Kondisi Ban</th>
                    <th className="py-3 px-3">Rem & Rantai</th>
                    <th className="py-3 px-3">Box Es / Termos</th>
                    <th className="py-3 px-3">Cup Sealer</th>
                    <th className="py-3 px-3">Kebersihan Umum</th>
                    <th className="py-3 px-3">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {checklists.map((chk) => (
                    <tr key={chk.id} className="hover:bg-amber-50/20">
                      <td className="py-3 px-3 font-semibold text-gray-700 whitespace-nowrap">
                        {formatDateIndo(chk.checklist_date)}
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant={chk.checklist_type === "pre_sales" ? "coffee" : "default"} className="text-[10px]">
                          {chk.checklist_type === "pre_sales" ? "Pre-Sales (Awal)" : "Post-Sales (Akhir)"}
                        </Badge>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-espresso">{chk.cart_code} - {chk.cart_name}</div>
                        <div className="text-[10px] text-gray-500">Rider: {chk.rider_name}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${chk.tire_condition === 'good' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                          {chk.tire_condition === 'good' ? 'Baik' : 'Kurang'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${chk.brakes_chain_condition === 'good' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                          {chk.brakes_chain_condition === 'good' ? 'Baik' : 'Kurang'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${chk.box_ice_cleanliness === 'clean' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          {chk.box_ice_cleanliness === 'clean' ? 'Bersih' : 'Kotor'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${chk.cup_sealer_ready === 'ready' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                          {chk.cup_sealer_ready === 'ready' ? 'Siap' : 'Kendala'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${chk.general_cleanliness === 'clean' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          {chk.general_cleanliness === 'clean' ? 'Bersih' : 'Kotor'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-500 italic max-w-[150px] truncate" title={chk.notes}>
                        {chk.notes || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ======================= TAB 3: DAMAGE REPORTS ======================= */}
      {activeTab === "damage" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-3xl border border-amber-100 shadow-2xs flex justify-between items-center">
            <select
              value={damageStatusFilter}
              onChange={(e) => setDamageStatusFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-hidden"
            >
              <option value="">Semua Status Kerusakan</option>
              <option value="reported">Dilaporkan (Pending)</option>
              <option value="in_repair">Sedang Diperbaiki</option>
              <option value="repaired">Selesai Diperbaiki</option>
            </select>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-amber-100 shadow-xs overflow-x-auto">
            {loadingDamage ? (
              <LoadingSkeleton rows={5} />
            ) : damageReports.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-2" />
                <p className="font-semibold text-sm">Tidak ada laporan kerusakan aktif</p>
                <p className="text-xs text-gray-400 mt-0.5">Semua armada dalam kondisi baik.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-amber-50/60 uppercase font-bold text-[10px] text-gray-600 border-b border-amber-100">
                  <tr>
                    <th className="py-3 px-3">Tanggal Lapor</th>
                    <th className="py-3 px-3">Armada Cart</th>
                    <th className="py-3 px-3">Pelapor / Rider</th>
                    <th className="py-3 px-3">Kerusakan</th>
                    <th className="py-3 px-3">Urgensi</th>
                    <th className="py-3 px-3">Biaya Servis</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-center">Tindak Lanjut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {damageReports.map((d) => (
                    <tr key={d.id} className="hover:bg-amber-50/20">
                      <td className="py-3 px-3 text-gray-600 whitespace-nowrap">
                        {formatDateTimeIndo(d.created_at)}
                      </td>
                      <td className="py-3 px-3 font-bold text-espresso">
                        {d.cart_code} - {d.cart_name}
                      </td>
                      <td className="py-3 px-3 text-gray-700">
                        <span className="font-semibold">{d.rider_name || d.reporter_name}</span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-gray-900">{d.title}</div>
                        <div className="text-[10px] text-gray-500 line-clamp-1">{d.description}</div>
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={
                            d.severity === "critical"
                              ? "danger"
                              : d.severity === "high"
                              ? "danger"
                              : d.severity === "medium"
                              ? "coffee"
                              : "default"
                          }
                          className="capitalize text-[10px]"
                        >
                          {d.severity}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 font-extrabold text-coffee-800">
                        {d.repair_cost > 0 ? formatRupiah(d.repair_cost) : "-"}
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={
                            d.status === "repaired"
                              ? "success"
                              : d.status === "in_repair"
                              ? "coffee"
                              : "danger"
                          }
                          className="capitalize text-[10px]"
                        >
                          {d.status === "reported"
                            ? "Dilaporkan"
                            : d.status === "in_repair"
                            ? "Dalam Servis"
                            : "Selesai"}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setResolvingDamage(d);
                            setResolveFormData({
                              status: d.status === "reported" ? "in_repair" : "repaired",
                              repair_cost: d.repair_cost || 0,
                            });
                          }}
                          className="px-2.5 py-1.5 bg-coffee-100 hover:bg-coffee-200 text-coffee-800 font-bold rounded-xl text-[10px] transition-colors cursor-pointer"
                        >
                          Update Status
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ======================= MODAL: CREATE / EDIT CART ======================= */}
      {isCartModalOpen && (
        <Modal
          isOpen={isCartModalOpen}
          onClose={() => setIsCartModalOpen(false)}
          title={editingCart ? "Edit Data Armada Cart" : "Daftarkan Armada Cart Baru"}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSaveCart} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Kode Cart / Nomor Lambung *</label>
              <input
                type="text"
                required
                value={cartFormData.cart_code}
                onChange={(e) => setCartFormData({ ...cartFormData, cart_code: e.target.value })}
                placeholder="Contoh: CART-01"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs uppercase outline-hidden focus:ring-2 focus:ring-coffee-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nama Armada / Gerobak *</label>
              <input
                type="text"
                required
                value={cartFormData.name}
                onChange={(e) => setCartFormData({ ...cartFormData, name: e.target.value })}
                placeholder="Contoh: Sepeda Listrik Sudirman 01"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-hidden focus:ring-2 focus:ring-coffee-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tipe Kendaraan</label>
                <select
                  value={cartFormData.cart_type}
                  onChange={(e) => setCartFormData({ ...cartFormData, cart_type: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-hidden"
                >
                  <option value="sepeda_listrik">Sepeda Listrik</option>
                  <option value="gerobak_motor">Gerobak Motor</option>
                  <option value="gerobak_dorong">Gerobak Dorong</option>
                  <option value="motor_box">Motor Box</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Kondisi Fisik</label>
                <select
                  value={cartFormData.condition_status}
                  onChange={(e) => setCartFormData({ ...cartFormData, condition_status: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-hidden"
                >
                  <option value="good">Sangat Baik</option>
                  <option value="fair">Cukup</option>
                  <option value="needs_repair">Perlu Servis</option>
                  <option value="broken">Rusak</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Catatan / Keterangan</label>
              <textarea
                rows={2}
                value={cartFormData.notes}
                onChange={(e) => setCartFormData({ ...cartFormData, notes: e.target.value })}
                placeholder="Catatan nomor rangka, spesifikasi box..."
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-hidden focus:ring-2 focus:ring-coffee-400"
              />
            </div>

            <div className="flex gap-2.5 pt-3 border-t border-gray-100 justify-end">
              <button
                type="button"
                onClick={() => setIsCartModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-gray-200 hover:bg-gray-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmittingCart}
                className="px-4 py-2 text-xs font-bold text-white bg-coffee-600 hover:bg-coffee-700 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmittingCart ? "Menyimpan..." : "Simpan Armada"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ======================= MODAL: ASSIGN RIDER ======================= */}
      {assigningCart && (
        <Modal
          isOpen={!!assigningCart}
          onClose={() => setAssigningCart(null)}
          title={`Tugaskan Rider ke ${assigningCart.cart_code}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleAssignRider} className="space-y-4">
            <p className="text-xs text-gray-600">
              Pilih rider yang akan membawa gerobak <strong>{assigningCart.name}</strong> hari ini.
            </p>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Pilih Rider</label>
              <select
                value={selectedRiderId}
                onChange={(e) => setSelectedRiderId(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-hidden focus:ring-2 focus:ring-coffee-400 font-medium"
              >
                <option value="">-- Kembalikan ke Pangkalan (Tanpa Rider) --</option>
                {riders.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.code}) {r.phone ? `- ${r.phone}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2.5 pt-3 border-t border-gray-100 justify-end">
              <button
                type="button"
                onClick={() => setAssigningCart(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-gray-200 hover:bg-gray-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmittingAssign}
                className="px-4 py-2 text-xs font-bold text-white bg-coffee-600 hover:bg-coffee-700 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmittingAssign ? "Menyimpan..." : "Simpan Penugasan"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ======================= MODAL: CHECKLIST ======================= */}
      {isChecklistModalOpen && (
        <Modal
          isOpen={isChecklistModalOpen}
          onClose={() => setIsChecklistModalOpen(false)}
          title="Formulir Checklist Inspeksi Armada"
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleSaveChecklist} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Pilih Cart *</label>
                <select
                  required
                  value={checklistFormData.cart_id}
                  onChange={(e) => setChecklistFormData({ ...checklistFormData, cart_id: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-hidden"
                >
                  <option value="">-- Pilih Cart --</option>
                  {carts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.cart_code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Pilih Rider *</label>
                <select
                  required
                  value={checklistFormData.rider_id}
                  onChange={(e) => setChecklistFormData({ ...checklistFormData, rider_id: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-hidden"
                >
                  <option value="">-- Pilih Rider --</option>
                  {riders.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tahap Checklist</label>
                <select
                  value={checklistFormData.checklist_type}
                  onChange={(e) => setChecklistFormData({ ...checklistFormData, checklist_type: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-hidden font-bold"
                >
                  <option value="pre_sales">Sebelum Jualan (Pre-Sales)</option>
                  <option value="post_sales">Sesudah Jualan (Post-Sales)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal</label>
                <input
                  type="date"
                  value={checklistFormData.checklist_date}
                  onChange={(e) => setChecklistFormData({ ...checklistFormData, checklist_date: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-hidden"
                />
              </div>
            </div>

            {/* Checklist Items */}
            <div className="space-y-2.5 bg-amber-50/50 p-3.5 rounded-2xl border border-amber-100">
              <span className="text-xs font-extrabold text-espresso block mb-1">Item Penilaian Kelaikan:</span>

              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-700 font-medium">1. Tekanan & Kondisi Ban:</span>
                <select
                  value={checklistFormData.tire_condition}
                  onChange={(e) => setChecklistFormData({ ...checklistFormData, tire_condition: e.target.value })}
                  className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs"
                >
                  <option value="good">Baik / Kencang</option>
                  <option value="bad">Kurang / Bocor</option>
                </select>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-700 font-medium">2. Rem & Rantai / Mesin:</span>
                <select
                  value={checklistFormData.brakes_chain_condition}
                  onChange={(e) => setChecklistFormData({ ...checklistFormData, brakes_chain_condition: e.target.value })}
                  className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs"
                >
                  <option value="good">Pakem / Lancar</option>
                  <option value="bad">Kendor / Macet</option>
                </select>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-700 font-medium">3. Kebersihan Box Es / Termos:</span>
                <select
                  value={checklistFormData.box_ice_cleanliness}
                  onChange={(e) => setChecklistFormData({ ...checklistFormData, box_ice_cleanliness: e.target.value })}
                  className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs"
                >
                  <option value="clean">Bersih & Higienis</option>
                  <option value="dirty">Kotor / Perlu Dicuci</option>
                </select>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-700 font-medium">4. Kesiapan Cup Sealer:</span>
                <select
                  value={checklistFormData.cup_sealer_ready}
                  onChange={(e) => setChecklistFormData({ ...checklistFormData, cup_sealer_ready: e.target.value })}
                  className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs"
                >
                  <option value="ready">Siap Pakai</option>
                  <option value="not_ready">Macet / Tidak Siap</option>
                </select>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-700 font-medium">5. Kebersihan Umum Cart:</span>
                <select
                  value={checklistFormData.general_cleanliness}
                  onChange={(e) => setChecklistFormData({ ...checklistFormData, general_cleanliness: e.target.value })}
                  className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs"
                >
                  <option value="clean">Bersih & Rapi</option>
                  <option value="dirty">Perlu Dibersihkan</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Catatan Tambahan</label>
              <textarea
                rows={2}
                value={checklistFormData.notes}
                onChange={(e) => setChecklistFormData({ ...checklistFormData, notes: e.target.value })}
                placeholder="Catatan kendala ban, box termos, atau perlengkapan..."
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-hidden focus:ring-2 focus:ring-coffee-400"
              />
            </div>

            <div className="flex gap-2.5 pt-3 border-t border-gray-100 justify-end">
              <button
                type="button"
                onClick={() => setIsChecklistModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-gray-200 hover:bg-gray-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmittingChecklist}
                className="px-4 py-2 text-xs font-bold text-white bg-coffee-600 hover:bg-coffee-700 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmittingChecklist ? "Menyimpan..." : "Simpan Checklist"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ======================= MODAL: LAPOR KERUSAKAN ======================= */}
      {isDamageModalOpen && (
        <Modal
          isOpen={isDamageModalOpen}
          onClose={() => setIsDamageModalOpen(false)}
          title="Lapor Kerusakan Armada"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSaveDamage} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Pilih Cart Yang Bermasalah *</label>
              <select
                required
                value={damageFormData.cart_id}
                onChange={(e) => setDamageFormData({ ...damageFormData, cart_id: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-hidden"
              >
                <option value="">-- Pilih Cart --</option>
                {carts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.cart_code} - {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Judul Kendala / Kerusakan *</label>
              <input
                type="text"
                required
                value={damageFormData.title}
                onChange={(e) => setDamageFormData({ ...damageFormData, title: e.target.value })}
                placeholder="Contoh: Rantai putus / Rem blong / Cup sealer rusak"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-hidden focus:ring-2 focus:ring-coffee-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Tingkat Urgensi</label>
              <select
                value={damageFormData.severity}
                onChange={(e) => setDamageFormData({ ...damageFormData, severity: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-hidden font-bold"
              >
                <option value="low">Rendah (Masih Bisa Jalan)</option>
                <option value="medium">Sedang (Perlu Dicek)</option>
                <option value="high">Tinggi (Mogok)</option>
                <option value="critical">Kritis (Bahaya / Rusak Berat)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Deskripsi Kerusakan *</label>
              <textarea
                required
                rows={3}
                value={damageFormData.description}
                onChange={(e) => setDamageFormData({ ...damageFormData, description: e.target.value })}
                placeholder="Jelaskan detail kronologi kerusakan armada..."
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-hidden focus:ring-2 focus:ring-coffee-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Foto Bukti Kerusakan (Opsional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setDamagePhoto(e.target.files[0])}
                className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-coffee-800 hover:file:bg-amber-200"
              />
            </div>

            <div className="flex gap-2.5 pt-3 border-t border-gray-100 justify-end">
              <button
                type="button"
                onClick={() => setIsDamageModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-gray-200 hover:bg-gray-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmittingDamage}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmittingDamage ? "Mengirim..." : "Kirim Laporan"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ======================= MODAL: RESOLVE DAMAGE ======================= */}
      {resolvingDamage && (
        <Modal
          isOpen={!!resolvingDamage}
          onClose={() => setResolvingDamage(null)}
          title={`Tindak Lanjut Perbaikan: ${resolvingDamage.title}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleResolveDamage} className="space-y-4">
            <div className="bg-amber-50/60 p-3 rounded-2xl text-xs text-gray-700 border border-amber-200/60">
              <div className="font-bold text-espresso">{resolvingDamage.cart_code} - {resolvingDamage.cart_name}</div>
              <p className="text-gray-500 mt-0.5">{resolvingDamage.description}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Status Perbaikan</label>
              <select
                value={resolveFormData.status}
                onChange={(e) => setResolveFormData({ ...resolveFormData, status: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-hidden font-bold"
              >
                <option value="in_repair">Sedang Dalam Servis</option>
                <option value="repaired">Selesai Diperbaiki (Armada Siap Pakai)</option>
                <option value="cancelled">Dibatalkan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Biaya Servis / Sparepart (Rp)</label>
              <input
                type="number"
                value={resolveFormData.repair_cost}
                onChange={(e) => setResolveFormData({ ...resolveFormData, repair_cost: e.target.value })}
                placeholder="Contoh: 150000"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-hidden focus:ring-2 focus:ring-coffee-400"
              />
            </div>

            <div className="flex gap-2.5 pt-3 border-t border-gray-100 justify-end">
              <button
                type="button"
                onClick={() => setResolvingDamage(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-gray-200 hover:bg-gray-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmittingResolve}
                className="px-4 py-2 text-xs font-bold text-white bg-coffee-600 hover:bg-coffee-700 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmittingResolve ? "Menyimpan..." : "Simpan Status"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Cart Confirm */}
      <ConfirmDialog
        isOpen={!!deletingCartId}
        onClose={() => setDeletingCartId(null)}
        onConfirm={handleDeleteCart}
        title="Hapus Armada Ini?"
        message="Apakah Anda yakin ingin menghapus data armada ini dari sistem? Penugasan rider pada cart ini akan dilepas."
        confirmText="Ya, Hapus Armada"
        isLoading={isDeletingCart}
      />
    </div>
  );
}
