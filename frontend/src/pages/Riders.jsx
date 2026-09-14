import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Edit2, Trash2, Bike, Smartphone, PhoneOff, Calendar, UserCheck, MapPin } from "lucide-react";

import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import { formatDateIndo } from "../utils/formatters";
import { usePagination } from "../hooks/usePagination";
import { useDebounce } from "../hooks/useDebounce";
import Pagination from "../components/common/Pagination";
import SearchInput from "../components/common/SearchInput";
import Modal from "../components/common/Modal";
import ConfirmDialog from "../components/common/ConfirmDialog";
import Badge from "../components/common/Badge";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import toast from "react-hot-toast";

export default function Riders() {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const [statusFilter, setStatusFilter] = useState("");
  const [appAccessFilter, setAppAccessFilter] = useState("");

  const { page, limit, total, totalPages, setPage, setLimit, updatePaginationMeta } = usePagination(10);

  // Modals & Forms
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRider, setEditingRider] = useState(null);
  const [deleteRiderId, setDeleteRiderId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    phone: "",
    has_app_access: 0,
    status: "active",
    joined_at: new Date().toISOString().split("T")[0],
    notes: "",
    create_user_account: false,
    username: "",
    password: "",
  });

  const fetchRiders = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.RIDERS.LIST, {
        page,
        limit,
        search: debouncedSearch,
        status: statusFilter || undefined,
        has_app_access: appAccessFilter !== "" ? appAccessFilter : undefined,
      });

      if (res.success) {
        setRiders(res.data || []);
        updatePaginationMeta(res.pagination);
      }
    } catch (err) {
      toast.error("Gagal memuat data rider: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiders();
  }, [page, limit, debouncedSearch, statusFilter, appAccessFilter]);

  const handleOpenCreate = () => {
    setEditingRider(null);
    setFormData({
      code: `RDR-${Math.floor(100 + Math.random() * 900)}`,
      name: "",
      phone: "",
      has_app_access: 0,
      status: "active",
      joined_at: new Date().toISOString().split("T")[0],
      notes: "",
      create_user_account: false,
      username: "",
      password: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rider) => {
    setEditingRider(rider);
    setFormData({
      code: rider.code,
      name: rider.name,
      phone: rider.phone || "",
      has_app_access: rider.has_app_access,
      status: rider.status,
      joined_at: rider.joined_at,
      notes: rider.notes || "",
      create_user_account: false,
      username: "",
      password: "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Nama rider wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingRider) {
        const res = await request.put(API_ENDPOINTS.RIDERS.UPDATE(editingRider.id), formData);
        if (res.success) {
          toast.success("Data rider berhasil diperbarui");
          setIsModalOpen(false);
          fetchRiders();
        } else {
          toast.error(res.message);
        }
      } else {
        const res = await request.post(API_ENDPOINTS.RIDERS.CREATE, formData);
        if (res.success) {
          toast.success("Rider baru berhasil ditambahkan");
          setIsModalOpen(false);
          fetchRiders();
        } else {
          toast.error(res.message);
        }
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteRiderId) return;
    setIsSubmitting(true);
    try {
      const res = await request.delete(API_ENDPOINTS.RIDERS.DELETE(deleteRiderId));
      if (res.success) {
        toast.success("Data rider berhasil dihapus");
        setDeleteRiderId(null);
        fetchRiders();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-espresso">
            Manajemen Data Rider
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Kelola armada rider keliling (baik yang memiliki HP maupun tanpa HP)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/live-tracking"
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-espresso font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <MapPin className="w-4 h-4 text-espresso" />
            <span>Pantau Live GPS</span>
          </Link>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-coffee-600 hover:bg-coffee-700 text-white font-bold text-sm rounded-xl shadow-md shadow-coffee-950/20 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Rider Baru</span>
          </button>
        </div>
      </div>


      {/* Stat Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-amber-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-coffee-700 shrink-0">
            <Bike className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Total Rider</p>
            <p className="text-xl font-extrabold text-espresso">{total || riders.length}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0">
            <PhoneOff className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Tanpa HP</p>
            <p className="text-xl font-extrabold text-amber-900">
              {riders.filter((r) => !r.has_app_access).length}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 border border-blue-300 flex items-center justify-center text-blue-700 shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Punya HP</p>
            <p className="text-xl font-extrabold text-blue-900">
              {riders.filter((r) => r.has_app_access).length}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Rider Aktif</p>
            <p className="text-xl font-extrabold text-emerald-900">
              {riders.filter((r) => r.status === "active").length}
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-amber-100 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Cari kode, nama rider, telepon..."
          className="w-full sm:max-w-md"
        />

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* App Access Filter */}
          <select
            value={appAccessFilter}
            onChange={(e) => setAppAccessFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-espresso focus:ring-2 focus:ring-coffee-400 outline-hidden"
          >
            <option value="">Semua Akses</option>
            <option value="1">Punya HP (Akses)</option>
            <option value="0">Tanpa HP (Manual Kasir)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-espresso focus:ring-2 focus:ring-coffee-400 outline-hidden"
          >
            <option value="">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Riders Table */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-amber-100 shadow-xs space-y-4">
        <div className="overflow-x-auto">
          {loading ? (
            <LoadingSkeleton rows={5} />
          ) : riders.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Bike className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="font-semibold text-sm text-gray-600">Tidak ada data rider ditemukan</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm min-w-[850px] border-collapse">
              <thead className="bg-amber-50/75 text-[11px] font-bold uppercase tracking-wider text-espresso/70 border-b border-amber-100">
                <tr>
                  <th className="py-3.5 px-4 w-28 whitespace-nowrap">Kode</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Nama Rider</th>
                  <th className="py-3.5 px-4 w-36 whitespace-nowrap">No. Telepon</th>
                  <th className="py-3.5 px-4 min-w-[220px] whitespace-nowrap">Metode Input Sales</th>
                  <th className="py-3.5 px-4 w-36 whitespace-nowrap">Tgl Bergabung</th>
                  <th className="py-3.5 px-4 w-28 whitespace-nowrap">Status</th>
                  <th className="py-3.5 px-4 w-24 text-center whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {riders.map((r) => (
                  <tr key={r.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-coffee-700 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold text-coffee-800 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg inline-block">
                        {r.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-100/70 text-coffee-800 flex items-center justify-center font-bold text-xs shrink-0 border border-amber-200/80 shadow-2xs">
                          {r.name?.charAt(0)?.toUpperCase() || "R"}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-espresso leading-tight">{r.name}</p>
                          {r.notes ? (
                            <p className="text-[11px] text-gray-400 font-normal line-clamp-1 mt-0.5 max-w-[220px]">{r.notes}</p>
                          ) : (
                            <p className="text-[11px] text-gray-400 font-normal mt-0.5">Armada Rider Keliling</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 font-medium whitespace-nowrap font-mono text-xs">
                      {r.phone || "-"}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {r.has_app_access ? (
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/90 whitespace-nowrap shadow-2xs">
                          <Smartphone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>Rider Input Sendiri (HP)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-300/90 whitespace-nowrap shadow-2xs">
                          <PhoneOff className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span>Kasir Input (Tanpa HP)</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{formatDateIndo(r.joined_at)}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <Badge variant={r.status === "active" ? "success" : "danger"}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current inline-block mr-1"></span>
                        {r.status === "active" ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(r)}
                          title="Edit Rider"
                          className="p-1.5 text-gray-500 hover:text-coffee-700 hover:bg-amber-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteRiderId(r.id)}
                          title="Hapus Rider"
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
        </div>

        {/* Server-side Pagination */}
        <Pagination
          page={page}
          limit={limit}
          total={total}
          totalPages={totalPages}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRider ? `Edit Data Rider (${editingRider.code})` : "Tambah Rider Baru"}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Kode Rider *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-coffee-700 focus:ring-2 focus:ring-coffee-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Tanggal Bergabung *
              </label>
              <input
                type="date"
                value={formData.joined_at}
                onChange={(e) => setFormData({ ...formData, joined_at: e.target.value })}
                required
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Nama Lengkap Rider *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Rider Ahmad"
              required
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-coffee-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                No. Telepon / WA (Opsional)
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Contoh: 08123456789"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Status Rider
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold"
              >
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </select>
            </div>
          </div>

          {/* App Access Selection */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
            <label className="block text-xs font-bold text-espresso uppercase tracking-wider">
              Metode Input Penjualan Rider:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, has_app_access: 0 })}
                className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                  formData.has_app_access === 0
                    ? "border-amber-600 bg-amber-100/80 font-bold text-amber-950 ring-1 ring-amber-500"
                    : "border-gray-200 bg-white text-gray-600"
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  <PhoneOff className="w-3.5 h-3.5 text-amber-700" />
                  Tanpa HP
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  Catatan fisik disetor ke Kasir / Admin
                </p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, has_app_access: 1 })}
                className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                  formData.has_app_access === 1
                    ? "border-blue-600 bg-blue-50 font-bold text-blue-950 ring-1 ring-blue-500"
                    : "border-gray-200 bg-white text-gray-600"
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                  Punya HP
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  Bisa login & input mandiri via aplikasi
                </p>
              </button>
            </div>
          </div>

          {/* Create User Login Account if has_app_access */}
          {!editingRider && formData.has_app_access === 1 && (
            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold text-blue-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.create_user_account}
                  onChange={(e) => setFormData({ ...formData, create_user_account: e.target.checked })}
                  className="rounded text-coffee-600"
                />
                Buat Akun Login untuk Rider ini sekarang
              </label>

              {formData.create_user_account && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Username login"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-xs"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-xs"
                  />
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Catatan / Area Rute Keliling
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Contoh: Rute keliling Sudirman - Thamrin..."
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
            />
          </div>

          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 hover:bg-gray-100"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 text-sm font-bold text-white bg-coffee-600 hover:bg-coffee-700 rounded-xl transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Data Rider"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteRiderId}
        onClose={() => setDeleteRiderId(null)}
        onConfirm={handleDelete}
        title="Hapus Data Rider?"
        message="Apakah Anda yakin ingin menghapus data rider ini? Seluruh riwayat penjualan tetap akan tersimpan."
        confirmText="Ya, Hapus Rider"
        isLoading={isSubmitting}
      />
    </div>
  );
}
