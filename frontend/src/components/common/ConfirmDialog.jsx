import React from "react";
import { AlertTriangle } from "lucide-react";
import Modal from "./Modal";

/**
 * Reusable Confirm Dialog
 * Conforms to AGENTS.md Form Rules:
 * - Delete wajib menggunakan Confirm Toast/Dialog
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Konfirmasi Tindakan",
  message = "Apakah Anda yakin ingin melanjutkan tindakan ini? Data yang dihapus tidak dapat dikembalikan.",
  confirmText = "Ya, Hapus",
  cancelText = "Batal",
  isLoading = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-red-100 text-red-600 rounded-full shrink-0">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm shadow-red-200 disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Memproses...
            </>
          ) : (
            confirmText
          )}
        </button>
      </div>
    </Modal>
  );
}
