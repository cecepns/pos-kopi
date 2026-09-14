import React, { useState, useEffect } from "react";
import { Plus, Users as UsersIcon, Edit2, Trash2, Shield, User } from "lucide-react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import { usePagination } from "../hooks/usePagination";
import { useDebounce } from "../hooks/useDebounce";
import Pagination from "../components/common/Pagination";
import SearchInput from "../components/common/SearchInput";
import Modal from "../components/common/Modal";
import ConfirmDialog from "../components/common/ConfirmDialog";
import Badge from "../components/common/Badge";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import toast from "react-hot-toast";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const [roleFilter, setRoleFilter] = useState("");

  const { page, limit, total, totalPages, setPage, setLimit, updatePaginationMeta } = usePagination(10);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    role: "admin",
    phone: "",
    status: "active",
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.USERS.LIST, {
        page,
        limit,
        search: debouncedSearch,
        role: roleFilter || undefined,
      });

      if (res.success) {
        setUsers(res.data || []);
        updatePaginationMeta(res.pagination);
      }
    } catch (err) {
      toast.error("Gagal memuat pengguna: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, limit, debouncedSearch, roleFilter]);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      name: "",
      username: "",
      password: "",
      role: "admin",
      phone: "",
      status: "active",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u) => {
    setEditingUser(u);
    setFormData({
      name: u.name,
      username: u.username,
      password: "", // Leave blank if not changing
      role: u.role,
      phone: u.phone || "",
      status: u.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.username) {
      toast.error("Lengkapi nama dan username");
      return;
    }
    if (!editingUser && !formData.password) {
      toast.error("Password wajib diisi untuk user baru");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingUser) {
        const res = await request.put(API_ENDPOINTS.USERS.UPDATE(editingUser.id), formData);
        if (res.success) {
          toast.success("User berhasil diperbarui");
          setIsModalOpen(false);
          fetchUsers();
        } else {
          toast.error(res.message);
        }
      } else {
        const res = await request.post(API_ENDPOINTS.USERS.CREATE, formData);
        if (res.success) {
          toast.success("User berhasil dibuat");
          setIsModalOpen(false);
          fetchUsers();
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
    if (!deleteUserId) return;
    setIsSubmitting(true);
    try {
      const res = await request.delete(API_ENDPOINTS.USERS.DELETE(deleteUserId));
      if (res.success) {
        toast.success("User berhasil dihapus");
        setDeleteUserId(null);
        fetchUsers();
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-espresso">
            Manajemen Pengguna (User)
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Kelola akun Owner, Admin/Kasir, dan Akun Rider aplikasi
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-coffee-600 hover:bg-coffee-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tambah Pengguna</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-amber-100 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Cari nama, username..."
          className="w-full sm:max-w-md"
        />

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-espresso focus:ring-2 focus:ring-coffee-400 outline-hidden"
        >
          <option value="">Semua Peran (Role)</option>
          <option value="owner">Owner</option>
          <option value="admin">Admin / Kasir</option>
          <option value="rider">Rider</option>
        </select>
      </div>

      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-amber-100 shadow-xs space-y-4">
        <div className="overflow-x-auto">
          {loading ? (
            <LoadingSkeleton rows={4} />
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <UsersIcon className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="font-semibold text-sm text-gray-600">Tidak ada pengguna ditemukan</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm min-w-[760px] border-collapse">
              <thead className="bg-amber-50/75 text-[11px] font-bold uppercase tracking-wider text-espresso/70 border-b border-amber-100">
                <tr>
                  <th className="py-3.5 px-4 min-w-[180px]">Nama</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Username</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Peran (Role)</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Telepon</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-espresso">{u.name}</td>
                    <td className="py-3.5 px-4 font-mono text-gray-600 whitespace-nowrap">{u.username}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        u.role === "owner"
                          ? "bg-purple-100 text-purple-700"
                          : u.role === "admin"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 whitespace-nowrap font-mono text-xs">{u.phone || "-"}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <Badge variant={u.status === "active" ? "success" : "danger"}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current inline-block mr-1"></span>
                        {u.status === "active" ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 text-gray-500 hover:text-coffee-700 hover:bg-amber-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {u.id !== 1 && (
                          <button
                            type="button"
                            onClick={() => setDeleteUserId(u.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <Pagination
          page={page}
          limit={limit}
          total={total}
          totalPages={totalPages}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? "Edit Akun Pengguna" : "Tambah Pengguna Baru"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Nama Lengkap *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Username *
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                {editingUser ? "Password Baru (Kosongkan jika tetap)" : "Password *"}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Peran (Role)
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold"
              >
                <option value="admin">Admin / Kasir</option>
                <option value="owner">Owner</option>
                <option value="rider">Rider</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Status
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

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              No. Telepon / WA
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
              {isSubmitting ? "Menyimpan..." : "Simpan Pengguna"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteUserId}
        onClose={() => setDeleteUserId(null)}
        onConfirm={handleDelete}
        title="Hapus Pengguna?"
        message="Apakah Anda yakin ingin menghapus akun pengguna ini?"
        confirmText="Ya, Hapus Pengguna"
        isLoading={isSubmitting}
      />
    </div>
  );
}
