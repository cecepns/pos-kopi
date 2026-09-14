import React from "react";
import { Printer, Check, X } from "lucide-react";
import Modal from "../common/Modal";
import { formatRupiah, formatDateTimeIndo } from "../../utils/formatters";

export default function ReceiptModal({ isOpen, onClose, transaction, storeSettings }) {
  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Struk Pembayaran" maxWidth="max-w-md">
      <div className="space-y-4">
        {/* Printable Thermal Container */}
        <div
          id="printable-receipt"
          className="bg-white p-5 rounded-2xl border border-gray-200 shadow-inner font-mono text-xs text-gray-800 space-y-3"
        >
          {/* Header */}
          <div className="text-center border-b border-dashed border-gray-300 pb-3">
            <h2 className="font-extrabold text-sm text-espresso uppercase tracking-wider">
              {storeSettings?.store_name || "KOPI KELILING NUSANTARA"}
            </h2>
            <p className="text-[11px] text-gray-600 mt-0.5">
              {storeSettings?.tagline || "Cita Rasa Kopi Nusantara"}
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {storeSettings?.address || "Jl. Merdeka No. 45, Jakarta"}
            </p>
            <p className="text-[10px] text-gray-500">
              Telp/WA: {storeSettings?.phone || "0819-1119-0207"}
            </p>
          </div>

          {/* Transaction Metadata */}
          <div className="space-y-1 text-[11px] border-b border-dashed border-gray-300 pb-2">
            <div className="flex justify-between">
              <span>No. Nota:</span>
              <span className="font-bold">{transaction.sale_number}</span>
            </div>
            <div className="flex justify-between">
              <span>Tanggal:</span>
              <span>{formatDateTimeIndo(transaction.created_at || transaction.sale_date)}</span>
            </div>
            <div className="flex justify-between">
              <span>Saluran:</span>
              <span className="uppercase font-semibold text-coffee-700">
                {transaction.sales_channel || "Counter"}
              </span>
            </div>
            {transaction.rider_name && (
              <div className="flex justify-between">
                <span>Rider:</span>
                <span className="font-bold">{transaction.rider_name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Kasir:</span>
              <span>{transaction.creator_name || "Admin"}</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-1.5 border-b border-dashed border-gray-300 pb-3">
            {(transaction.items || []).map((item, idx) => (
              <div key={idx} className="flex justify-between text-[11px]">
                <div className="flex-1 pr-2">
                  <div className="font-semibold">{item.product_name}</div>
                  <div className="text-[10px] text-gray-500">
                    {item.qty} x {formatRupiah(item.price)}
                  </div>
                </div>
                <div className="font-bold shrink-0">
                  {formatRupiah(item.subtotal)}
                </div>
              </div>
            ))}
          </div>

          {/* Financial Summary */}
          <div className="space-y-1 text-[11px] border-b border-dashed border-gray-300 pb-3">
            <div className="flex justify-between font-bold text-sm">
              <span>TOTAL:</span>
              <span>{formatRupiah(transaction.total_amount)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Metode Bayar:</span>
              <span className="uppercase font-semibold">{transaction.payment_method || "CASH"}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Diterima:</span>
              <span>{formatRupiah(transaction.paid_amount || transaction.total_amount)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Kembalian:</span>
              <span className="font-semibold text-emerald-600">
                {formatRupiah(transaction.change_amount || 0)}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-1 text-[10px] text-gray-500 space-y-1">
            <p>{storeSettings?.receipt_footer || "Terima kasih atas kunjungan Anda!"}</p>
            <p className="text-[9px] text-gray-400">--- Simpan struk ini sebagai bukti pembayaran ---</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 font-semibold text-sm transition-colors"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 rounded-xl bg-espresso hover:bg-black text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Cetak Struk
          </button>
        </div>
      </div>
    </Modal>
  );
}
