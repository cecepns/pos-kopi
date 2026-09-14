import React, { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, Coffee, Image as ImageIcon, Upload } from "lucide-react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import { formatRupiah } from "../utils/formatters";
import { getImageUrl } from "../utils/api";
import { usePagination } from "../hooks/usePagination";
import { useDebounce } from "../hooks/useDebounce";
import Pagination from "../components/common/Pagination";
import SearchInput from "../components/common/SearchInput";
import Modal from "../components/common/Modal";
import ConfirmDialog from "../components/common/ConfirmDialog";
import Badge from "../components/common/Badge";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import toast from "react-hot-toast";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { page, limit, total, totalPages, setPage, setLimit, updatePaginationMeta } = usePagination(10);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteProductId, setDeleteProductId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    category_id: "",
    sku: "",
    price: "",
    cost_price: "",
    unit: "cup",
    status: "active",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState("");

  const fetchCategories = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.CATEGORIES.LIST, { limit: 100, status: "active" });
      if (res.success) setCategories(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.PRODUCTS.LIST, {
        page,
        limit,
        search: debouncedSearch,
        category_id: categoryFilter || undefined,
        status: statusFilter || undefined,
      });

      if (res.success) {
        setProducts(res.data || []);
        updatePaginationMeta(res.pagination);
      }
    } catch (err) {
      toast.error("Gagal memuat produk: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [page, limit, debouncedSearch, categoryFilter, statusFilter]);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      category_id: categories.length > 0 ? categories[0].id : "",
      sku: `PROD-${Math.floor(1000 + Math.random() * 9000)}`,
      price: "",
      cost_price: "",
      unit: "cup",
      status: "active",
    });
    setSelectedFile(null);
    setPreviewImage("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      category_id: p.category_id,
      sku: p.sku,
      price: p.price,
      cost_price: p.cost_price || "",
      unit: p.unit || "cup",
      status: p.status,
    });
    setSelectedFile(null);
    setPreviewImage(p.image || "");
    setIsModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.category_id || !formData.price) {
      toast.error("Mohon lengkapi nama, kategori, dan harga");
      return;
    }

    setIsSubmitting(true);
    try {
      const formPayload = new FormData();
      formPayload.append("name", formData.name);
      formPayload.append("category_id", formData.category_id);
      formPayload.append("sku", formData.sku);
      formPayload.append("price", formData.price);
      formPayload.append("cost_price", formData.cost_price || 0);
      formPayload.append("unit", formData.unit);
      formPayload.append("status", formData.status);
      if (selectedFile) {
        formPayload.append("image", selectedFile);
      }

      const config = {
        headers: { "Content-Type": "multipart/form-data" },
      };

      if (editingProduct) {
        const res = await request.put(API_ENDPOINTS.PRODUCTS.UPDATE(editingProduct.id), formPayload, config);
        if (res.success) {
          toast.success("Produk berhasil diperbarui");
          setIsModalOpen(false);
          fetchProducts();
        } else {
          toast.error(res.message);
        }
      } else {
        const res = await request.post(API_ENDPOINTS.PRODUCTS.CREATE, formPayload, config);
        if (res.success) {
          toast.success("Produk baru berhasil ditambahkan");
          setIsModalOpen(false);
          fetchProducts();
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
    if (!deleteProductId) return;
    setIsSubmitting(true);
    try {
      const res = await request.delete(API_ENDPOINTS.PRODUCTS.DELETE(deleteProductId));
      if (res.success) {
        toast.success("Produk berhasil dihapus");
        setDeleteProductId(null);
        fetchProducts();
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
            Manajemen Menu & Produk Kopi
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Kelola katalog menu, harga jual, harga pokok (HPP), dan kategori produk
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-coffee-600 hover:bg-coffee-700 text-white font-bold text-sm rounded-xl shadow-md shadow-coffee-950/20 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tambah Produk</span>
        </button>
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-4 rounded-3xl border border-amber-100 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Cari SKU, nama produk, kategori..."
          className="w-full sm:max-w-md"
        />

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-espresso focus:ring-2 focus:ring-coffee-400 outline-hidden"
          >
            <option value="">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
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

      {/* Products Table */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-amber-100 shadow-xs space-y-4">
        <div className="overflow-x-auto">
          {loading ? (
            <LoadingSkeleton rows={5} />
          ) : products.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Coffee className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="font-semibold text-sm text-gray-600">Tidak ada produk ditemukan</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm min-w-[820px] border-collapse">
              <thead className="bg-amber-50/75 text-[11px] font-bold uppercase tracking-wider text-espresso/70 border-b border-amber-100">
                <tr>
                  <th className="py-3.5 px-4 min-w-[200px]">Menu / Produk</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">SKU</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Kategori</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Harga Jual</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Modal (HPP)</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Satuan</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-espresso">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-coffee-400 shrink-0 overflow-hidden">
                          {p.image ? (
                            <img src={getImageUrl(p.image)} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <Coffee className="w-4 h-4" />
                          )}
                        </div>
                        <span className="font-bold text-sm text-espresso">{p.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 font-mono whitespace-nowrap">{p.sku}</td>
                    <td className="py-3.5 px-4 font-semibold text-gray-700 whitespace-nowrap">{p.category_name}</td>
                    <td className="py-3.5 px-4 font-extrabold text-sm text-coffee-700 whitespace-nowrap">
                      {formatRupiah(p.price)}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 font-medium whitespace-nowrap">
                      {p.cost_price ? formatRupiah(p.cost_price) : "-"}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 font-semibold whitespace-nowrap">{p.unit || "cup"}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <Badge variant={p.status === "active" ? "success" : "danger"}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current inline-block mr-1"></span>
                        {p.status === "active" ? "Tersedia" : "Kosong"}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          title="Edit Produk"
                          className="p-1.5 text-gray-500 hover:text-coffee-700 hover:bg-amber-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteProductId(p.id)}
                          title="Hapus Produk"
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

        {/* Server Pagination */}
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
        title={editingProduct ? "Edit Menu Produk" : "Tambah Menu Produk Baru"}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Nama Menu / Produk *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Kopi Susu Aren Spesial"
              required
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-coffee-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Kategori *
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                required
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium"
              >
                <option value="" disabled>Pilih Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                SKU / Kode Produk
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Harga Jual (Rp) *
              </label>
              <input
                type="number"
                min={0}
                step={500}
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="18000"
                required
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-extrabold text-coffee-700 focus:ring-2 focus:ring-coffee-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Modal / HPP (Rp)
              </label>
              <input
                type="number"
                min={0}
                step={500}
                value={formData.cost_price}
                onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                placeholder="8000"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Satuan
              </label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="cup / pcs / botol"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Status Ketersediaan
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold"
              >
                <option value="active">Tersedia (Aktif)</option>
                <option value="inactive">Habis (Nonaktif)</option>
              </select>
            </div>
          </div>

          {/* Image Upload Input */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Foto Produk (Opsional)
            </label>
            <div className="flex items-center gap-3">
              {previewImage && (
                <div className="w-14 h-14 rounded-xl border border-gray-200 overflow-hidden shrink-0">
                  <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-coffee-800 hover:file:bg-amber-200"
              />
            </div>
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
              {isSubmitting ? "Menyimpan..." : "Simpan Menu"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteProductId}
        onClose={() => setDeleteProductId(null)}
        onConfirm={handleDelete}
        title="Hapus Menu Produk?"
        message="Apakah Anda yakin ingin menghapus produk ini dari katalog menu?"
        confirmText="Ya, Hapus Produk"
        isLoading={isSubmitting}
      />
    </div>
  );
}
