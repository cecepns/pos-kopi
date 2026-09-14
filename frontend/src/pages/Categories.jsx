import React, { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, Tags } from "lucide-react";
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

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Pagination
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const { page, limit, total, totalPages, setPage, setLimit, updatePaginationMeta } = usePagination(10);

  // Modal & Forms
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    status: "active",
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.CATEGORIES.LIST, {
        page,
        limit,
        search: debouncedSearch,
      });

      if (res.success) {
        setCategories(res.data || []);
        updatePaginationMeta(res.pagination);
      }
    } catch (err) {
      toast.error("Gagal memuat kategori: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [page, limit, debouncedSearch]);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({ name: "", status: "active" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditingCategory(c);
    setFormData({ name: c.name, status: c.status });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return;

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        const res = await request.put(API_ENDPOINTS.CATEGORIES.UPDATE(editingCategory.id), formData);
        if (res.success) {
          toast.success("Kategori berhasil diperbarui");
          setIsModalOpen(false);
          fetchCategories();
        } else {
          toast.error(res.message);
        }
      } else {
        const res = await request.post(API_ENDPOINTS.CATEGORIES.CREATE, formData);
        if (res.success) {
          toast.success("Kategori baru berhasil ditambahkan");
          setIsModalOpen(false);
          fetchCategories();
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
    if (!deleteCategoryId) return;
    setIsSubmitting(true);
    try {
      const res = await request.delete(API_ENDPOINTS.CATEGORIES.DELETE(deleteCategoryId));
      if (res.success) {
        toast.success("Kategori berhasil dihapus");
        setDeleteCategoryId(null);
        fetchCategories();
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
            Kategori Menu Kopi
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Kelola pengelompokan produk seperti Espresso Based, Kopi Susu, Non Coffee, dll.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-coffee-600 hover:bg-coffee-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tambah Kategori</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-amber-100 shadow-xs">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Cari nama kategori..."
          className="w-full sm:max-w-md"
        />
      </div>

      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-amber-100 shadow-xs space-y-4">
        <div className="overflow-x-auto">
          {loading ? (
            <LoadingSkeleton rows={4} />
          ) : categories.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Tags className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="font-semibold text-sm text-gray-600">Tidak ada kategori ditemukan</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm min-w-[620px] border-collapse">
              <thead className="bg-amber-50/75 text-[11px] font-bold uppercase tracking-wider text-espresso/70 border-b border-amber-100">
                <tr>
                  <th className="py-3.5 px-4 min-w-[200px]">Nama Kategori</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Slug URL</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-espresso">{c.name}</td>
                    <td className="py-3.5 px-4 text-gray-400 font-mono whitespace-nowrap">{c.slug}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <Badge variant={c.status === "active" ? "success" : "danger"}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current inline-block mr-1"></span>
                        {c.status === "active" ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 text-gray-500 hover:text-coffee-700 hover:bg-amber-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteCategoryId(c.id)}
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
        title={editingCategory ? "Edit Kategori" : "Tambah Kategori Baru"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Nama Kategori *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Kopi Susu Spesial"
              required
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-coffee-400"
            />
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
              {isSubmitting ? "Menyimpan..." : "Simpan Kategori"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteCategoryId}
        onClose={() => setDeleteCategoryId(null)}
        onConfirm={handleDelete}
        title="Hapus Kategori?"
        message="Apakah Anda yakin ingin menghapus kategori ini?"
        confirmText="Ya, Hapus Kategori"
        isLoading={isSubmitting}
      />
    </div>
  );
}
