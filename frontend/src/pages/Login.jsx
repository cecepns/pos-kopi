import React, { useState } from "react";
import { Coffee, Lock, User, ArrowRight } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";

export default function Login() {
  const { login, loading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Mohon isi username dan password");
      return;
    }

    const res = await login(username, password);
    if (res.success) {
      toast.success(`Selamat datang, ${res.user.name}!`);
    } else {
      toast.error(res.message || "Login gagal");
    }
  };

  const handleQuickLogin = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-[#1c130e] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-coffee-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Card */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl mb-3">
            <img src="/logo.png" alt="Logo" className="w-14 h-14 object-contain" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            KOPI POS & RIDER
          </h1>
          <p className="text-sm text-cream/70 mt-1">
            Manajemen Penjualan Kopi & Evaluasi Kinerja Rider
          </p>
        </div>

        {/* Login Form Box */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-amber-100">
          <h2 className="text-xl font-bold text-espresso mb-1">Masuk ke Sistem</h2>
          <p className="text-xs text-gray-500 mb-6">Silakan masukkan akun Anda untuk melanjutkan</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: owner / admin / riderbudi"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-espresso font-medium focus:ring-2 focus:ring-coffee-400 focus:bg-white outline-hidden transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-espresso font-medium focus:ring-2 focus:ring-coffee-400 focus:bg-white outline-hidden transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-coffee-600 hover:bg-coffee-700 text-white font-bold rounded-xl shadow-md shadow-coffee-950/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                <>
                  <span>Masuk Sekarang</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Accounts Helper */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2 text-center">
              Akses Cepat Akun Demo (Klik untuk Isi):
            </span>
            <div className="grid grid-cols-3 gap-2 text-center">
              <button
                type="button"
                onClick={() => handleQuickLogin("owner", "password123")}
                className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 transition-colors"
              >
                <div className="text-xs font-bold">Owner</div>
                <div className="text-[10px] text-purple-600">owner</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("admin", "password123")}
                className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-coffee-800 transition-colors"
              >
                <div className="text-xs font-bold">Admin/Kasir</div>
                <div className="text-[10px] text-coffee-600">admin</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("riderbudi", "password123")}
                className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 transition-colors"
              >
                <div className="text-xs font-bold">Rider HP</div>
                <div className="text-[10px] text-blue-600">riderbudi</div>
              </button>
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-2">Password default: password123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
