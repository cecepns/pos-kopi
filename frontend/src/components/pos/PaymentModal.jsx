import React, { useState, useEffect } from "react";
import {
  Banknote,
  QrCode,
  CreditCard,
  CheckCircle2,
  Maximize2,
  Minimize2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import Modal from "../common/Modal";
import { formatRupiah } from "../../utils/formatters";
import { getImageUrl } from "../../utils/api";

export default function PaymentModal({
  isOpen,
  onClose,
  totalAmount,
  riders = [],
  onSubmitPayment,
  isLoading = false,
  storeSettings = null,
}) {
  const [paymentMethod, setPaymentMethod] = useState("cash"); // 'cash', 'qris', 'transfer'
  const [paidAmount, setPaidAmount] = useState(totalAmount);
  const [riderId, setRiderId] = useState("");
  const [notes, setNotes] = useState("");
  const [isQrisZoomed, setIsQrisZoomed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPaidAmount(totalAmount);
      setPaymentMethod("cash");
      setRiderId("");
      setNotes("");
      setIsQrisZoomed(false);
    }
  }, [isOpen, totalAmount]);

  const changeAmount = Math.max(0, (Number(paidAmount) || 0) - totalAmount);
  const isAmountValid = paymentMethod === "cash" ? Number(paidAmount) >= totalAmount : true;

  const quickNominals = [
    { label: "Uang Pas", value: totalAmount },
    { label: "20.000", value: 20000 },
    { label: "50.000", value: 50000 },
    { label: "100.000", value: 100000 },
    { label: "200.000", value: 200000 },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isAmountValid) return;

    onSubmitPayment({
      payment_method: paymentMethod,
      paid_amount: paymentMethod === "cash" ? Number(paidAmount) : totalAmount,
      rider_id: riderId ? Number(riderId) : null,
      notes,
    });
  };

  const qrisImageUrl = storeSettings?.qris_image
    ? getImageUrl(storeSettings.qris_image)
    : "";

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Selesaikan Pembayaran" maxWidth="max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Total Amount Card */}
          <div className="p-4 rounded-2xl bg-cream-light border border-amber-200 text-center">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total yang Harus Dibayar
            </span>
            <div className="text-3xl font-extrabold text-coffee-700 mt-1">
              {formatRupiah(totalAmount)}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Metode Pembayaran
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: "cash", label: "Tunai (Cash)", icon: Banknote },
                { id: "qris", label: "QRIS", icon: QrCode },
                { id: "transfer", label: "Transfer Bank", icon: CreditCard },
              ].map((method) => {
                const Icon = method.icon;
                const isSelected = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(method.id);
                      if (method.id !== "cash") {
                        setPaidAmount(totalAmount);
                      }
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                      isSelected
                        ? "border-coffee-600 bg-amber-50 text-coffee-800 font-bold ring-2 ring-coffee-400"
                        : "border-gray-200 bg-white text-gray-600 hover:border-coffee-300"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 mb-1.5 ${
                        isSelected ? "text-coffee-600" : "text-gray-400"
                      }`}
                    />
                    <span className="text-xs">{method.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash payment specific options */}
          {paymentMethod === "cash" && (
            <div className="space-y-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Uang Diterima (Rp)
                </label>
                <input
                  type="number"
                  min={totalAmount}
                  step={1000}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-lg font-bold text-espresso focus:ring-2 focus:ring-coffee-400 focus:border-coffee-500 outline-hidden"
                />
              </div>

              {/* Quick Nominal Buttons */}
              <div className="flex flex-wrap gap-1.5">
                {quickNominals.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPaidAmount(item.value)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-gray-200 hover:bg-amber-50 hover:border-coffee-300 text-gray-700 transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Change calculation */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-200 text-sm">
                <span className="text-gray-600 font-medium">Kembalian:</span>
                <span
                  className={`font-extrabold text-base ${
                    changeAmount > 0 ? "text-emerald-600" : "text-gray-700"
                  }`}
                >
                  {formatRupiah(changeAmount)}
                </span>
              </div>
            </div>
          )}

          {/* QRIS View */}
          {paymentMethod === "qris" && (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-center space-y-3">
              {qrisImageUrl ? (
                <div className="space-y-2.5">
                  <div className="relative inline-block bg-white p-3 rounded-2xl border border-amber-200 shadow-sm group">
                    <img
                      src={qrisImageUrl}
                      alt="Barcode QRIS Toko"
                      className="w-48 h-48 sm:w-56 sm:h-56 object-contain mx-auto rounded-lg cursor-pointer transition-transform hover:scale-102"
                      onClick={() => setIsQrisZoomed(true)}
                    />
                    <button
                      type="button"
                      onClick={() => setIsQrisZoomed(true)}
                      className="absolute bottom-2 right-2 p-1.5 bg-espresso/80 text-white rounded-lg opacity-80 group-hover:opacity-100 hover:bg-espresso transition-all text-[10px] flex items-center gap-1"
                      title="Perbesar Barcode"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Perbesar</span>
                    </button>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-xs text-espresso uppercase tracking-wide">
                      {storeSettings?.store_name || "QRIS KEDAI KOPI"}
                    </h4>
                    <p className="text-[11px] text-coffee-800 font-medium mt-0.5">
                      Arahkan kamera HP / Scan aplikasi pembayaran pelanggan
                    </p>
                    <div className="flex items-center justify-center gap-1.5 mt-1.5 text-[10px] font-semibold text-gray-500">
                      <span className="px-1.5 py-0.5 bg-white rounded-md border border-gray-200">BCA</span>
                      <span className="px-1.5 py-0.5 bg-white rounded-md border border-gray-200">GoPay</span>
                      <span className="px-1.5 py-0.5 bg-white rounded-md border border-gray-200">OVO</span>
                      <span className="px-1.5 py-0.5 bg-white rounded-md border border-gray-200">Dana</span>
                      <span className="px-1.5 py-0.5 bg-white rounded-md border border-gray-200">ShopeePay</span>
                      <span className="px-1.5 py-0.5 bg-white rounded-md border border-gray-200">Livin</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-5 px-3 bg-white rounded-2xl border border-dashed border-amber-300 space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-100 text-coffee-700 flex items-center justify-center">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-bold text-gray-800">
                    Barcode QRIS Belum Diunggah
                  </h4>
                  <p className="text-[11px] text-gray-500 max-w-xs mx-auto leading-relaxed">
                    Akun Owner dapat mengunggah gambar barcode QRIS kedai di menu <strong>Pengaturan</strong> agar barcode otomatis muncul di sini.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Transfer Method Info */}
          {paymentMethod === "transfer" && (
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-center space-y-1">
              <CreditCard className="w-6 h-6 text-blue-600 mx-auto mb-1" />
              <p className="text-xs font-bold text-blue-900">Pembayaran Transfer Bank</p>
              <p className="text-[11px] text-blue-700">
                Pastikan bukti transfer telah diperiksa sebelum menekan tombol Simpan & Cetak.
              </p>
            </div>
          )}

          {/* Channel / Rider Selection (Optional for POS) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Saluran Penjualan / Rider (Opsional)
            </label>
            <select
              value={riderId}
              onChange={(e) => setRiderId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-espresso font-medium focus:ring-2 focus:ring-coffee-400 focus:border-coffee-500 outline-hidden"
            >
              <option value="">Counter Toko (Walk-in Kasir)</option>
              {riders.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.code} - {r.name} {r.has_app_access ? "(Ada HP)" : "(Tanpa HP)"}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Catatan Transaksi (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Meja 4 / Pesanan dibungkus"
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-espresso focus:ring-2 focus:ring-coffee-400 focus:border-coffee-500 outline-hidden"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 font-semibold text-sm transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading || !isAmountValid}
              className="flex-1 py-2.5 px-4 rounded-xl bg-coffee-600 hover:bg-coffee-700 text-white font-bold text-sm shadow-md shadow-coffee-950/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Simpan & Cetak
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Fullscreen / Zoomed QRIS Modal for easy scanning */}
      {isQrisZoomed && qrisImageUrl && (
        <Modal
          isOpen={isQrisZoomed}
          onClose={() => setIsQrisZoomed(false)}
          title={`Scan QRIS - ${formatRupiah(totalAmount)}`}
          maxWidth="max-w-md"
        >
          <div className="text-center space-y-4 py-2">
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm inline-block mx-auto">
              <img
                src={qrisImageUrl}
                alt="Barcode QRIS Toko"
                className="w-72 h-72 sm:w-80 sm:h-80 object-contain mx-auto rounded-lg"
              />
            </div>
            <div>
              <div className="text-2xl font-black text-coffee-700">
                {formatRupiah(totalAmount)}
              </div>
              <p className="text-xs font-bold text-espresso uppercase mt-0.5">
                {storeSettings?.store_name || "KEDAI KOPI"}
              </p>
              <p className="text-[11px] text-gray-500 mt-1">
                Tunjukkan barcode ini kepada pelanggan untuk discan
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsQrisZoomed(false)}
              className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition-colors"
            >
              Tutup Tampilan Penuh
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
