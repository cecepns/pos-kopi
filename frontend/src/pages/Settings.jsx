import React, { useState, useEffect } from "react";
import { Store, Save, Printer, Phone, MapPin, Receipt } from "lucide-react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
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
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.SETTINGS.GET);
      if (res.success && res.data) {
        setSettings(res.data);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await request.put(API_ENDPOINTS.SETTINGS.UPDATE, settings);
      if (res.success) {
        toast.success("Pengaturan toko berhasil diperbarui!");
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-espresso">
          Pengaturan Kedai & Struk Nota
        </h1>
        <p className="text-xs sm:text-sm text-gray-500">
          Konfigurasi identitas kedai kopi, kontak, dan teks cetak struk kasir
        </p>
      </div>

      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Settings Form */}
          <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-amber-100 shadow-xs">
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
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
                      className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
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
                    className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
              </div>

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

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-coffee-600 hover:bg-coffee-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? "Menyimpan..." : "Simpan Perubahan Pengaturan"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Live Thermal Receipt Preview Box */}
          <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
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
      )}
    </div>
  );
}
