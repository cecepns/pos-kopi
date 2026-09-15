import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Eye,
  Edit2,
  FileSpreadsheet,
  Calendar,
  CreditCard,
  User,
  Bike,
  XCircle,
  Download,
  ShieldAlert,
} from "lucide-react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import { formatRupiah, formatDateIndo, formatDateTimeIndo } from "../utils/formatters";
import { usePagination } from "../hooks/usePagination";
import { useDebounce } from "../hooks/useDebounce";
import { useAuth } from "../hooks/useAuth";
import Pagination from "../components/common/Pagination";
import SearchInput from "../components/common/SearchInput";
import Modal from "../components/common/Modal";
import ConfirmDialog from "../components/common/ConfirmDialog";
import ReceiptModal from "../components/pos/ReceiptModal";
import Badge from "../components/common/Badge";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import { exportToExcel } from "../utils/excel";
import toast from "react-hot-toast";

export default function Transactions() {
  const { user, isRider, riderInfo } = useAuth();
  const [sales, setSales] = useState([]);
  const [riders, setRiders] = useState([]);
  const [storeSettings, setStoreSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const [riderFilter, setRiderFilter] = useState(isRider && riderInfo ? String(riderInfo.id) : "");
  const [channelFilter, setChannelFilter] = useState(isRider ? "rider" : "");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { page, limit, total, totalPages, setPage, setLimit, updatePaginationMeta } = usePagination(10);

  // Modals
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [editSale, setEditSale] = useState(null);
  const [cancelSaleId, setCancelSaleId] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.SALES.LIST, {
        page,
        limit,
        search: debouncedSearch,
        rider_id: isRider && riderInfo ? riderInfo.id : (riderFilter || undefined),
        sales_channel: isRider ? "rider" : (channelFilter || undefined),
        payment_method: paymentFilter || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });

      if (res.success) {
        setSales(res.data || []);
        updatePaginationMeta(res.pagination);
      }
    } catch (err) {
      toast.error("Gagal memuat transaksi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchFiltersData = async () => {
    try {
      const [rRes, sRes] = await Promise.all([
        request.get(API_ENDPOINTS.RIDERS.ACTIVE_LIST),
        request.get(API_ENDPOINTS.SETTINGS.GET),
      ]);
      if (rRes.success) setRiders(rRes.data || []);
      if (sRes.success) setStoreSettings(sRes.data || null);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFiltersData();
  }, []);

  useEffect(() => {
    fetchSales();
  }, [page, limit, debouncedSearch, riderFilter, channelFilter, paymentFilter, startDate, endDate]);

  const handleUpdateTransaction = async (e) => {
    e.preventDefault();
    if (!editSale) return;
    setIsUpdating(true);
    try {
      const res = await request.put(API_ENDPOINTS.SALES.UPDATE(editSale.id), {
        notes: editSale.notes,
        sale_date: editSale.sale_date,
        payment_method: editSale.payment_method,
      });
      if (res.success) {
        toast.success("Transaksi berhasil diperbarui");
        setEditSale(null);
        fetchSales();
      } else {
        toast.error(res.message || "Gagal memperbarui");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelTransaction = async () => {
    if (!cancelSaleId) return;
    setIsUpdating(true);
    try {
      const res = await request.delete(API_ENDPOINTS.SALES.DELETE(cancelSaleId));
      if (res.success) {
        toast.success("Transaksi berhasil dibatalkan");
        setCancelSaleId(null);
        fetchSales();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExportExcel = () => {
    if (sales.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    try {
      const dataForExcel = sales.map((s, index) => ({
        "No": index + 1,
        "No. Nota": s.sale_number,
        "Tanggal": s.sale_date,
        "Saluran":
          s.sales_channel === "counter"
            ? "Counter Toko"
            : s.sales_channel === "rider"
            ? "Rider Keliling"
            : "Manual",
        "Nama Rider": s.rider_name || "Counter Toko",
        "Total Cup": Number(s.total_items) || 0,
        "Total Omzet (Rp)": Number(s.total_amount) || 0,
        "Metode Bayar": (s.payment_method || "cash").toUpperCase(),
        "Diinput Oleh": s.creator_name || "-",
        "Status": s.status === "completed" ? "Selesai" : s.status,
        "Catatan": s.notes || "-",
      }));

      exportToExcel({
        data: dataForExcel,
        filename: `Laporan_Transaksi_${new Date().toISOString().split("T")[0]}`,
        sheetName: "Transaksi",
        columnWidths: [6, 20, 14, 16, 20, 12, 18, 14, 16, 12, 25],
      });

      toast.success("File Excel (.xlsx) berhasil diunduh!");
    } catch (err) {
      toast.error(err.message || "Gagal mengekspor data ke Excel");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-espresso">
              {isRider ? "Riwayat Transaksi Saya" : "Data Transaksi Penjualan"}
            </h1>
            {isRider && (
              <Badge variant="coffee">
                {riderInfo?.code || "Rider"}: {riderInfo?.name || user?.name}
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            {isRider
              ? "Daftar seluruh transaksi penjualan yang Anda catat sebagai rider keliling"
              : "Daftar transaksi kasir counter dan setoran keliling rider beserta audit trail"}
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportExcel}
          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-colors self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Ekspor Excel (.xlsx)</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-amber-100 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Search */}
          <div className={isRider ? "md:col-span-3" : "md:col-span-2"}>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Cari no nota, catatan..."
              className="w-full"
            />
          </div>

          {/* Rider Filter (Only for Admin/Owner) */}
          {!isRider && (
            <div>
              <select
                value={riderFilter}
                onChange={(e) => setRiderFilter(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-espresso focus:ring-2 focus:ring-coffee-400 outline-hidden"
              >
                <option value="">Semua Rider</option>
                {riders.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Channel Filter (Only for Admin/Owner) */}
          {!isRider && (
            <div>
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-espresso focus:ring-2 focus:ring-coffee-400 outline-hidden"
              >
                <option value="">Semua Saluran</option>
                <option value="counter">Counter Toko</option>
                <option value="rider">Keliling Rider</option>
                <option value="manual">Manual Admin</option>
              </select>
            </div>
          )}

          {/* Payment Method */}
          <div>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-espresso focus:ring-2 focus:ring-coffee-400 outline-hidden"
            >
              <option value="">Semua Pembayaran</option>
              <option value="cash">Tunai (Cash)</option>
              <option value="qris">QRIS</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>
        </div>

        {/* Date Filter Row */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span>Dari:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <span>Sampai:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs"
            />
          </div>

          {(startDate || endDate || riderFilter || channelFilter || paymentFilter || search) && (
            <button
              type="button"
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setRiderFilter("");
                setChannelFilter("");
                setPaymentFilter("");
                setSearch("");
              }}
              className="text-xs text-red-500 hover:underline font-semibold ml-auto"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-amber-100 shadow-xs space-y-4">
        <div className="overflow-x-auto">
          {loading ? (
            <LoadingSkeleton rows={5} />
          ) : sales.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <p className="font-semibold text-sm text-gray-600">Tidak ada transaksi ditemukan</p>
              <p className="text-xs text-gray-400 mt-1">
                Silakan sesuaikan filter atau tambahkan transaksi baru.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-sm min-w-[780px]">
              <thead className="bg-amber-50/50 text-[11px] font-bold uppercase tracking-wider text-gray-600 border-b border-amber-100">
                <tr>
                  <th className="py-3 px-3 whitespace-nowrap">No. Nota</th>
                  <th className="py-3 px-3 whitespace-nowrap">Tanggal Penjualan</th>
                  <th className="py-3 px-3 whitespace-nowrap">Saluran</th>
                  <th className="py-3 px-3 whitespace-nowrap">Rider / Pembeli</th>
                  <th className="py-3 px-3 whitespace-nowrap">Item</th>
                  <th className="py-3 px-3 whitespace-nowrap">Total Tagihan</th>
                  <th className="py-3 px-3 whitespace-nowrap">Metode</th>
                  <th className="py-3 px-3 whitespace-nowrap">Status</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {sales.map((s) => (
                  <tr key={s.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-3 px-3 font-bold text-espresso whitespace-nowrap">{s.sale_number}</td>
                    <td className="py-3 px-3 text-gray-700 whitespace-nowrap">
                      <div className="font-semibold">{formatDateIndo(s.sale_date)}</div>
                      <span className="text-[10px] text-gray-400">{s.creator_name}</span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <Badge
                        variant={s.sales_channel === "rider" ? "coffee" : "default"}
                        className="capitalize text-[10px] whitespace-nowrap"
                      >
                        {s.sales_channel}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 font-semibold text-espresso whitespace-nowrap">
                      {s.rider_name || "Counter Toko"}
                    </td>
                    <td className="py-3 px-3 text-gray-600 font-medium whitespace-nowrap">
                      {s.total_items} cup
                    </td>
                    <td className="py-3 px-3 font-extrabold text-sm text-coffee-700 whitespace-nowrap">
                      {formatRupiah(s.total_amount)}
                    </td>
                    <td className="py-3 px-3 uppercase font-bold text-[10px] text-gray-600 whitespace-nowrap">
                      {s.payment_method}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <Badge
                        variant={s.status === "completed" ? "success" : "danger"}
                        className="text-[10px] whitespace-nowrap"
                      >
                        {s.status === "completed" ? "Selesai" : "Batal"}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedReceipt(s)}
                          title="Lihat Nota"
                          className="p-1.5 text-gray-500 hover:text-coffee-700 hover:bg-amber-100 rounded-lg transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditSale({ ...s })}
                          title="Koreksi Transaksi"
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {s.status === "completed" && (
                          <button
                            type="button"
                            onClick={() => setCancelSaleId(s.id)}
                            title="Batalkan Transaksi"
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
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

      {/* Edit / Correction Modal */}
      {editSale && (
        <Modal
          isOpen={!!editSale}
          onClose={() => setEditSale(null)}
          title={`Koreksi Transaksi #${editSale.sale_number}`}
        >
          <form onSubmit={handleUpdateTransaction} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Tanggal Penjualan
              </label>
              <input
                type="date"
                value={editSale.sale_date}
                onChange={(e) => setEditSale({ ...editSale, sale_date: e.target.value })}
                required
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Metode Pembayaran
              </label>
              <select
                value={editSale.payment_method}
                onChange={(e) => setEditSale({ ...editSale, payment_method: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              >
                <option value="cash">Tunai (Cash)</option>
                <option value="qris">QRIS</option>
                <option value="transfer">Transfer Bank</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Catatan / Alasan Koreksi
              </label>
              <textarea
                rows={3}
                value={editSale.notes || ""}
                onChange={(e) => setEditSale({ ...editSale, notes: e.target.value })}
                placeholder="Tuliskan catatan audit atau alasan perubahan..."
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-hidden focus:ring-2 focus:ring-coffee-400"
              />
            </div>

            <div className="flex gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setEditSale(null)}
                className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 hover:bg-gray-100"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="flex-1 py-2.5 text-sm font-bold text-white bg-coffee-600 hover:bg-coffee-700 rounded-xl transition-colors disabled:opacity-50"
              >
                {isUpdating ? "Menyimpan..." : "Simpan Koreksi"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!cancelSaleId}
        onClose={() => setCancelSaleId(null)}
        onConfirm={handleCancelTransaction}
        title="Batalkan Transaksi Ini?"
        message="Apakah Anda yakin ingin membatalkan transaksi ini? Status transaksi akan diubah menjadi Batal."
        confirmText="Ya, Batalkan Transaksi"
        isLoading={isUpdating}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        transaction={selectedReceipt}
        storeSettings={storeSettings}
      />
    </div>
  );
}
