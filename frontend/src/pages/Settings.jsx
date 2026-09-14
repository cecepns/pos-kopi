import React, { useState, useEffect, useRef } from "react";
import {
  Store,
  Save,
  Printer,
  Phone,
  MapPin,
  Receipt,
  QrCode,
  Upload,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  Info,
} from "lucide-react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import { getImageUrl } from "../utils/api";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import toast from "react-hot-toast";

export default function Settings() {
  const [settings, setSettings] = useState({
    store_name: "",
    tagline: "",
    address: "",
    phone: "",
    receipt_footer: "",
    tax_percentage: 0,
    qris_image: null,
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewQrisUrl, setPreviewQrisUrl] = useState("");
  const [removeQris, setRemoveQris] = useState(false);
  const fileInputRef = useRef(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.SETTINGS.GET);
      if (res.success && res.data) {
        setSettings(res.data);
        if (res.data.qris_image) {
          setPreviewQrisUrl(getImageUrl(res.data.qris_image));
        } else {
          setPreviewQrisUrl("");
        }
        setRemoveQris(false);
        setSelectedFile(null);
      }
    } catch (err) {
      toast.error("Gagal memuat pengaturan: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("File harus berupa gambar (JPG, PNG, WebP)!");
        return;
      }
      setSelectedFile(file);
      setRemoveQris(false);
      const objectUrl = URL.createObjectURL(file);
      setPreviewQrisUrl(objectUrl);
    }
  };

  const handleRemoveQris = () => {
    setSelectedFile(null);
    setPreviewQrisUrl("");
    setRemoveQris(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("store_name", settings.store_name || "");
      formData.append("tagline", settings.tagline || "");
      formData.append("address", settings.address || "");
      formData.append("phone", settings.phone || "");
      formData.append("receipt_footer", settings.receipt_footer || "");
      formData.append("tax_percentage", settings.tax_percentage || 0);

      if (selectedFile) {
        formData.append("qris_image", selectedFile);
      } else if (removeQris) {
        formData.append("remove_qris", "true");
      }

      const res = await request.put(API_ENDPOINTS.SETTINGS.UPDATE, formData);
      if (res.success) {
        toast.success("Pengaturan toko & barcode QRIS berhasil diperbarui!");
        if (res.data) {
          setSettings(res.data);
          if (res.data.qris_image) {
            setPreviewQrisUrl(getImageUrl(res.data.qris_image));
          } else {
            setPreviewQrisUrl("");
          }
          setSelectedFile(null);
          setRemoveQris(false);
        }
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(err.message || "Gagal menyimpan pengaturan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-espresso">
          Pengaturan Kedai & QRIS Kasir
        </h1>
        <p className="text-xs sm:text-sm text-gray-500">
          Konfigurasi identitas kedai, kontak, barcode QRIS pembayaran, dan teks cetak struk nota
        </p>
      </div>

      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Form */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 border border-amber-100 shadow-xs space-y-5">
              {/* Store Identity */}
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-sm font-bold text-espresso uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Store className="w-4 h-4 text-coffee-600" />
                  Identitas Kedai Kopi
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Nama Kedai Kopi *
                    </label>
                    <div className="relative">
                      <Store className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        value={settings.store_name}
                        onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                        required
                        placeholder="Contoh: Kopi Keliling Nusantara"
                        className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-espresso focus:ring-2 focus:ring-coffee-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Slogan / Tagline Kedai
                    </label>
                    <input
                      type="text"
                      value={settings.tagline}
                      onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                      placeholder="Contoh: Sensasi Kopi Segar Setiap Hari"
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        No. Telepon / WhatsApp
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                        <input
                          type="text"
                          value={settings.phone}
                          onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                          placeholder="0819-1119-0207"
                          className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Pajak Resto (%)
                      </label>
                      <input
                        type="number"
                        step={0.1}
                        min={0}
                        value={settings.tax_percentage}
                        onChange={(e) => setSettings({ ...settings, tax_percentage: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Alamat Kedai / Lokasi
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                      <textarea
                        rows={2}
                        value={settings.address}
                        onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                        placeholder="Jl. Merdeka No. 45, Jakarta Selatan"
                        className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* QRIS Upload Section */}
              <div className="border-b border-gray-100 pb-5">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-bold text-espresso uppercase tracking-wider flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-coffee-600" />
                    Barcode QRIS Kedai (Pembayaran)
                  </h2>
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Khusus Owner
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-3.5">
                  Upload gambar barcode QRIS statis / dinamis toko Anda. Gambar ini akan otomatis muncul di layar kasir ketika pelanggan memilih opsi pembayaran QRIS.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  {/* QRIS Image Preview Card */}
                  <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 hover:border-coffee-300 transition-colors">
                    {previewQrisUrl ? (
                      <div className="space-y-3 w-full text-center">
                        <div className="relative inline-block bg-white p-3 rounded-2xl shadow-sm border border-gray-200">
                          <img
                            src={previewQrisUrl}
                            alt="QRIS Barcode"
                            className="w-40 h-40 object-contain mx-auto rounded-lg"
                          />
                          <span className="absolute -top-2 -right-2 bg-emerald-500 text-white p-1 rounded-full shadow-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 text-xs font-bold text-coffee-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors flex items-center gap-1.5"
                          >
                            <Upload className="w-3 h-3" />
                            Ganti Gambar
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveQris}
                            className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1.5"
                          >
                            <Trash2 className="w-3 h-3" />
                            Hapus QRIS
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="cursor-pointer text-center py-6 px-4 space-y-2 w-full"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-coffee-600 mx-auto flex items-center justify-center border border-amber-200">
                          <QrCode className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-bold text-gray-700">
                          Klik untuk Unggah Gambar Barcode QRIS
                        </p>
                        <p className="text-[11px] text-gray-400">
                          Format JPG, PNG, atau WebP (Maks. 5MB)
                        </p>
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  {/* QRIS Explanation / Guide */}
                  <div className="space-y-2.5 p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-coffee-950">
                    <div className="flex items-start gap-2 font-bold text-coffee-800">
                      <Info className="w-4 h-4 shrink-0 mt-0.5 text-coffee-600" />
                      <span>Cara Kerja Barcode QRIS:</span>
                    </div>
                    <ul className="space-y-1.5 pl-6 list-disc text-[11px] text-gray-700 leading-relaxed">
                      <li>Kasir membuka menu <strong>Kasir POS</strong> dan memilih item pesanan.</li>
                      <li>Pada popup pembayaran, kasir memilih tombol <strong>QRIS</strong>.</li>
                      <li>Barcode yang diupload di sini akan langsung <strong>muncul di layar kasir</strong> agar bisa langsung discan pelanggan (GoPay, OVO, Dana, BCA, Livin, dll).</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Receipt Footer Message */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Pesan Kaki Struk (Receipt Footer)
                </label>
                <div className="relative">
                  <Receipt className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <textarea
                    rows={2}
                    value={settings.receipt_footer}
                    onChange={(e) => setSettings({ ...settings, receipt_footer: e.target.value })}
                    placeholder="Contoh: Terima kasih atas kunjungan Anda! Follow IG: @kopinusantara"
                    className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-coffee-600 hover:bg-coffee-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? "Menyimpan Pengaturan..." : "Simpan Perubahan Pengaturan & QRIS"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Live Previews */}
          <div className="space-y-6">
            {/* Live QRIS Preview Box */}
            <div className="bg-white rounded-3xl p-5 border border-amber-100 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-coffee-600" />
                Live Preview Barcode QRIS Kasir
              </h3>

              <div className="p-4 rounded-2xl bg-amber-50/60 border border-dashed border-amber-300 text-center space-y-3">
                {previewQrisUrl ? (
                  <div className="space-y-2">
                    <div className="inline-block p-2.5 bg-white rounded-2xl border border-amber-200 shadow-xs">
                      <img
                        src={previewQrisUrl}
                        alt="Preview QRIS"
                        className="w-36 h-36 object-contain mx-auto"
                      />
                    </div>
                    <p className="text-xs font-black text-espresso uppercase">
                      {settings.store_name || "NAMA KEDAI"}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      Scan dengan aplikasi e-wallet / mobile banking apa saja
                    </p>
                  </div>
                ) : (
                  <div className="py-6 text-gray-400 space-y-1">
                    <QrCode className="w-10 h-10 mx-auto text-gray-300" />
                    <p className="text-xs font-semibold text-gray-500">Belum Ada Barcode QRIS</p>
                    <p className="text-[10px] text-gray-400">
                      Upload gambar di sebelah kiri untuk mengaktifkan barcode QRIS
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Live Thermal Receipt Preview Box */}
            <div className="bg-white rounded-3xl p-5 border border-amber-100 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3 flex items-center gap-1.5">
                  <Printer className="w-4 h-4 text-coffee-600" />
                  Live Preview Header Struk
                </h3>

                <div className="p-4 rounded-2xl bg-cream-light/60 border border-dashed border-amber-300 font-mono text-center space-y-2 text-xs text-gray-700">
                  <img src="/logo.png" alt="Logo" className="w-10 h-10 mx-auto object-contain" />
                  <h4 className="font-extrabold uppercase tracking-wide text-espresso">
                    {settings.store_name || "NAMA KEDAI"}
                  </h4>
                  <p className="text-[10px] text-gray-500">{settings.tagline}</p>
                  <p className="text-[10px] text-gray-500">{settings.address}</p>
                  <p className="text-[10px] text-gray-500">Telp: {settings.phone}</p>
                  <div className="border-b border-dashed border-gray-300 my-2" />
                  <p className="text-[10px] text-gray-400 italic">
                    [ Detail transaksi & item belanja ]
                  </p>
                  <div className="border-b border-dashed border-gray-300 my-2" />
                  <p className="text-[10px] text-gray-600 font-sans">{settings.receipt_footer}</p>
                </div>
              </div>

              <div className="mt-4 p-3 bg-amber-50 rounded-2xl text-[11px] text-coffee-900 leading-relaxed">
                Teks ini akan otomatis terpasang pada nota thermal kasir 58mm / 80mm.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
