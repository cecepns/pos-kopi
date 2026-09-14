import React, { useState, useEffect } from "react";
import { Banknote, QrCode, CreditCard, CheckCircle2 } from "lucide-react";
import Modal from "../common/Modal";
import { formatRupiah } from "../../utils/formatters";

export default function PaymentModal({
  isOpen,
  onClose,
  totalAmount,
  riders = [],
  onSubmitPayment,
  isLoading = false,
}) {
  const [paymentMethod, setPaymentMethod] = useState("cash"); // 'cash', 'qris', 'transfer'
  const [paidAmount, setPaidAmount] = useState(totalAmount);
  const [riderId, setRiderId] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen) {
      setPaidAmount(totalAmount);
      setPaymentMethod("cash");
      setRiderId("");
      setNotes("");
    }
  }, [isOpen, totalAmount]);

  const changeAmount = Math.max(0, (Number(paidAmount) || 0) - totalAmount);
  const isAmountValid = paymentMethod === "cash" ? Number(paidAmount) >= totalAmount : true;

  const quickNominals = [
    { label: "Uang Pas", value: totalAmount },
    { label: "20.000", value: 20000 },
    { label: "50.000", value: 50000 },
    { label: "100.000", value: 10000 },
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

  return (
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
                  <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? "text-coffee-600" : "text-gray-400"}`} />
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

        {/* QRIS Simulated view */}
        {paymentMethod === "qris" && (
          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-center space-y-2">
            <div className="w-32 h-32 mx-auto bg-white p-2 rounded-xl border border-gray-200 shadow-xs flex items-center justify-center">
              <QrCode className="w-24 h-24 text-espresso" />
            </div>
            <p className="text-xs text-gray-600 font-medium">
              Scan QRIS melalui GoPay, OVO, Dana, BCA, atau Livin Mandiri
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
  );
}
