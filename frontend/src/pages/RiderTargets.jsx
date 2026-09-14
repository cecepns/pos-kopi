import React, { useState, useEffect } from "react";
import { Plus, Target, Edit2, Trash2, Calendar, Bike } from "lucide-react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import { formatRupiah } from "../utils/formatters";
import { usePagination } from "../hooks/usePagination";
import Pagination from "../components/common/Pagination";
import Modal from "../components/common/Modal";
import ConfirmDialog from "../components/common/ConfirmDialog";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import toast from "react-hot-toast";

export default function RiderTargets() {
  const [targets, setTargets] = useState([]);
  const [riders, setRiders] = useState([]);
  const [periodMonth, setPeriodMonth] = useState(new Date().toISOString().substring(0, 7));
  const [loading, setLoading] = useState(true);

  const { page, limit, total, totalPages, setPage, setLimit, updatePaginationMeta } = usePagination(10);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    rider_id: "",
    period_month: periodMonth,
    target_amount: "",
    target_qty: "",
    notes: "",
  });

  const fetchRiders = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.RIDERS.ACTIVE_LIST);
      if (res.success) setRiders(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTargets = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.RIDER_TARGETS.LIST, {
        page,
        limit,
        period_month: periodMonth || undefined,
      });

      if (res.success) {
        setTargets(res.data || []);
        updatePaginationMeta(res.pagination);
      }
    } catch (err) {
      toast.error("Gagal memuat target: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiders();
  }, []);

  useEffect(() => {
    fetchTargets();
  }, [page, limit, periodMonth]);

  const handleOpenCreate = () => {
    setEditingTarget(null);
    setFormData({
      rider_id: riders.length > 0 ? riders[0].id : "",
      period_month: periodMonth,
      target_amount: "",
      target_qty: "",
      notes: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t) => {
    setEditingTarget(t);
    setFormData({
      rider_id: t.rider_id,
      period_month: t.period_month,
      target_amount: t.target_amount,
      target_qty: t.target_qty || "",
      notes: t.notes || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.rider_id || !formData.period_month) {
      toast.error("Lengkapi data rider dan periode");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await request.post(API_ENDPOINTS.RIDER_TARGETS.CREATE, formData);
      if (res.success) {
        toast.success("Target rider berhasil disimpan");
        setIsModalOpen(false);
        fetchTargets();
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
            Target Penjualan Rider
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Tentukan target omzet bulanan dan kuota cup untuk evaluasi kinerja tiap rider
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-coffee-600 hover:bg-coffee-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>+ Atur Target Rider</span>
        </button>
      </div>

      {/* Filter Period */}
      <div className="bg-white p-4 rounded-3xl border border-amber-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-coffee-600" />
          <span className="text-xs font-bold text-espresso">Filter Periode Bulan:</span>
          <input
            type="month"
            value={periodMonth}
            onChange={(e) => setPeriodMonth(e.target.value)}
            className="text-xs font-bold text-espresso px-2 py-1 bg-gray-50 rounded-lg border border-gray-200 outline-hidden"
          />
        </div>
      </div>

      {/* Targets Table */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-amber-100 shadow-xs space-y-4">
        <div className="overflow-x-auto">
          {loading ? (
            <LoadingSkeleton rows={4} />
          ) : targets.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Target className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="font-semibold text-sm text-gray-600">Belum ada target yang diatur untuk periode ini</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm min-w-[760px] border-collapse">
              <thead className="bg-amber-50/75 text-[11px] font-bold uppercase tracking-wider text-espresso/70 border-b border-amber-100">
                <tr>
                  <th className="py-3.5 px-4 w-28 whitespace-nowrap">Kode Rider</th>
                  <th className="py-3.5 px-4 min-w-[180px]">Nama Rider</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Periode</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Target Omzet</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Target Cup</th>
                  <th className="py-3.5 px-4 min-w-[180px]">Catatan</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {targets.map((t) => (
                  <tr key={t.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-coffee-700 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold text-coffee-800 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg inline-block">
                        {t.rider_code}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-espresso">
                      <div className="font-bold text-sm text-espresso">{t.rider_name}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-gray-600 whitespace-nowrap">{t.period_month}</td>
                    <td className="py-3.5 px-4 font-extrabold text-sm text-coffee-700 whitespace-nowrap">
                      {formatRupiah(t.target_amount)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-espresso whitespace-nowrap">
                      {t.target_qty ? `${t.target_qty} cup` : "-"}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500">{t.notes || "-"}</td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(t)}
                        className="p-1.5 text-gray-500 hover:text-coffee-700 hover:bg-amber-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
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
        title={editingTarget ? "Edit Target Rider" : "Atur Target Rider Baru"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Pilih Rider *
            </label>
            <select
              value={formData.rider_id}
              onChange={(e) => setFormData({ ...formData, rider_id: e.target.value })}
              required
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold"
            >
              <option value="" disabled>Pilih Rider</option>
              {riders.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.code} - {r.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Periode Bulan *
            </label>
            <input
              type="month"
              value={formData.period_month}
              onChange={(e) => setFormData({ ...formData, period_month: e.target.value })}
              required
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Target Omzet (Rp) *
              </label>
              <input
                type="number"
                min={0}
                step={500000}
                value={formData.target_amount}
                onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                placeholder="10000000"
                required
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-extrabold text-coffee-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Target Quantity (Cup)
              </label>
              <input
                type="number"
                min={0}
                value={formData.target_qty}
                onChange={(e) => setFormData({ ...formData, target_qty: e.target.value })}
                placeholder="500"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Catatan Evaluasi / KPI
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Contoh: Target shift pagi area perkantoran..."
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
              {isSubmitting ? "Menyimpan..." : "Simpan Target"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
