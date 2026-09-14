import React, { useState, useEffect } from "react";
import {
  Plus,
  Bike,
  Calendar,
  UserCheck,
  Smartphone,
  PhoneOff,
  CheckCircle,
  FileText,
  Eye,
} from "lucide-react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import { formatRupiah, formatDateIndo, formatDateTimeIndo } from "../utils/formatters";
import { usePagination } from "../hooks/usePagination";
import { useDebounce } from "../hooks/useDebounce";
import RiderSalesEntryModal from "../components/sales/RiderSalesEntryModal";
import ReceiptModal from "../components/pos/ReceiptModal";
import Pagination from "../components/common/Pagination";
import SearchInput from "../components/common/SearchInput";
import Badge from "../components/common/Badge";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import toast from "react-hot-toast";

export default function InputSalesRider() {
  const [riders, setRiders] = useState([]);
  const [products, setProducts] = useState([]);
  const [salesList, setSalesList] = useState([]);
  const [storeSettings, setStoreSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filter & Search
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const [selectedRiderFilter, setSelectedRiderFilter] = useState("");
  const { page, limit, total, totalPages, setPage, setLimit, updatePaginationMeta } = usePagination(10);

  // Modals
  const [isEntryOpen, setIsEntryOpen] = useState(false);
  const [preselectedRiderId, setPreselectedRiderId] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch riders and products
  const fetchMetadata = async () => {
    try {
      const [rRes, pRes, sRes] = await Promise.all([
        request.get(API_ENDPOINTS.RIDERS.ACTIVE_LIST),
        request.get(API_ENDPOINTS.PRODUCTS.LIST, { limit: 100, status: "active" }),
        request.get(API_ENDPOINTS.SETTINGS.GET),
      ]);
      if (rRes.success) setRiders(rRes.data || []);
      if (pRes.success) setProducts(pRes.data || []);
      if (sRes.success) setStoreSettings(sRes.data || null);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch rider sales list
  const fetchRiderSales = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.SALES.LIST, {
        page,
        limit,
        search: debouncedSearch,
        rider_id: selectedRiderFilter || undefined,
        sales_channel: "rider", // filter only rider transactions
      });

      if (res.success) {
        setSalesList(res.data || []);
        updatePaginationMeta(res.pagination);
      }
    } catch (err) {
      toast.error("Gagal memuat histori sales: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchRiderSales();
  }, [page, limit, debouncedSearch, selectedRiderFilter]);

  const handleOpenEntryForRider = (riderId) => {
    setPreselectedRiderId(riderId);
    setIsEntryOpen(true);
  };

  const handleSaveRiderSales = async (data) => {
    setIsSubmitting(true);
    try {
      const res = await request.post(API_ENDPOINTS.SALES.CREATE, data);
      if (res.success) {
        toast.success("Catatan sales rider berhasil dicatat!");
        setIsEntryOpen(false);
        fetchRiderSales();
        setSelectedReceipt(res.data);
      } else {
        toast.error(res.message || "Gagal menyimpan sales");
      }
    } catch (err) {
      toast.error(err.message || "Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-black text-espresso">
              Input Sales Rider Keliling
            </h1>
            <Badge variant="coffee">Khusus Operasional</Badge>
          </div>
          <p className="text-xs sm:text-sm text-gray-500">
            Catat penjualan harian berdasarkan nama rider, termasuk rider yang tidak memiliki HP.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenEntryForRider(null)}
          className="px-4 py-2.5 bg-coffee-600 hover:bg-coffee-700 text-white font-bold text-sm rounded-xl shadow-md shadow-coffee-950/20 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>+ Input Sales Rider</span>
        </button>
      </div>

      {/* Quick Rider Cards (Fast Action per Rider) */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
          Daftar Rider Aktif (Klik untuk Langsung Input Catatan)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {riders.map((r) => {
            const hasPhone = r.has_app_access === 1;
            return (
              <div
                key={r.id}
                onClick={() => handleOpenEntryForRider(r.id)}
                className="group p-4 bg-white rounded-2xl border border-amber-100 hover:border-coffee-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold text-coffee-700 bg-amber-50 px-2 py-0.5 rounded-md">
                      {r.code}
                    </span>
                    {hasPhone ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                        <Smartphone className="w-3 h-3" />
                        Punya HP
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                        <PhoneOff className="w-3 h-3" />
                        Tanpa HP
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-espresso group-hover:text-coffee-700 transition-colors line-clamp-1">
                    {r.name}
                  </h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {hasPhone ? r.phone || "Akses Mandiri" : "Setoran fisik via Kasir"}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-coffee-600 group-hover:text-coffee-700">
                  <span>Input Catatan</span>
                  <Plus className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sales Transactions History */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-amber-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-espresso">Histori Catatan Sales Rider</h3>
            <p className="text-xs text-gray-500">Daftar transaksi penjualan yang telah diinput ke sistem</p>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <select
              value={selectedRiderFilter}
              onChange={(e) => setSelectedRiderFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-espresso focus:ring-2 focus:ring-coffee-400 outline-hidden"
            >
              <option value="">Semua Rider</option>
              {riders.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>

            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Cari nota, nama rider..."
              className="w-full sm:w-60"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <LoadingSkeleton rows={5} />
          ) : salesList.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <FileText className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="font-semibold text-sm text-gray-600">Belum ada transaksi sales rider</p>
              <p className="text-xs text-gray-400 mt-1">
                Gunakan tombol di atas untuk mencatat penjualan rider pertama.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-sm min-w-[760px]">
              <thead className="bg-amber-50/50 text-[11px] font-bold uppercase tracking-wider text-gray-600 border-b border-amber-100">
                <tr>
                  <th className="py-3 px-3 whitespace-nowrap">No. Nota</th>
                  <th className="py-3 px-3 whitespace-nowrap">Tgl Penjualan</th>
                  <th className="py-3 px-3 whitespace-nowrap">Rider</th>
                  <th className="py-3 px-3 whitespace-nowrap">Diinput Oleh</th>
                  <th className="py-3 px-3 whitespace-nowrap">Sumber Input</th>
                  <th className="py-3 px-3 whitespace-nowrap">Total Cup</th>
                  <th className="py-3 px-3 whitespace-nowrap">Total Omzet</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {salesList.map((s) => {
                  const isLateInput = s.sale_date !== s.created_at?.split("T")[0];
                  return (
                    <tr key={s.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="py-3 px-3 font-bold text-espresso">
                        {s.sale_number}
                        {isLateInput && (
                          <span className="block text-[10px] text-amber-700 font-medium">
                            (Input susulan)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-gray-700">
                        <div className="font-semibold">{formatDateIndo(s.sale_date)}</div>
                        <span className="text-[10px] text-gray-400">
                          Sistem: {formatDateTimeIndo(s.created_at)}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-espresso">
                        <div className="flex items-center gap-1.5">
                          <span>{s.rider_name}</span>
                          {s.rider_has_app_access ? (
                            <Badge variant="info" className="text-[9px] py-0 px-1">
                              HP
                            </Badge>
                          ) : (
                            <Badge variant="coffee" className="text-[9px] py-0 px-1">
                              Tanpa HP
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-gray-600">
                        {s.creator_name || "Admin"}
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={
                            s.input_source === "rider"
                              ? "info"
                              : s.input_source === "admin"
                              ? "coffee"
                              : "default"
                          }
                          className="capitalize text-[10px]"
                        >
                          {s.input_source || "admin"}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 font-semibold text-espresso">
                        {s.total_items} cup
                      </td>
                      <td className="py-3 px-3 font-extrabold text-sm text-coffee-700">
                        {formatRupiah(s.total_amount)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedReceipt(s)}
                          title="Lihat Struk / Nota"
                          className="p-1.5 text-gray-500 hover:text-coffee-700 hover:bg-amber-100 rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-semibold">Nota</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
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

      {/* Rider Sales Entry Modal */}
      <RiderSalesEntryModal
        isOpen={isEntryOpen}
        onClose={() => setIsEntryOpen(false)}
        riders={riders}
        products={products}
        preselectedRiderId={preselectedRiderId}
        onSubmit={handleSaveRiderSales}
        isLoading={isSubmitting}
      />

      {/* Thermal Receipt Preview Modal */}
      <ReceiptModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        transaction={selectedReceipt}
        storeSettings={storeSettings}
      />
    </div>
  );
}
