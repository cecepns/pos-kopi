import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  DollarSign,
  ShoppingCart,
  Coffee,
  Bike,
  TrendingUp,
  Award,
  ArrowUpRight,
  PlusCircle,
  Calendar,
  MapPin,
} from "lucide-react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import { formatRupiah } from "../utils/formatters";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import Badge from "../components/common/Badge";
import { useAuth } from "../hooks/useAuth";

export default function Dashboard() {
  const { user, isRider } = useAuth();
  const [stats, setStats] = useState(null);
  const [topRiders, setTopRiders] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [period, setPeriod] = useState("7days");
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, ridersRes, productsRes, chartRes] = await Promise.all([
        request.get(API_ENDPOINTS.DASHBOARD.STATS),
        request.get(API_ENDPOINTS.DASHBOARD.TOP_RIDERS),
        request.get(API_ENDPOINTS.DASHBOARD.POPULAR_PRODUCTS),
        request.get(API_ENDPOINTS.DASHBOARD.CHART, { period }),
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (ridersRes.success) setTopRiders(ridersRes.data || []);
      if (productsRes.success) setPopularProducts(productsRes.data || []);
      if (chartRes.success) setChartData(chartRes.data);
    } catch (err) {
      console.error("Gagal memuat data dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#261b17] via-[#38231a] to-[#4d281a] text-white p-6 sm:p-8 shadow-xl border border-white/10">
        {/* Decorative background ambient glows */}
        <div className="absolute -top-10 -right-10 w-60 h-60 bg-coffee-500/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-bold text-amber-200 mb-2 border border-white/10 shadow-xs">
              <span>Selamat Datang Kembali</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-xs">
              Halo, {user?.name || "Pengguna"} 👋
            </h1>
            <p className="text-sm text-cream/90 mt-1 max-w-xl leading-relaxed">
              Pantau performa penjualan kedai kopi dan keliling rider secara realtime di dashboard utama.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {!isRider && (
              <Link
                to="/live-tracking"
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-espresso font-black text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <MapPin className="w-4 h-4 text-espresso" />
                <span>Live Tracking GPS</span>
              </Link>
            )}
            {!isRider && (
              <Link
                to="/pos"
                className="px-4 py-2.5 bg-coffee-600 hover:bg-coffee-500 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Kasir POS Toko</span>
              </Link>
            )}
            <Link
              to="/input-sales"
              className="px-4 py-2.5 bg-white text-espresso hover:bg-cream font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4 text-coffee-600" />
              <span>Input Sales Rider</span>
            </Link>
          </div>

        </div>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <LoadingSkeleton type="card" rows={4} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Omzet Hari Ini */}
          <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Penjualan Hari Ini
              </span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-black text-espresso">
                {formatRupiah(stats?.today_sales || 0)}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Dari <span className="font-semibold text-espresso">{stats?.today_transactions || 0}</span> transaksi hari ini
              </p>
            </div>
          </div>

          {/* Card 2: Produk / Cup Terjual */}
          <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Cup Terjual Hari Ini
              </span>
              <div className="p-2 rounded-xl bg-amber-50 text-coffee-700">
                <Coffee className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-black text-espresso">
                {stats?.today_items || 0} <span className="text-sm font-semibold text-gray-500">Cup</span>
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Kopi & minuman segar
              </p>
            </div>
          </div>

          {/* Card 3: Rider Aktif / Status */}
          <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                {isRider ? "Status Akun Rider" : "Rider Aktif"}
              </span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Bike className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-black text-espresso">
                {isRider ? "Aktif" : `${stats?.active_riders || 0} `}
                {!isRider && <span className="text-sm font-semibold text-gray-500">Personel</span>}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {isRider ? "Akun rider siap operasi keliling" : "Armada keliling siap operasi"}
              </p>
            </div>
          </div>

          {/* Card 4: Omzet Bulan Ini */}
          <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Omzet Bulan Ini
              </span>
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-black text-espresso">
                {formatRupiah(stats?.month_sales || 0)}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Total {stats?.month_transactions || 0} transaksi tercatat
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Sales Chart & Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Sales Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-4 sm:p-6 border border-amber-100 shadow-xs flex flex-col justify-between overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-base font-bold text-espresso">Grafik Tren Penjualan</h3>
              <p className="text-xs text-gray-500">Pergerakan omzet dan transaksi sesuai periode</p>
            </div>

            {/* Filter Period Pills */}
            <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl self-start sm:self-auto overflow-x-auto max-w-full">
              {[
                { id: "today", label: "Hari Ini" },
                { id: "7days", label: "7 Hari" },
                { id: "this_month", label: "Bulan Ini" },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPeriod(p.id)}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    period === p.id
                      ? "bg-white text-espresso shadow-xs font-bold"
                      : "text-gray-600 hover:text-espresso"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="pt-4 sm:pt-6 pb-2 w-full overflow-hidden">
            {chartData && chartData.labels ? (
              <div className="space-y-3 w-full">
                <div className="overflow-x-auto pb-2 scrollbar-none w-full">
                  <div className="h-44 sm:h-48 min-w-[280px] sm:min-w-0 flex items-end gap-1.5 sm:gap-4 pt-6 border-b border-gray-100 px-1">
                    {chartData.labels.map((label, idx) => {
                      const val = chartData.sales[idx] || 0;
                      const maxVal = Math.max(...chartData.sales, 100000);
                      const heightPercent = Math.max(12, Math.round((val / maxVal) * 100));

                      return (
                        <div key={idx} className="flex-1 min-w-0 flex flex-col items-center group h-full justify-end relative">
                          {/* Value tooltip */}
                          <div className="hidden sm:group-hover:block absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-extrabold text-white bg-espresso px-2 py-0.5 rounded-md shadow-md pointer-events-none z-10 whitespace-nowrap">
                            {formatRupiah(val)}
                          </div>
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className="w-full max-w-[28px] sm:max-w-[40px] bg-gradient-to-t from-coffee-700 to-coffee-400 rounded-t-xl group-hover:from-coffee-800 group-hover:to-coffee-500 transition-all shadow-xs cursor-pointer"
                          />
                          <span className="text-[9px] sm:text-[10px] text-gray-500 mt-2 font-semibold truncate w-full text-center">
                            {label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] sm:text-xs text-gray-500 px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-xs bg-coffee-600 inline-block" />
                    <span>Omzet Penjualan (IDR)</span>
                  </div>
                  <span className="text-[10px] sm:text-xs text-gray-400">
                    {period === "this_month" ? "Geser ke samping untuk melihat seluruh tanggal" : "Arahkan ke bar untuk melihat nominal"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="h-44 sm:h-48 flex items-center justify-center text-xs text-gray-400">
                Memuat grafik tren...
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Top Rider Leaderboard */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-amber-100 shadow-xs flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-espresso flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  Top Rider Bulan Ini
                </h3>
                <p className="text-xs text-gray-500">Peringkat performa sales rider</p>
              </div>
              <Link
                to="/rider-performance"
                className="text-xs font-bold text-coffee-600 hover:text-coffee-800 flex items-center gap-0.5"
              >
                Semua
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-gray-100 mt-3">
              {topRiders.slice(0, 5).map((rider, idx) => {
                const rankColor =
                  idx === 0
                    ? "bg-amber-400 text-amber-950 font-black shadow-amber-200"
                    : idx === 1
                    ? "bg-slate-200 text-slate-800 font-bold"
                    : idx === 2
                    ? "bg-amber-700/30 text-amber-900 font-bold"
                    : "bg-gray-100 text-gray-600 font-medium";

                return (
                  <div key={rider.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${rankColor}`}>
                        {idx + 1}
                      </span>
                      <div>
                        <h5 className="font-bold text-sm text-espresso line-clamp-1">{rider.name}</h5>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-gray-400">{rider.code}</span>
                          {rider.has_app_access ? (
                            <Badge variant="info" className="text-[9px] py-0 px-1.5">
                              Ada HP
                            </Badge>
                          ) : (
                            <Badge variant="coffee" className="text-[9px] py-0 px-1.5">
                              Manual Kasir
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-extrabold text-sm text-coffee-700 block">
                        {formatRupiah(rider.total_sales)}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {rider.total_items} cup
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Link
            to="/rider-performance"
            className="w-full mt-4 py-2.5 text-center text-xs font-bold text-coffee-700 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors block"
          >
            Lihat Evaluasi & Target Lengkap &rarr;
          </Link>
        </div>
      </div>

      {/* Bottom Grid: Popular Products & Quick Helper Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Popular Products List */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-amber-100 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
            <div>
              <h3 className="text-base font-bold text-espresso">Menu Kopi Paling Laris</h3>
              <p className="text-xs text-gray-500">Berdasarkan volume penjualan seluruh kanal</p>
            </div>
            <Link
              to="/products"
              className="text-xs font-bold text-coffee-600 hover:text-coffee-800 flex items-center gap-0.5"
            >
              Kelola Menu
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {popularProducts.map((p, idx) => (
              <div
                key={p.id}
                className="p-3.5 rounded-2xl border border-gray-100 bg-cream-light/30 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-coffee-700 flex items-center justify-center font-bold text-sm shrink-0">
                    #{idx + 1}
                  </div>
                  <div className="min-w-0">
                    <h5 className="font-bold text-sm text-espresso truncate">{p.name}</h5>
                    <span className="text-xs text-gray-500">{p.category}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-bold text-sm text-espresso block">{p.total_sold} {p.unit || 'cup'}</span>
                  <span className="text-[11px] text-coffee-600 font-semibold">{formatRupiah(p.total_revenue)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Highlight: Rider Without Phone Info */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-6 border border-amber-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="p-3 w-12 h-12 rounded-2xl bg-coffee-600 text-white flex items-center justify-center mb-4 shadow-sm">
              <Bike className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-base text-espresso">
              Rider Tanpa Smartphone?
            </h4>
            <p className="text-xs text-gray-600 mt-2 leading-relaxed">
              Sistem ini dirancang agar penjualan rider yang tidak punya HP tetap 100% tercatat. Kasir/Admin cukup membuka <strong>Input Sales Rider</strong> dan memilih nama rider saat mereka menyetor catatan fisik.
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-amber-200">
            <Link
              to="/input-sales"
              className="w-full py-3 px-4 bg-coffee-600 hover:bg-coffee-700 text-white font-bold text-xs rounded-xl shadow-md transition-all text-center block"
            >
              + Input Catatan Rider Sekarang
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
