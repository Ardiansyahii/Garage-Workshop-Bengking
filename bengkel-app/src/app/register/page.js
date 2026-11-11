"use client";

import { useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import { motion } from "framer-motion";
import {
  Wrench,
  User,
  Phone,
  Lock,
  ArrowLeft,
  ArrowRight,
  Car,
  Bell,
  ShieldCheck,
} from "lucide-react";

// Variabel Animasi untuk Framer Motion
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    whatsapp: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        },
      );
      const data = await res.json();

      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Registrasi Berhasil!",
          text: "Kode OTP verifikasi telah dikirim otomatis ke nomor WhatsApp kamu.",
          confirmButtonColor: "#171717",
          background: "#FFFFFF",
          color: "#171717",
        }).then(() => {
          // Arahkan ke halaman verifikasi OTP dengan membawa nomor WA
          window.location.href = `/verify?whatsapp=${formData.whatsapp}`;
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Gagal Mendaftar",
          text: data.message || "Terjadi kesalahan pada sistem.",
          confirmButtonColor: "#171717",
          background: "#FFFFFF",
          color: "#171717",
        });
        setIsLoading(false);
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Kesalahan Jaringan",
        text: "Tidak dapat terhubung ke server.",
        background: "#FFFFFF",
        color: "#171717",
        confirmButtonColor: "#171717",
      });
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen flex flex-col md:flex-row text-neutral-900 font-sans antialiased overflow-hidden selection:bg-zinc-900 selection:text-white">
      {/* ==========================================
          BACKGROUND GLOBAL
      ========================================== */}
      <div className="absolute inset-0 z-0 fixed pointer-events-none">
        <img
          src="/banner-bg.png"
          alt="Workshop Background"
          className="w-full h-full object-cover object-center filter brightness-[0.8] contrast-125"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-zinc-50/90 to-zinc-50/80 backdrop-blur-[2px]" />
      </div>

      {/* ==========================================
          SISI KIRI: PANEL INFORMASI
      ========================================== */}
      <section className="relative z-10 w-full md:w-5/12 p-8 md:p-12 lg:p-16 flex flex-col justify-between md:h-screen border-r border-zinc-200 bg-white/40 backdrop-blur-md">
        {/* Tombol Back */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-600 hover:text-neutral-900 bg-white/70 hover:bg-white border border-zinc-200 px-4 py-2 rounded-full transition-all group backdrop-blur-md"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            Kembali ke Beranda
          </Link>
        </motion.div>

        {/* Konten Teks & Fitur */}
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
            <div className="w-12 h-12 rounded-2xl bg-neutral-900 flex items-center justify-center shadow-lg shadow-zinc-900/20">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-black tracking-wider">
              BENGKEL<span className="text-zinc-500">KU</span>
            </div>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-3xl md:text-4xl lg:text-5xl font-black mb-4 leading-[1.1]"
          >
            Perawatan Mobil <br />
            Kini Lebih <span className="text-zinc-500">Mudah.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-zinc-600 text-sm leading-relaxed mb-10 max-w-sm"
          >
            Daftarkan diri Anda untuk menikmati kemudahan reservasi servis
            kendaraan tanpa perlu antre panjang di bengkel.
          </motion.p>

          {/* List Fitur Informatif */}
          <motion.div variants={staggerContainer} className="space-y-5">
            <motion.div variants={fadeUp} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white border border-zinc-200 shadow-sm flex items-center justify-center shrink-0">
                <Car className="w-4 h-4 text-neutral-900" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  Manajemen Kendaraan
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Simpan data mobil Anda untuk proses booking servis yang lebih
                  instan.
                </p>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white border border-zinc-200 shadow-sm flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4 text-neutral-900" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  Notifikasi WhatsApp
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Dapatkan pembaruan status pengerjaan mobil Anda langsung ke
                  HP.
                </p>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white border border-zinc-200 shadow-sm flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-neutral-900" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  Riwayat Terpercaya
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Pantau riwayat servis kendaraan Anda kapan saja dengan aman.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Footer Kecil Kiri */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="hidden md:block text-[10px] text-zinc-500 font-medium"
        >
          &copy; {new Date().getFullYear()} BENGKELKU. All rights reserved.
        </motion.div>
      </section>

      {/* ==========================================
          SISI KANAN: FORM REGISTER
      ========================================== */}
      <section className="relative z-10 w-full md:w-7/12 flex items-center justify-center p-6 md:p-12 lg:p-20">
        {/* Efek Cahaya Belakang Form */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-zinc-200/60 rounded-full blur-[100px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
          className="w-full max-w-md bg-white backdrop-blur-xl p-8 md:p-10 rounded-3xl border border-zinc-200 shadow-xl shadow-zinc-900/10 relative z-10"
        >
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-black mb-2 text-neutral-900">
              Buat Akun
            </h2>
            <p className="text-zinc-500 text-xs md:text-sm">
              Lengkapi identitas diri untuk mulai menggunakan layanan.
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-neutral-900 mb-2 uppercase tracking-wider">
                Nama Lengkap
              </label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400 group-focus-within:text-black transition-colors">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-white border border-zinc-200 pl-10 pr-4 py-3.5 rounded-xl text-sm text-neutral-900 placeholder:text-zinc-400 outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all shadow-inner"
                  placeholder="Cth: Ardi Pratama"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-900 mb-2 uppercase tracking-wider">
                Nomor WhatsApp Aktif
              </label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400 group-focus-within:text-black transition-colors">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  name="whatsapp"
                  required
                  value={formData.whatsapp}
                  onChange={handleChange}
                  className="w-full bg-white border border-zinc-200 pl-10 pr-4 py-3.5 rounded-xl text-sm text-neutral-900 placeholder:text-zinc-400 outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all shadow-inner"
                  placeholder="Cth: 081234567890"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-900 mb-2 uppercase tracking-wider flex justify-between">
                <span>Password</span>
              </label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400 group-focus-within:text-black transition-colors">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-white border border-zinc-200 pl-10 pr-4 py-3.5 rounded-xl text-sm text-neutral-900 placeholder:text-zinc-400 outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all shadow-inner"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-neutral-900 hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 text-white font-bold py-4 rounded-xl transition-all text-sm flex items-center justify-center gap-2 mt-4 shadow-lg shadow-zinc-900/20 active:scale-[0.98] group"
            >
              {isLoading ? (
                <>
                  <Wrench className="w-4 h-4 animate-spin" /> Memproses Data...
                </>
              ) : (
                <>
                  Daftar Sekarang{" "}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-zinc-200 text-center">
            <p className="text-xs text-zinc-500">
              Sudah punya akun?{" "}
              <Link
                href="/login"
                className="text-neutral-900 font-bold hover:text-zinc-600 transition ml-1 hover:underline"
              >
                Masuk di sini
              </Link>
            </p>
          </div>
        </motion.div>
      </section>
    </main>
  );
}