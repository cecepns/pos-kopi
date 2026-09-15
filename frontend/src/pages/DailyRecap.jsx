import React, { useState, useEffect } from "react";
import { Calendar, CheckCircle2, Clock, Bike, Plus, Download, AlertCircle } from "lucide-react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import { formatRupiah, formatDateIndo } from "../utils/formatters";
import RiderSalesEntryModal from "../components/sales/RiderSalesEntryModal";
import Badge from "../components/common/Badge";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import { exportToExcel } from "../utils/excel";
import toast from "react-hot-toast";

export default function DailyRecap() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [recapData, setRecapData] = useState([]);
  const [riders, setRiders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal for quick entry from daily recap
  const [isEntryOpen, setIsEntryOpen] = useState(false);
  const [entryRiderId, setEntryRiderId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRecap = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.SALES.DAILY_RECAP, { date: selectedDate });
      if (res.success) {
        setRecapData(res.data || []);
      }
    } catch (err) {
      toast.error("Gagal memuat rekap harian: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [rRes, pRes] = await Promise.all([
        request.get(API_ENDPOINTS.RIDERS.ACTIVE_LIST),
        request.get(API_ENDPOINTS.PRODUCTS.LIST, { limit: 100, status: "active" }),
      ]);
      if (rRes.success) setRiders(rRes.data || []);
      if (pRes.success) setProducts(pRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchRecap();
  }, [selectedDate]);

  const handleQuickInput = (riderId) => {
    setEntryRiderId(riderId);
    setIsEntryOpen(true);
  };

  const handleSaveSales = async (data) => {
    setIsSubmitting(true);
    try {
      const res = await request.post(API_ENDPOINTS.SALES.CREATE, data);
      if (res.success) {
        toast.success("Catatan sales berhasil dicatat!");
        setIsEntryOpen(false);
        fetchRecap();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export to Excel handler
  const handleExportExcel = () => {
    if (recapData.length === 0) {
      toast.error("Tidak ada data rekap untuk diekspor");
      return;
    }

    try {
      const dataForExcel = recapData.map((r, index) => ({
        "No": index + 1,
        "Kode Rider": r.code,
        "Nama Rider": r.name,
        "No. Telepon": r.phone || "-",
        "Tanggal": selectedDate,
        "Total Cup Terjual": Number(r.total_cups) || 0,
        "Total Omzet (Rp)": Number(r.total_omzet) || 0,
        "Status Setoran": r.status_input,
        "Jumlah Transaksi": Number(r.transaction_count) || 0,
      }));

      exportToExcel({
        data: dataForExcel,
        filename: `Rekap_Setoran_Rider_${selectedDate}`,
        sheetName: "Rekap Harian",
        columnWidths: [6, 14, 22, 16, 14, 18, 18, 16, 16],
      });

      toast.success("File Excel (.xlsx) berhasil diunduh!");
    } catch (err) {
      toast.error(err.message || "Gagal mengekspor data ke Excel");
    }
  };

  // Summary Metrics
  const totalOmzetDay = recapData.reduce((sum, r) => sum + r.total_omzet, 0);
  const totalCupsDay = recapData.reduce((sum, r) => sum + r.total_cups, 0);
  const totalInputted = recapData.filter((r) => r.status_input === "Sudah Input").length;
  const totalPending = recapData.filter((r) => r.status_input === "Belum Input").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-espresso">
            Rekap Harian Setoran Rider
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Monitoring setoran dan status pencatatan transaksi rider per tanggal
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          {/* Date Selector */}
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-2xl border border-amber-200 shadow-xs">
            <Calendar className="w-4 h-4 text-coffee-600" />
            <span className="text-xs font-bold text-espresso">Tanggal:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-bold text-espresso bg-transparent outline-hidden"
            />
          </div>

          {/* Export Excel Button */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-colors"
            title="Unduh Rekap Excel"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-amber-100 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
            Total Omzet Hari Ini
          </span>
          <h3 className="text-xl font-extrabold text-coffee-700 mt-1">
            {formatRupiah(totalOmzetDay)}
          </h3>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-amber-100 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
            Total Cup Terjual
          </span>
          <h3 className="text-xl font-extrabold text-espresso mt-1">
            {totalCupsDay} <span className="text-xs text-gray-400">Cup</span>
          </h3>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Sudah Setor / Input
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <h3 className="text-xl font-extrabold text-emerald-800 mt-1">
            {totalInputted} <span className="text-xs text-emerald-600">Rider</span>
          </h3>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 shadow-xs">
          <div className="flex items-center justify-between text-amber-900">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Belum Ada Setoran
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <h3 className="text-xl font-extrabold text-amber-900 mt-1">
            {totalPending} <span className="text-xs text-amber-700">Rider</span>
          </h3>
        </div>
      </div>

      {/* Recap Table */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-amber-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-espresso">
              Status Setoran Rider ({formatDateIndo(selectedDate)})
            </h3>
            <p className="text-xs text-gray-500">
              Rider yang belum menyetor dapat langsung diinputkan catatan transaksinya oleh kasir
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <LoadingSkeleton rows={4} />
          ) : recapData.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <p className="font-semibold text-sm text-gray-600">Tidak ada data rider</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm min-w-[850px] border-collapse">
              <thead className="bg-amber-50/75 text-[11px] font-bold uppercase tracking-wider text-espresso/70 border-b border-amber-100">
                <tr>
                  <th className="py-3.5 px-4 w-28 whitespace-nowrap">Kode</th>
                  <th className="py-3.5 px-4 min-w-[180px]">Nama Rider</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Tipe Akses</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Jumlah Transaksi</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Total Cup</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Total Omzet</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Status Setoran</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {recapData.map((r) => {
                  const isSubmitted = r.status_input === "Sudah Input";
                  return (
                    <tr key={r.rider_id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-coffee-700 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-coffee-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md">
                          {r.rider_code}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-espresso">
                        <div className="font-bold text-sm text-espresso">{r.rider_name}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {r.has_app_access ? (
                          <Badge variant="info">Punya HP</Badge>
                        ) : (
                          <Badge variant="coffee">Tanpa HP</Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-gray-700 whitespace-nowrap">
                        {r.total_transactions} transaksi
                      </td>
                      <td className="py-3.5 px-4 font-bold text-espresso whitespace-nowrap">
                        {r.total_cups} cup
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-sm text-coffee-700 whitespace-nowrap">
                        {formatRupiah(r.total_omzet)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Badge variant={isSubmitted ? "success" : "warning"}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current inline-block mr-1"></span>
                          {r.status_input}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleQuickInput(r.rider_id)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 mx-auto ${
                            isSubmitted
                              ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                              : "bg-coffee-600 hover:bg-coffee-700 text-white shadow-xs"
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{isSubmitted ? "+ Tambah Lagi" : "Input Catatan"}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Sales Entry Modal */}
      <RiderSalesEntryModal
        isOpen={isEntryOpen}
        onClose={() => setIsEntryOpen(false)}
        riders={riders}
        products={products}
        preselectedRiderId={entryRiderId}
        onSubmit={handleSaveSales}
        isLoading={isSubmitting}
      />
    </div>
  );
}
