import React, { useState, useEffect } from "react";
import {
  Calendar,
  Search,
  Filter,
  Eye,
  MapPin,
  Clock,
  UserCheck,
  Bike,
  ExternalLink,
  Download,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import { formatDateIndo, formatDateTimeIndo } from "../utils/formatters";
import { getImageUrl } from "../utils/api";
import { usePagination } from "../hooks/usePagination";
import { useDebounce } from "../hooks/useDebounce";
import Pagination from "../components/common/Pagination";
import SearchInput from "../components/common/SearchInput";
import Badge from "../components/common/Badge";
import Modal from "../components/common/Modal";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import toast from "react-hot-toast";

export default function Attendances() {
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Search & Filters
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const { page, limit, total, totalPages, setPage, setLimit, updatePaginationMeta } = usePagination(10);

  const fetchAttendances = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.ATTENDANCES.LIST, {
        page,
        limit,
        search: debouncedSearch,
        date: selectedDate || undefined,
        status: selectedStatus || undefined,
      });

      if (res.success) {
        setAttendances(res.data || []);
        updatePaginationMeta(res.pagination);
      }
    } catch (err) {
      toast.error("Gagal memuat rekap absensi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendances();
  }, [page, limit, debouncedSearch, selectedDate, selectedStatus]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "present":
        return <Badge variant="success">Hadir</Badge>;
      case "late":
        return <Badge variant="warning">Terlambat</Badge>;
      case "permission":
        return <Badge variant="info">Izin</Badge>;
      case "sick":
        return <Badge variant="danger">Sakit</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-espresso">
            Rekap Presensi Armada Rider
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Monitoring kehadiran, jam keberangkatan, jam pulang, dan titik GPS absensi rider keliling.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex-1 max-w-md">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Cari nama rider atau kode..."
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Filter */}
          <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
            <Calendar className="w-3.5 h-3.5 text-gray-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-xs text-gray-700 outline-hidden font-semibold"
            />
            {selectedDate && (
              <button
                type="button"
                onClick={() => setSelectedDate("")}
                className="text-[10px] text-gray-400 hover:text-gray-700 font-bold ml-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-hidden"
          >
            <option value="">Semua Status</option>
            <option value="present">Hadir</option>
            <option value="late">Terlambat</option>
            <option value="permission">Izin</option>
            <option value="sick">Sakit</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-3xl border border-amber-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton rows={5} />
          </div>
        ) : attendances.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <UserCheck className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-gray-800 text-sm">Tidak Ada Data Presensi</h4>
            <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
              Belum ada data presensi yang sesuai dengan filter pencarian atau tanggal yang dipilih.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-cream-light/60 border-b border-amber-100 text-gray-500 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Tanggal</th>
                  <th className="py-3.5 px-4">Rider</th>
                  <th className="py-3.5 px-4">Jam Masuk</th>
                  <th className="py-3.5 px-4">Jam Pulang</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Titik GPS</th>
                  <th className="py-3.5 px-4">Bukti Selfie</th>
                  <th className="py-3.5 px-4">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {attendances.map((item) => (
                  <tr key={item.id} className="hover:bg-cream-light/30 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-gray-800">
                      {formatDateIndo(item.attendance_date)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-coffee-900">{item.rider_name}</div>
                      <div className="text-[11px] text-gray-400">{item.rider_code}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-coffee-800">
                      {item.clock_in ? (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                          {item.clock_in}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-700">
                      {item.clock_out ? (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          {item.clock_out}
                        </span>
                      ) : (
                        <span className="text-amber-600 font-semibold text-[11px]">Masih Bertugas</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.clock_in_lat && item.clock_in_lng ? (
                        <a
                          href={`https://www.google.com/maps?q=${item.clock_in_lat},${item.clock_in_lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-coffee-600 hover:text-coffee-800 font-semibold hover:underline"
                        >
                          <MapPin className="w-3.5 h-3.5 text-coffee-500" />
                          <span>Lihat Peta</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-gray-400 text-[11px]">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.clock_in_photo ? (
                        <button
                          type="button"
                          onClick={() => setSelectedPhoto(item)}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-coffee-800 text-[11px] font-bold border border-amber-200 flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Foto Masuk</span>
                        </button>
                      ) : (
                        <span className="text-gray-400 text-[11px]">Tanpa Foto</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 max-w-xs truncate">
                      {item.clock_in_notes || item.clock_out_notes || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <Pagination
          page={page}
          limit={limit}
          total={total}
          totalPages={totalPages}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      </div>

      {/* Selfie Photo Preview Modal */}
      {selectedPhoto && (
        <Modal
          isOpen={!!selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          title={`Foto Presensi: ${selectedPhoto.rider_name}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-center">
            <div className="rounded-2xl overflow-hidden border border-gray-200 bg-black aspect-4/3 flex items-center justify-center">
              <img
                src={getImageUrl(selectedPhoto.clock_in_photo)}
                alt="Selfie Presensi"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-xs text-gray-500 flex items-center justify-between px-2">
              <span>Tanggal: {formatDateIndo(selectedPhoto.attendance_date)}</span>
              <span>Jam Masuk: {selectedPhoto.clock_in}</span>
            </div>
            {selectedPhoto.clock_in_lat && (
              <a
                href={`https://www.google.com/maps?q=${selectedPhoto.clock_in_lat},${selectedPhoto.clock_in_lng}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-xl bg-coffee-600 hover:bg-coffee-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <MapPin className="w-4 h-4" /> Buka Lokasi di Peta
              </a>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
