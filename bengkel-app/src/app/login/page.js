"use client";

import { useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import { motion } from "framer-motion";
import {
  Wrench,
  Phone,
  Lock,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  LayoutDashboard,
  Clock,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

export default function LoginPage() {
  const [formData, setFormData] = useState({
    whatsapp: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        },
      );

      const data = await res.json();

      if (data.success) {
        // 1. Simpan sesi ke localStorage
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("user_session", JSON.stringify(data.user));
        localStorage.setItem("auth_token", data.token);
        document.cookie = `user_role=${data.role}; path=/; max-age=86400`;

        Swal.fire({
          icon: "success",
          title: "Akses Diberikan",
          text: data.message,
          background: "#ffffff",
          color: "#171717",
          timer: 1500,
          showConfirmButton: false,
        }).then(() => {
          // 2. Arahkan ke rute yang TEPAT berdasarkan Role masing-masing
          if (data.role === "superadmin") {
            window.location.href = "/superadmin";
          } else if (data.role === "admin_bengkel") {
            window.location.href = "/admin";
          } else if (data.role === "pelanggan") {
            window.location.href = "/dashboard";
          } else {
            window.location.href = "/";
          }
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Otentikasi Gagal",
          text: data.message,
          background: "#ffffff",
          color: "#171717",
          confirmButtonColor: "#171717",
        });
        setIsLoading(false);
      }
    } catch (error) {
      console.log(error);
      Swal.fire({
        icon: "error",
        title: "Kesalahan Jaringan",
        text: "Gagal terhubung ke server backend.",
        background: "#ffffff",
        color: "#171717",
        confirmButtonColor: "#171717",
      });
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen flex flex-col md:flex-row text-zinc-900 bg-[#FAFAFA] font-sans antialiased overflow-hidden selection:bg-zinc-900 selection:text-white">
      {/* BACKGROUND GLOBAL (gambar tetap, ditutup overlay putih agar bersih) */}
      <div className="absolute inset-0 z-0 fixed pointer-events-none">
        <img
          src="/banner-bg.png"
          alt="Background"
          className="w-full h-full object-cover filter grayscale brightness-110 contrast-100"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/92 to-[#FAFAFA]/90 backdrop-blur-[2px]" />
      </div>

      {/* SISI KIRI: PANEL INFORMASI */}
      <section className="relative z-10 w-full md:w-5/12 p-8 md:p-12 lg:p-16 flex flex-col justify-between md:h-screen border-r border-zinc-200 bg-white/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 bg-white hover:bg-zinc-50 border border-zinc-200 px-4 py-2 rounded-full transition-all group backdrop-blur-md shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            Kembali ke Beranda
          </Link>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="my-auto py-10"
        >
          <motion.div
            variants={fadeUp}
            className="flex items-center gap-3 mb-8"
          >
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center shadow-lg shadow-zinc-300/70">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-black tracking-wider text-zinc-900">
              BENGKEL<span className="text-zinc-500">KU</span>
            </div>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-3xl md:text-4xl lg:text-5xl font-black mb-4 leading-[1.1] text-zinc-900"
          >
            Kendali Penuh <br />
            Di Tangan <span className="text-zinc-400">Anda.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-zinc-600 text-sm leading-relaxed mb-10 max-w-sm"
          >
            Portal akses eksklusif bagi administrator dan pengguna untuk
            mengelola operasional harian.
          </motion.p>

          <motion.div variants={staggerContainer} className="space-y-5">
            <motion.div variants={fadeUp} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0">
                <LayoutDashboard className="w-4 h-4 text-zinc-900" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900">
                  Manajemen Terpadu
                </h3>
                <p className="text-xs text-zinc-600 mt-0.5">
                  Kelola data pelanggan, kendaraan, dan layanan dalam satu
                  tempat.
                </p>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-zinc-900" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900">
                  Antrean Real-Time
                </h3>
                <p className="text-xs text-zinc-600 mt-0.5">
                  Pantau dan perbarui status pengerjaan kendaraan secara
                  langsung.
                </p>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-zinc-900" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900">
                  Sistem Aman Terenkripsi
                </h3>
                <p className="text-xs text-zinc-600 mt-0.5">
                  Data operasional tersimpan aman dengan enkripsi tinggi.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-[10px] text-zinc-500 font-medium"
        >
          &copy; {new Date().getFullYear()} BENGKELKU. System Access.
        </motion.div>
      </section>

      {/* SISI KANAN: FORM LOGIN */}
      <section className="relative z-10 w-full md:w-7/12 flex items-center justify-center p-6 md:p-12 lg:p-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-zinc-200/50 rounded-full blur-[100px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
          className="w-full max-w-md bg-white backdrop-blur-xl p-8 md:p-10 rounded-3xl border border-zinc-200 shadow-xl shadow-zinc-200/60 relative z-10"
        >
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-black mb-2 text-zinc-900">
              Login Portal
            </h2>
            <p className="text-zinc-500 text-xs md:text-sm">
              Masukkan kredensial WhatsApp dan password Anda.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-2 uppercase tracking-wider">
                Nomor WhatsApp
              </label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400 group-focus-within:text-zinc-900 transition-colors">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  name="whatsapp"
                  required
                  value={formData.whatsapp}
                  onChange={handleChange}
                  className="w-full bg-white border border-zinc-200 pl-10 pr-4 py-3.5 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/20 transition-all shadow-sm"
                  placeholder="Cth: 081234567890"
                />
              </div>
            </div>

            <div>
              <label className="flex justify-between mb-2 text-xs font-bold uppercase tracking-wider text-zinc-700">
                <span>Password</span>
                <Link
                  href="/forgotpassword"
                  className="font-semibold normal-case text-zinc-500 transition hover:text-zinc-900 hover:underline"
                >
                  Lupa kata sandi?
                </Link>
              </label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400 group-focus-within:text-zinc-900 transition-colors">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-white border border-zinc-200 pl-10 pr-4 py-3.5 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/20 transition-all shadow-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-500 text-white font-bold py-4 rounded-xl transition-all text-sm flex items-center justify-center gap-2 mt-4 shadow-lg shadow-zinc-300/60 active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Wrench className="w-4 h-4 animate-spin" /> Mengautentikasi...
                </>
              ) : (
                <>
                  Akses Sistem <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-zinc-200 text-center">
            <p className="text-xs text-zinc-500">
              Punya bengkel tapi belum jadi mitra? <br className="md:hidden" />
              <Link
                href="/register-mitra"
                className="text-zinc-900 font-bold hover:text-zinc-600 transition ml-1"
              >
                Daftar Kemitraan
              </Link>
            </p>
          </div>
          <div className="mt-8 pt-6 border-t border-zinc-200 text-center">
            <p className="text-xs text-zinc-500">
              Belum punya akun?{" "}
              <Link
                href="/register"
                className="text-zinc-900 font-bold hover:text-zinc-600 transition ml-1 hover:underline"
              >
                register di sini
              </Link>
            </p>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
