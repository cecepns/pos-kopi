import React, { useState, useEffect } from "react";
import {
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  RotateCcw,
  Sparkles,
  UserCheck,
  Bike,
  Navigation,
  FileText,
  Eye,
} from "lucide-react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import { formatDateIndo, formatDateTimeIndo } from "../utils/formatters";
import { useAuth } from "../hooks/useAuth";
import Modal from "../components/common/Modal";
import Badge from "../components/common/Badge";
import toast from "react-hot-toast";

export default function AttendanceRider() {
  const { user, riderInfo } = useAuth();
  const [todayData, setTodayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);

  // Clock In / Out Modal State
  const [modalType, setModalType] = useState(null); // 'clock_in' | 'clock_out' | null
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState("present");
  const [notes, setNotes] = useState("");
  const [coords, setCoords] = useState({ lat: null, lng: null, accuracy: null });
  const [isLocating, setIsLocating] = useState(false);


  const fetchTodayStatus = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.ATTENDANCES.TODAY, {
        rider_id: riderInfo?.id || undefined,
      });
      if (res.success) {
        setTodayData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.ATTENDANCES.LIST, {
        rider_id: riderInfo?.id || undefined,
        limit: 7,
      });
      if (res.success) {
        setHistory(res.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTodayStatus();
    fetchHistory();
  }, [riderInfo]);

  // Request GPS Location
  const requestLocation = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      toast.error("Browser tidak mendukung GPS Geolocation");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        });
        setIsLocating(false);
      },
      (err) => {
        console.warn("GPS error:", err.message);
        toast.error("Gagal mendeteksi lokasi GPS: " + err.message);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const openActionModal = (type) => {
    setModalType(type);
    setStatus("present");
    setNotes("");
    requestLocation();
  };

  const closeActionModal = () => {
    setModalType(null);
  };

  const handleSubmitAttendance = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const endpoint =
        modalType === "clock_in"
          ? API_ENDPOINTS.ATTENDANCES.CLOCK_IN
          : API_ENDPOINTS.ATTENDANCES.CLOCK_OUT;

      const payload = {
        lat: coords.lat !== null ? coords.lat : undefined,
        lng: coords.lng !== null ? coords.lng : undefined,
        notes: notes || undefined,
        status: status || "present",
        rider_id: riderInfo?.id || undefined,
      };

      const res = await request.post(endpoint, payload);

      if (res.success) {
        toast.success(res.message || "Absensi berhasil dicatat!");
        closeActionModal();
        fetchTodayStatus();
        fetchHistory();
      } else {
        toast.error(res.message || "Gagal mencatat absensi");
      }
    } catch (err) {
      toast.error(err.message || "Terjadi kesalahan saat absensi");
    } finally {
      setIsSubmitting(false);
    }
  };


  const attendance = todayData?.attendance;
  const isClockedIn = todayData?.is_clocked_in;
  const isClockedOut = todayData?.is_clocked_out;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-black text-espresso">
              Presensi & Absensi Rider
            </h1>
            <Badge variant="coffee" className="text-[11px] font-bold shrink-0">
              {riderInfo?.code || "RDR"} - {riderInfo?.name || user?.name}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-gray-500">
            Catat jam berangkat keliling dan jam pulang armada dengan foto selfie & GPS.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-2xl border border-amber-200/80 shadow-xs self-start sm:self-auto">
          <Calendar className="w-4 h-4 text-coffee-600" />
          <span className="text-xs font-bold text-coffee-900">
            {formatDateIndo(new Date().toISOString().split("T")[0])}
          </span>
        </div>
      </div>

      {/* Main Status Card */}
      <div className="bg-white rounded-3xl border border-amber-200/80 p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-48 h-48 bg-amber-100/50 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Status Kehadiran Hari Ini
              </span>
              {isClockedOut ? (
                <Badge variant="success">Selesai Bertugas (Sudah Pulang)</Badge>
              ) : isClockedIn ? (
                <Badge variant="coffee">Sedang Bertugas Keliling</Badge>
              ) : (
                <Badge variant="secondary">Belum Absen Masuk</Badge>
              )}
            </div>


            <div className="text-3xl sm:text-4xl font-black text-espresso tracking-tight">
              {isClockedOut
                ? "Shift Selesai Hari Ini"
                : isClockedIn
                ? "Selamat Bertugas, Rider!"
                : "Siap Berangkat Keliling?"}
            </div>

            <p className="text-xs sm:text-sm text-gray-500 max-w-md">
              {isClockedOut
                ? "Terima kasih atas kerja keras Anda hari ini. Data penjualan dan absensi telah terekam sempurna."
                : isClockedIn
                ? `Anda telah absen masuk pada jam ${attendance?.clock_in || "-"}. Tetap jaga keselamatan di jalan.`
                : "Konfirmasi kehadiran dan bagikan titik lokasi GPS Anda sebelum mulai keliling menjual kopi."}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {!isClockedIn && (
              <button
                type="button"
                onClick={() => openActionModal("clock_in")}
                className="px-6 py-4 rounded-2xl bg-coffee-600 hover:bg-coffee-700 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-coffee-950/20 transition-all flex items-center justify-center gap-2.5 active:scale-95"
              >
                <UserCheck className="w-5 h-5" />
                <span>Absen Masuk (Clock In)</span>
              </button>
            )}


            {isClockedIn && !isClockedOut && (
              <button
                type="button"
                onClick={() => openActionModal("clock_out")}
                className="px-6 py-4 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-amber-950/20 transition-all flex items-center justify-center gap-2.5 active:scale-95"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Absen Pulang (Clock Out)</span>
              </button>
            )}

            {isClockedOut && (
              <div className="px-5 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Absensi Lengkap
              </div>
            )}
          </div>
        </div>

        {/* Today Summary Details */}
        {attendance && (
          <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-cream-light p-4 rounded-2xl border border-amber-200/60">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Jam Berangkat
              </span>
              <div className="text-xl font-extrabold text-coffee-800 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-coffee-600" />
                {attendance.clock_in || "-"}
              </div>
            </div>

            <div className="bg-cream-light p-4 rounded-2xl border border-amber-200/60">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Jam Pulang
              </span>
              <div className="text-xl font-extrabold text-coffee-800 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                {attendance.clock_out || "Masih Keliling"}
              </div>
            </div>

            <div className="bg-cream-light p-4 rounded-2xl border border-amber-200/60">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Titik GPS Masuk
              </span>
              <div className="text-xs font-semibold text-gray-700 flex items-center gap-1.5 mt-1 truncate">
                <MapPin className="w-3.5 h-3.5 text-coffee-600 shrink-0" />
                {attendance.clock_in_lat && attendance.clock_in_lng
                  ? `${Number(attendance.clock_in_lat).toFixed(4)}, ${Number(attendance.clock_in_lng).toFixed(4)}`
                  : "Tidak terekam"}
              </div>
            </div>

            <div className="bg-cream-light p-4 rounded-2xl border border-amber-200/60">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Status / Catatan
              </span>
              <div className="text-xs font-semibold text-gray-700 truncate mt-1">
                {attendance.status === "present" ? "Hadir Tepat Waktu" : attendance.status}
                {attendance.clock_in_notes ? ` - ${attendance.clock_in_notes}` : ""}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* History 7 Days */}
      <div className="bg-white rounded-3xl border border-amber-200/80 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-espresso uppercase tracking-wider mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-coffee-600" />
          Riwayat Presensi 7 Hari Terakhir
        </h3>

        {history.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-xs">
            Belum ada riwayat absensi tercatat.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase">
                  <th className="pb-3 px-3">Tanggal</th>
                  <th className="pb-3 px-3">Masuk</th>
                  <th className="pb-3 px-3">Pulang</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {history.map((row) => (
                  <tr key={row.id} className="hover:bg-cream-light/40 transition-colors">
                    <td className="py-3 px-3 font-semibold text-gray-800">
                      {formatDateIndo(row.attendance_date)}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-coffee-800">
                      {row.clock_in || "-"}
                    </td>
                    <td className="py-3 px-3 font-mono text-gray-600">
                      {row.clock_out || "-"}
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant={row.status === "present" ? "success" : "secondary"}>
                        {row.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-gray-500 max-w-xs truncate">
                      {row.clock_in_notes || row.clock_out_notes || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Clock In / Out Modal */}
      <Modal
        isOpen={!!modalType}
        onClose={closeActionModal}
        title={modalType === "clock_in" ? "Konfirmasi Absen Masuk" : "Konfirmasi Absen Pulang"}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmitAttendance} className="space-y-4">
          {/* Rider & Time Overview Card */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-coffee-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                <Bike className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="font-extrabold text-xs sm:text-sm text-espresso block truncate">
                  {riderInfo?.name || user?.name || "Rider Keliling"}
                </span>
                <span className="text-[11px] text-gray-500 font-mono font-medium">
                  {riderInfo?.code || "RDR"}
                </span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                Waktu Sekarang
              </span>
              <span className="text-xs sm:text-sm font-black text-coffee-800 font-mono">
                {new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
              </span>
            </div>
          </div>

          {/* GPS Location Status Card */}
          <div className="p-3.5 bg-cream-light/60 rounded-2xl border border-amber-200/80 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-coffee-900 block truncate">Koordinat Titik GPS</span>
                <span className="text-gray-500 text-[11px] block truncate">
                  {isLocating
                    ? "Mencari titik lokasi GPS..."
                    : coords.lat
                    ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)} (±${coords.accuracy}m)`
                    : "Lokasi GPS belum terdeteksi"}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={requestLocation}
              disabled={isLocating}
              className="px-2.5 py-1.5 rounded-xl bg-white border border-amber-200 text-coffee-700 text-[11px] font-bold hover:bg-gray-50 transition-colors shrink-0 shadow-2xs"
            >
              {isLocating ? "Mencari..." : "Deteksi Ulang"}
            </button>
          </div>

          {/* Status Kehadiran (Clock in only) */}
          {modalType === "clock_in" && (
            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Kondisi Kehadiran
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-coffee-400 outline-hidden transition-all shadow-2xs"
              >
                <option value="present">Hadir Tepat Waktu</option>
                <option value="late">Terlambat</option>
                <option value="permission">Izin</option>
                <option value="sick">Sakit</option>
              </select>
            </div>
          )}

          {/* Catatan / Rute */}
          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Catatan Rute / Keterangan (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Rute keliling Sudirman - Kuningan"
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:ring-2 focus:ring-coffee-400 outline-hidden transition-all shadow-2xs"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2.5 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={closeActionModal}
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 py-3 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 ${
                modalType === "clock_in"
                  ? "bg-coffee-600 hover:bg-coffee-700 shadow-coffee-950/20"
                  : "bg-amber-600 hover:bg-amber-700 shadow-amber-950/20"
              }`}
            >
              {isSubmitting ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : modalType === "clock_in" ? (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Konfirmasi Absen Masuk</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Konfirmasi Absen Pulang</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

