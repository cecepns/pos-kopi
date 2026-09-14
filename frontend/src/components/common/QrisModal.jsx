import React, { useState } from "react";
import { QrCode, Maximize2, Minimize2, Check, Download, AlertCircle, Sparkles, X } from "lucide-react";
import Modal from "./Modal";
import { formatRupiah } from "../../utils/formatters";
import { getImageUrl } from "../../utils/api";

export default function QrisModal({
  isOpen,
  onClose,
  storeSettings = null,
  amount = null,
  title = "QRIS Pembayaran Kedai",
  subtitle = "Scan QRIS untuk pembayaran digital",
}) {
  const [isZoomed, setIsZoomed] = useState(false);

  if (!isOpen) return null;

  const qrisUrl = storeSettings?.qris_image
    ? getImageUrl(storeSettings.qris_image)
    : "";

  return (
    <>
      <Modal isOpen={isOpen && !isZoomed} onClose={onClose} title={title} maxWidth="max-w-md">
        <div className="space-y-4 text-center">
          {/* Amount info if provided */}
          {amount && amount > 0 && (
            <div className="bg-cream-light border border-amber-200/80 rounded-2xl p-3.5">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Total Tagihan
              </span>
              <div className="text-2xl font-extrabold text-coffee-800 mt-0.5">
                {formatRupiah(amount)}
              </div>
            </div>
          )}

          {/* QRIS Container */}
          <div className="relative bg-white border-2 border-amber-200/80 rounded-2xl p-4 shadow-inner flex flex-col items-center justify-center">
            {qrisUrl ? (
              <>
                <div className="relative group cursor-pointer" onClick={() => setIsZoomed(true)}>
                  <img
                    src={qrisUrl}
                    alt="QRIS Barcode"
                    className="w-64 h-64 sm:w-72 sm:h-72 object-contain rounded-xl transition-transform group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-black/10 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="px-3 py-1.5 bg-espresso text-white rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg">
                      <Maximize2 className="w-3.5 h-3.5" /> Klik untuk Layar Penuh
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsZoomed(true)}
                    className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-coffee-800 text-xs font-bold flex items-center gap-1 border border-amber-200 transition-colors"
                  >
                    <Maximize2 className="w-3.5 h-3.5" /> Perbesar Layar Penuh
                  </button>
                  <a
                    href={qrisUrl}
                    download="QRIS-Kedai.jpg"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Unduh Gambar
                  </a>
                </div>
              </>
            ) : (
              <div className="py-12 px-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
                  <QrCode className="w-8 h-8 opacity-60" />
                </div>
                <h4 className="font-bold text-gray-800 text-sm">QRIS Belum Diunggah</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-xs">
                  Owner belum mengunggah gambar QRIS pada menu <strong>Pengaturan Toko</strong>. Silakan hubungi admin atau gunakan metode pembayaran tunai/transfer.
                </p>
              </div>
            )}
          </div>

          {/* Payment instructions */}
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-left space-y-1 text-xs text-gray-600">
            <div className="font-bold text-gray-800 flex items-center gap-1.5 text-xs mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Mendukung Semua Pembayaran Digital
            </div>
            <p className="text-[11px] leading-relaxed">
              Scan barcode di atas menggunakan aplikasi <strong>BCA, Mandiri, BRI, BNI, GoPay, OVO, Dana, ShopeePay</strong>, atau mobile banking lainnya.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors"
          >
            Tutup
          </button>
        </div>
      </Modal>

      {/* Fullscreen Zoomed View */}
      {isZoomed && qrisUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setIsZoomed(false)}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="bg-white p-6 rounded-3xl max-w-sm w-full text-center shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-200">
            <div className="text-xs font-bold text-coffee-700 tracking-wider uppercase mb-1">
              {storeSettings?.store_name || "QRIS KEDAI KOPI"}
            </div>
            {amount && amount > 0 && (
              <div className="text-2xl font-black text-gray-900 mb-3">
                {formatRupiah(amount)}
              </div>
            )}
            <img
              src={qrisUrl}
              alt="QRIS Fullscreen"
              className="w-72 h-72 sm:w-80 sm:h-80 object-contain rounded-2xl border border-gray-200 shadow-sm"
            />
            <p className="text-xs font-semibold text-gray-500 mt-4">
              Arahkan kamera aplikasi pembeli ke barcode di atas
            </p>
            <button
              type="button"
              onClick={() => setIsZoomed(false)}
              className="mt-4 px-6 py-2 rounded-xl bg-espresso text-cream-light font-bold text-xs hover:bg-black transition-colors"
            >
              Kembali ke Form
            </button>
          </div>
        </div>
      )}
    </>
  );
}
