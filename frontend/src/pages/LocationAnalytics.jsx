import React, { useState, useEffect } from "react";
import {
  MapPin,
  TrendingUp,
  Award,
  Calendar,
  Search,
  Download,
  Filter,
  Flame,
  ArrowUpRight,
  Coffee,
  DollarSign,
  BarChart2,
} from "lucide-react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import { formatRupiah, formatDateIndo } from "../utils/formatters";
import { exportToExcel } from "../utils/excel";
import Badge from "../components/common/Badge";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import toast from "react-hot-toast";

export default function LocationAnalytics() {
  const [salesByLocation, setSalesByLocation] = useState([]);
  const [topProductive, setTopProductive] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [salesRes, topRes] = await Promise.all([
        request.get(API_ENDPOINTS.LOCATIONS.SALES, {
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        }),
        request.get(API_ENDPOINTS.LOCATIONS.TOP_PRODUCTIVE),
      ]);

      if (salesRes.success) setSalesByLocation(salesRes.data || []);
      if (topRes.success) setTopProductive(topRes.data || []);
    } catch (err) {
      toast.error("Gagal memuat analitik lokasi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const filteredLocations = salesByLocation.filter((loc) =>
    (loc.location_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalCups = salesByLocation.reduce((acc, curr) => acc + Number(curr.total_cups || 0), 0);
  const totalRevenue = salesByLocation.reduce((acc, curr) => acc + Number(curr.total_revenue || 0), 0);
  const bestLocation = topProductive[0];

  const handleExport = () => {
    if (salesByLocation.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }
    const dataForExcel = salesByLocation.map((loc, idx) => ({
      No: idx + 1,
      "Titik / Area Lokasi": loc.location_name,
      "Jumlah Transaksi": Number(loc.total_transactions) || 0,
      "Total Cup Terjual": Number(loc.total_cups) || 0,
      "Total Omzet (Rp)": Number(loc.total_revenue) || 0,
      "Rata-rata Order (Rp)": Number(loc.avg_ticket) || 0,
    }));

    exportToExcel({
      data: dataForExcel,
      filename: `Analitik_Penjualan_Lokasi_${new Date().toISOString().split("T")[0]}`,
      sheetName: "Lokasi",
      columnWidths: [6, 30, 18, 18, 20, 20],
    });
    toast.success("Laporan analitik lokasi berhasil diunduh!");
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-espresso flex items-center gap-2.5">
            <MapPin className="w-6 h-6 text-coffee-600" />
            <span>Analitik Penjualan Berdasarkan Lokasi</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Monitoring performa omzet dan hotspot titik jualan paling produktif armada kopi keliling.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExport}
          className="px-4 py-2.5 bg-coffee-600 hover:bg-coffee-700 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer w-fit"
        >
          <Download className="w-4 h-4" />
          <span>Export Laporan Lokasi</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-3xl border border-amber-100 shadow-2xs">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Total Lokasi Aktif</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-espresso">{salesByLocation.length} Titik</span>
            <MapPin className="w-5 h-5 text-coffee-600" />
          </div>
          <span className="text-[10px] text-gray-400 mt-1 block">Titik transaksi tercatat</span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-amber-100 shadow-2xs">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Hotspot Terlaris</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-lg font-black text-coffee-700 truncate max-w-[150px]" title={bestLocation?.location_name}>
              {bestLocation ? bestLocation.location_name : "-"}
            </span>
            <Flame className="w-5 h-5 text-amber-500" />
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">
            {bestLocation ? `${bestLocation.total_cups} cup (${bestLocation.share_percent}%)` : "Belum ada data"}
          </span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-amber-100 shadow-2xs">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Total Volume Cup</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-coffee-800">{totalCups} Cup</span>
            <Coffee className="w-5 h-5 text-coffee-600" />
          </div>
          <span className="text-[10px] text-gray-400 mt-1 block">Seluruh titik lokasi</span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-amber-100 shadow-2xs">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Total Omzet Wilayah</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-xl font-black text-emerald-600">{formatRupiah(totalRevenue)}</span>
            <DollarSign className="w-5 h-5 text-emerald-500" />
          </div>
          <span className="text-[10px] text-gray-400 mt-1 block">Dari pesanan counter & rider</span>
        </div>
      </div>

      {/* Top Productive Hotspots Leaderboard */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-amber-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-espresso flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Peringkat Lokasi Paling Produktif (Hotspots)</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Rekomendasi titik lokasi dengan konversi penjualan tertinggi untuk penempatan armada rider.
            </p>
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton rows={3} />
        ) : topProductive.length === 0 ? (
          <p className="text-xs text-gray-400 italic py-4 text-center">Belum ada transaksi lokasi tercatat.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {topProductive.slice(0, 6).map((item, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border transition-all ${
                  idx === 0
                    ? "bg-amber-50/80 border-amber-300 shadow-xs"
                    : idx === 1
                    ? "bg-stone-50 border-stone-200"
                    : "bg-gray-50 border-gray-100"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-extrabold text-xs text-white ${
                        idx === 0
                          ? "bg-amber-500"
                          : idx === 1
                          ? "bg-gray-400"
                          : idx === 2
                          ? "bg-amber-700"
                          : "bg-gray-300"
                      }`}
                    >
                      {item.rank}
                    </span>
                    <h3 className="font-extrabold text-sm text-espresso truncate max-w-[170px]" title={item.location_name}>
                      {item.location_name}
                    </h3>
                  </div>

                  <Badge variant={idx === 0 ? "coffee" : "default"} className="text-[10px]">
                    {item.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-black/5 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase font-bold">Cup Terjual</span>
                    <span className="font-black text-espresso text-sm">{item.total_cups} cup</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase font-bold">Total Omzet</span>
                    <span className="font-black text-coffee-700 text-sm">{formatRupiah(item.total_revenue)}</span>
                  </div>
                </div>

                {/* Progress share bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] text-gray-500 font-semibold mb-1">
                    <span>Pangsa Omzet:</span>
                    <span>{item.share_percent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-coffee-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(5, item.share_percent))}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Breakdown Table by Location */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-amber-100 shadow-xs space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 items-center">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari titik lokasi..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-hidden focus:ring-2 focus:ring-coffee-400"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>Dari:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-hidden"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <span>Sampai:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <LoadingSkeleton rows={5} />
          ) : filteredLocations.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <p className="font-semibold text-sm">Tidak ada data penjualan lokasi ditemukan</p>
              <p className="text-xs text-gray-400 mt-0.5">Sesuaikan filter tanggal atau lakukan transaksi penjualan baru.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-amber-50/60 uppercase font-bold text-[10px] text-gray-600 border-b border-amber-100">
                <tr>
                  <th className="py-3 px-3">No</th>
                  <th className="py-3 px-3">Nama Titik / Lokasi Jualan</th>
                  <th className="py-3 px-3 text-center">Jumlah Transaksi</th>
                  <th className="py-3 px-3 text-center">Cup Terjual</th>
                  <th className="py-3 px-3 text-right">Rata-rata Order (Basket Size)</th>
                  <th className="py-3 px-3 text-right">Total Omzet Penjualan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLocations.map((loc, idx) => (
                  <tr key={idx} className="hover:bg-amber-50/20">
                    <td className="py-3 px-3 text-gray-400 font-bold">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-coffee-600 shrink-0" />
                        <span className="font-bold text-espresso text-xs">{loc.location_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-gray-700">
                      {loc.total_transactions} trx
                    </td>
                    <td className="py-3 px-3 text-center font-black text-coffee-800">
                      <span className="bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-200">
                        {loc.total_cups} cup
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-gray-600 font-semibold">
                      {formatRupiah(loc.avg_ticket)}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-sm text-coffee-700">
                      {formatRupiah(loc.total_revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-amber-50/50 font-bold border-t border-amber-200 text-xs">
                <tr>
                  <td colSpan={2} className="py-3 px-3 text-espresso">TOTAL SELURUH LOKASI:</td>
                  <td className="py-3 px-3 text-center text-gray-800">
                    {filteredLocations.reduce((a, c) => a + Number(c.total_transactions), 0)} trx
                  </td>
                  <td className="py-3 px-3 text-center text-coffee-800">{totalCups} cup</td>
                  <td className="py-3 px-3 text-right text-gray-500">-</td>
                  <td className="py-3 px-3 text-right text-base text-coffee-700">{formatRupiah(totalRevenue)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
