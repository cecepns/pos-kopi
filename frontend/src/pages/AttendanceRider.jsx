import React, { useState, useEffect, useRef } from "react";
import {
  Camera,
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
  const [capturedPhoto, setCapturedPhoto] = useState(null); // base64 or file
  const [photoBlob, setPhotoBlob] = useState(null);

  // Camera stream state
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const fileInputRef = useRef(null);

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

  // Start Camera
  const startCamera = async () => {
    setCameraError("");
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsCameraActive(true);
        }
      } else {
        setCameraError("Kamera perangkat tidak dapat diakses.");
      }
    } catch (err) {
      console.warn("Camera start error:", err.message);
      setCameraError("Izin kamera ditolak atau tidak tersedia. Anda bisa unggah foto.");
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Capture Selfie Photo from Camera Stream
  const captureSelfie = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 480;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (blob) {
          setPhotoBlob(blob);
          setCapturedPhoto(URL.createObjectURL(blob));
          stopCamera();
        }
      }, "image/jpeg", 0.85);
    }
  };

  // Fallback upload file
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoBlob(file);
      setCapturedPhoto(URL.createObjectURL(file));
      stopCamera();
    }
  };

  const openActionModal = (type) => {
    setModalType(type);
    setStatus("present");
    setNotes("");
    setCapturedPhoto(null);
    setPhotoBlob(null);
    requestLocation();
    setTimeout(() => {
      startCamera();
    }, 300);
  };

  const closeActionModal = () => {
    stopCamera();
    setModalType(null);
  };

  const handleSubmitAttendance = async (e) => {
    e.preventDefault();
    if (!photoBlob && !capturedPhoto) {
      toast.error("Wajib mengambil foto selfie bukti kehadiran!");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    if (photoBlob) {
      formData.append("photo", photoBlob, `attendance-${Date.now()}.jpg`);
    }
    if (coords.lat) formData.append("lat", coords.lat);
    if (coords.lng) formData.append("lng", coords.lng);
    formData.append("notes", notes);
    formData.append("status", status);
    if (riderInfo?.id) formData.append("rider_id", riderInfo.id);

    try {
      const endpoint =
        modalType === "clock_in"
          ? API_ENDPOINTS.ATTENDANCES.CLOCK_IN
          : API_ENDPOINTS.ATTENDANCES.CLOCK_OUT;

      const res = await request.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-black text-espresso">
              Presensi & Absensi Rider
            </h1>
            <Badge variant="coffee">
              {riderInfo?.code || "RDR"} - {riderInfo?.name || user?.name}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-gray-500">
            Catat jam berangkat keliling dan jam pulang armada dengan foto selfie & GPS.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-2xl border border-amber-200/80 shadow-xs">
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
            <div className="flex items-center gap-2">
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
                : "Ambil foto selfie keberangkatan dan bagikan titik lokasi GPS Anda sebelum mulai menjual kopi."}
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
                <Camera className="w-5 h-5" />
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
        title={modalType === "clock_in" ? "Absen Masuk (Clock In)" : "Absen Pulang (Clock Out)"}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmitAttendance} className="space-y-4">
          {/* Camera Viewport / Photo Preview */}
          <div className="relative bg-black rounded-2xl overflow-hidden aspect-4/3 flex items-center justify-center border-2 border-amber-200 shadow-inner">
            {capturedPhoto ? (
              <img
                src={capturedPhoto}
                alt="Selfie Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isCameraActive ? "block" : "hidden"}`}
                />
                {!isCameraActive && (
                  <div className="text-center p-4 text-gray-400">
                    <Camera className="w-10 h-10 mx-auto mb-2 opacity-50 text-white" />
                    <p className="text-xs text-white">Menghubungkan kamera...</p>
                    {cameraError && (
                      <p className="text-[11px] text-amber-300 mt-2 max-w-xs">{cameraError}</p>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Live Camera Guidelines */}
            {isCameraActive && !capturedPhoto && (
              <div className="absolute inset-0 border-2 border-white/30 rounded-2xl pointer-events-none flex items-center justify-center">
                <div className="w-40 h-40 border-2 border-dashed border-white/60 rounded-full" />
              </div>
            )}
          </div>

          {/* Hidden Canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Camera Control Buttons */}
          <div className="flex gap-2">
            {!capturedPhoto ? (
              <>
                <button
                  type="button"
                  onClick={captureSelfie}
                  disabled={!isCameraActive}
                  className="flex-1 py-2.5 bg-coffee-700 hover:bg-coffee-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                  Ambil Foto Selfie
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl"
                >
                  Upload File
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setCapturedPhoto(null);
                  setPhotoBlob(null);
                  startCamera();
                }}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Foto Ulang
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="user"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* GPS Location Status */}
          <div className="p-3 bg-cream-light rounded-xl border border-amber-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-coffee-600 shrink-0" />
              <div>
                <span className="font-bold text-coffee-900 block">Koordinat GPS</span>
                <span className="text-gray-500 text-[11px]">
                  {isLocating
                    ? "Mencari titik lokasi GPS..."
                    : coords.lat
                    ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)} (±${coords.accuracy}m)`
                    : "Lokasi belum terdeteksi"}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={requestLocation}
              disabled={isLocating}
              className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-coffee-700 text-[11px] font-bold hover:bg-gray-50 transition-colors shrink-0"
            >
              {isLocating ? "Mencari..." : "Deteksi Ulang"}
            </button>
          </div>

          {/* Status Kehadiran (Clock in only) */}
          {modalType === "clock_in" && (
            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                Kondisi Kehadiran
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-coffee-400 outline-hidden"
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
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
              Catatan Rute / Keterangan (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Rute keliling perkantoran Sudirman - Kuningan"
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-800 focus:ring-2 focus:ring-coffee-400 outline-hidden"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2.5 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={closeActionModal}
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold text-xs transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (!capturedPhoto && !photoBlob)}
              className="flex-1 py-2.5 rounded-xl bg-coffee-600 hover:bg-coffee-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan..." : "Kirim Presensi"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
