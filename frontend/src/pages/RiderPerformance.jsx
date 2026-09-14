import React, { useState, useEffect } from "react";
import { Award, TrendingUp, Target, Calendar, Bike, CheckCircle, Download, ArrowUpRight } from "lucide-react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import { formatRupiah } from "../utils/formatters";
import Badge from "../components/common/Badge";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import toast from "react-hot-toast";

export default function RiderPerformance() {
  const [periodMonth, setPeriodMonth] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM
  const [performanceData, setPerformanceData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPerformance = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.RIDER_PERFORMANCE.LIST, {
        period_month: periodMonth,
      });

      if (res.success) {
        setPerformanceData(res.data || []);
      }
    } catch (err) {
      toast.error("Gagal memuat evaluasi performa: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, [periodMonth]);

  const topRider = performanceData.length > 0 ? performanceData[0] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-espresso">
            Evaluasi & Performa Sales Rider
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Analisis omzet, volume cup terjual, dan pencapaian target penjualan masing-masing rider
          </p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-2xl border border-amber-200 shadow-xs self-start sm:self-auto">
          <Calendar className="w-4 h-4 text-coffee-600" />
          <span className="text-xs font-bold text-espresso">Periode:</span>
          <input
            type="month"
            value={periodMonth}
            onChange={(e) => setPeriodMonth(e.target.value)}
            className="text-xs font-bold text-espresso bg-transparent outline-hidden"
          />
        </div>
      </div>

      {/* Top Rider Spotlight Banner */}
      {topRider && topRider.total_omzet > 0 && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500 via-amber-600 to-coffee-700 text-white shadow-lg relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-amber-100 shrink-0 shadow-inner">
              <Award className="w-9 h-9" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-bold mb-1">
                <span>Rider Terbaik Bulan Ini (Rank #1)</span>
              </div>
              <h3 className="text-2xl font-black">{topRider.rider_name}</h3>
              <p className="text-xs text-amber-100 mt-0.5">
                Kode: {topRider.rider_code} • {topRider.has_app_access ? "📱 Punya HP" : "📝 Tanpa HP (Input Kasir)"}
              </p>
            </div>
          </div>

          <div className="relative z-10 text-center sm:text-right bg-black/20 p-4 rounded-2xl border border-white/10 shrink-0 w-full sm:w-auto">
            <span className="text-xs text-amber-100 font-semibold block">Total Omzet Diraih</span>
            <div className="text-2xl font-black mt-0.5">{formatRupiah(topRider.total_omzet)}</div>
            <span className="text-xs text-amber-200">{topRider.total_cups} cup terjual ({topRider.total_transactions} order)</span>
          </div>
        </div>
      )}

      {/* Performance Table */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-amber-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-espresso">
              Tabel Peringkat & Realisasi Target
            </h3>
            <p className="text-xs text-gray-500">
              Perbandingan performa penjualan antar rider untuk evaluasi insentif dan efektivitas rute
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <LoadingSkeleton rows={5} />
          ) : performanceData.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <p className="font-semibold text-sm text-gray-600">Belum ada data penjualan pada periode ini</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-amber-50/50 text-[11px] font-bold uppercase tracking-wider text-gray-600 border-b border-amber-100">
                <tr>
                  <th className="py-3 px-4">Peringkat</th>
                  <th className="py-3 px-4">Rider</th>
                  <th className="py-3 px-4">Tipe Akses</th>
                  <th className="py-3 px-4">Total Order</th>
                  <th className="py-3 px-4">Cup Terjual</th>
                  <th className="py-3 px-4">Total Omzet</th>
                  <th className="py-3 px-4">Rata-rata/Hari</th>
                  <th className="py-3 px-4">Target & Pencapaian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {performanceData.map((item) => {
                  const achievement = Math.min(100, item.achievement_amount || 0);
                  const isTop3 = item.rank <= 3;
                  const rankBadge =
                    item.rank === 1
                      ? "bg-amber-400 text-amber-950 font-black"
                      : item.rank === 2
                      ? "bg-slate-300 text-slate-900 font-bold"
                      : item.rank === 3
                      ? "bg-amber-700 text-white font-bold"
                      : "bg-gray-100 text-gray-700 font-semibold";

                  return (
                    <tr key={item.rider_id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="py-4 px-4 font-bold">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${rankBadge}`}>
                          {item.rank}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-bold text-espresso">
                        <div>{item.rider_name}</div>
                        <span className="text-[10px] text-gray-400 font-normal">{item.rider_code}</span>
                      </td>
                      <td className="py-4 px-4">
                        {item.has_app_access ? (
                          <Badge variant="info">Ada HP</Badge>
                        ) : (
                          <Badge variant="coffee">Tanpa HP</Badge>
                        )}
                      </td>
                      <td className="py-4 px-4 font-medium text-gray-700">
                        {item.total_transactions} order
                      </td>
                      <td className="py-4 px-4 font-bold text-espresso">
                        {item.total_cups} cup
                      </td>
                      <td className="py-4 px-4 font-extrabold text-sm text-coffee-700">
                        {formatRupiah(item.total_omzet)}
                      </td>
                      <td className="py-4 px-4 text-gray-600 font-medium">
                        {item.avg_per_day ? formatRupiah(item.avg_per_day) : "-"}
                      </td>
                      <td className="py-4 px-4 min-w-[180px]">
                        {item.target_amount > 0 ? (
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-gray-500">
                              <span>Target: {formatRupiah(item.target_amount)}</span>
                              <span className="font-bold text-espresso">{item.achievement_amount}%</span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${achievement}%` }}
                                className={`h-full rounded-full transition-all ${
                                  achievement >= 100 ? "bg-emerald-500" : "bg-coffee-600"
                                }`}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-[11px]">Belum diatur</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
