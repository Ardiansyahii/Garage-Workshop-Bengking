"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import { motion } from "framer-motion";
import {
  Wrench,
  ShieldCheck,
  Clock,
  ArrowRight,
  Star,
  ChevronRight,
  MapPin,
  Phone,
  Store,
} from "lucide-react";

// Variabel Animasi Framer Motion
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
};

export default function LandingPage() {
  const [bengkels, setBengkels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bengkels`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setBengkels(data.data || []);
        }
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error memuat data:", error);
        setIsLoading(false);
      });
  }, []);

  const handleCtaClick = (e) => {
    e.preventDefault();
    const session = localStorage.getItem("user_session");

    if (session) {
      const parsed = JSON.parse(session);
      // Arahkan ke dashboard masing-masing sesuai role
      if (parsed.role === "superadmin") window.location.href = "/superadmin";
      else if (parsed.role === "admin_bengkel") window.location.href = "/admin";
      else window.location.href = "/dashboard";
    } else {
      Swal.fire({
        icon: "warning",
        title: "Autentikasi Diperlukan",
        text: "Silakan masuk atau daftar akun terlebih dahulu untuk melakukan reservasi servis kendaraan.",
        showCancelButton: true,
        confirmButtonText: "Masuk / Daftar",
        cancelButtonText: "Nanti Saja",
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#27272a",
        background: "#09090b",
        color: "#f4f4f5",
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = "/login";
        }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 text-white">
        <Wrench className="w-8 h-8 text-red-600 animate-spin" />
        <p className="font-bold text-zinc-500 text-sm animate-pulse">
          Memuat BengkelKu...
        </p>
      </div>
    );
  }

  const bestBengkels = bengkels.slice(0, 3);
  const otherBengkels = bengkels.slice(3);

  return (
    <main className="min-h-screen bg-black text-white selection:bg-red-600 selection:text-white font-sans antialiased overflow-x-hidden">
      {/* NAVBAR / HEADER */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 w-full z-50 bg-black/75 backdrop-blur-xl border-b border-zinc-900/80"
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="text-lg font-black tracking-wider flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/30">
              <Wrench className="w-4 h-4 text-white" />
            </div>
            <span>
              BENGKEL<span className="text-red-600">KU</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/register-mitra"
              className="text-xs font-bold text-zinc-400 hover:text-white transition flex items-center gap-1.5"
            >
              <Store className="w-3.5 h-3.5" /> Gabung Mitra
            </Link>
            <div className="h-4 w-px bg-zinc-800"></div>
            <Link
              href="/login"
              className="text-xs font-semibold text-zinc-400 hover:text-white transition"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-lg shadow-red-600/20 flex items-center gap-1.5 hover:scale-105"
            >
              Buat Akun <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </motion.header>

      {/* HERO SECTION */}
      <section className="relative pt-44 pb-32 px-6 overflow-hidden flex items-center justify-center min-h-[90vh]">
        <div className="absolute inset-0 z-0">
          <img
            src="/workshop-bg.png"
            alt="Garage Background"
            className="w-full h-full object-cover filter brightness-[0.5] contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="relative z-20 max-w-4xl mx-auto text-center space-y-6"
        >
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-2 bg-zinc-900/80 border border-zinc-800/80 px-4 py-1.5 rounded-full text-xs font-medium text-zinc-300 backdrop-blur-md"
          >
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />{" "}
            Platform Perawatan Otomotif Digital
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-4xl sm:text-6xl md:text-6xl font-black tracking-tight leading-[1.1]"
          >
            PRESISI TINGGI UNTUK{" "}
            <span className="text-red-600">KENDARAAN ANDA</span>.
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-zinc-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed"
          >
            Booking servis kendaraan tanpa antre, bandingkan harga bengkel, dan
            pantau progres pengerjaan secara real-time.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="flex flex-col sm:flex-row justify-center gap-4 pt-6"
          >
            <button
              onClick={handleCtaClick}
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-4 rounded-xl shadow-xl shadow-red-600/30 transition transform hover:-translate-y-1 text-sm flex items-center justify-center gap-2 group"
            >
              Mulai Reservasi{" "}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <Link
              href="/login"
              className="bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 border border-zinc-600 font-bold px-8 py-4 rounded-xl transition text-sm flex items-center justify-center backdrop-blur-md hover:border-zinc-700"
            >
              Akses Dashboard
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* SECTION 1: BENGKEL POPULER */}
      {bestBengkels.length > 0 && (
        <section className="py-24 px-6 max-w-7xl mx-auto w-full">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-16 space-y-2"
          >
            <span className="text-red-600 font-extrabold text-[11px] tracking-widest uppercase block">
              Mitra Unggulan
            </span>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">
              Bengkel Rekomendasi Kami
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm">
              Dipercaya ratusan pelanggan dengan mekanik profesional
              tersertifikasi.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {bestBengkels.map((bengkel, index) => {
              const isPopular = index === 1; // Highlight bengkel di tengah
              return (
                <motion.div
                  key={bengkel.id}
                  variants={fadeUp}
                  className={`relative p-8 rounded-3xl transition-all duration-300 flex flex-col justify-between ${isPopular ? "bg-gradient-to-b from-zinc-900 to-black border-2 border-red-600 shadow-2xl shadow-red-900/20 md:-translate-y-4" : "bg-zinc-950/80 border border-zinc-900 hover:border-zinc-700"}`}
                >
                  {isPopular && (
                    <div className="absolute -top-3.5 right-8 bg-red-600 text-white text-[10px] font-black px-3.5 py-1 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-lg">
                      <Star className="w-3 h-3 fill-white" /> POPULAR
                    </div>
                  )}
                  <div className="space-y-4">
                    <h3 className="text-2xl font-black text-white">
                      {bengkel.name}
                    </h3>
                    <div className="space-y-2 text-xs text-zinc-400">
                      <p className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-red-500 shrink-0" />{" "}
                        {bengkel.address}
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-red-500 shrink-0" />{" "}
                        {bengkel.phone}
                      </p>
                    </div>
                  </div>
                  <div className="pt-8">
                    <button
                      onClick={handleCtaClick}
                      className={`w-full font-bold py-3.5 rounded-xl transition text-xs flex justify-center items-center gap-2 ${isPopular ? "bg-red-600 hover:bg-red-700 text-white" : "bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white"}`}
                    >
                      Booking di Sini <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </section>
      )}

      {/* SECTION 2: DAFTAR BENGKEL LAINNYA */}
      {otherBengkels.length > 0 && (
        <section className="py-20 px-6 max-w-7xl mx-auto w-full border-t border-zinc-900/80">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-12 space-y-2"
          >
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">
              Katalog Mitra Bengkel
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm">
              Temukan bengkel terdekat di wilayahmu.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {otherBengkels.map((bengkel) => (
              <motion.div
                key={bengkel.id}
                variants={fadeUp}
                className="bg-zinc-950/60 border border-zinc-900 p-6 rounded-2xl flex flex-col justify-between hover:border-zinc-800 transition group"
              >
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-white group-hover:text-red-500 transition">
                    {bengkel.name}
                  </h3>
                  <p className="text-zinc-400 text-xs flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />{" "}
                    {bengkel.address}
                  </p>
                  <p className="text-zinc-400 text-xs flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 shrink-0" /> {bengkel.phone}
                  </p>
                </div>
                <div className="pt-6">
                  <button
                    onClick={handleCtaClick}
                    className="w-full bg-zinc-900 hover:bg-red-600 text-zinc-300 hover:text-white font-semibold py-2.5 rounded-xl transition text-xs border border-zinc-800 hover:border-red-600 flex items-center justify-center gap-1"
                  >
                    Pilih Bengkel Ini <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}

      {/* SECTION 3: CTA GABUNG MITRA (BARU) */}
      <section className="max-w-5xl mx-auto px-6 py-10 mb-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="bg-gradient-to-r from-zinc-900 to-black border border-zinc-800 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl"></div>
          <div className="relative z-10 text-center md:text-left space-y-4 max-w-xl">
            <h2 className="text-2xl md:text-3xl font-black text-white">
              Punya Bengkel Sendiri? <br />
              <span className="text-red-500">
                Tingkatkan Omset Bersama Kami.
              </span>
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Bergabunglah menjadi mitra BengkelKu. Kelola antrean lebih mudah,
              jangkau lebih banyak pelanggan, dan atur jadwal operasional secara
              digital 100% gratis.
            </p>
          </div>
          <div className="relative z-10 w-full md:w-auto shrink-0">
            <Link
              href="/register-mitra"
              className="flex items-center justify-center gap-2 bg-white hover:bg-zinc-200 text-black px-8 py-4 rounded-xl text-sm font-black transition shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:scale-105"
            >
              <Store className="w-5 h-5" /> Daftar Mitra Sekarang
            </Link>
          </div>
        </motion.div>
      </section>

      {/* SECTION 4: VALUE PROPS */}
      <section className="border-t border-zinc-900/80 bg-black py-20 px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <motion.div
            variants={fadeUp}
            className="bg-zinc-950 border border-zinc-900 p-8 rounded-2xl space-y-3 hover:border-zinc-800 transition"
          >
            <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-600 font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">
              Realtime Tracking
            </h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Pantau status pengerjaan kendaraanmu secara langsung dari
              perangkat kapanpun dan dimanapun.
            </p>
          </motion.div>
          <motion.div
            variants={fadeUp}
            className="bg-zinc-950 border border-zinc-900 p-8 rounded-2xl space-y-3 hover:border-zinc-800 transition"
          >
            <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-600 font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Mitra Terpercaya</h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Bekerja sama dengan puluhan bengkel bersertifikasi untuk menjamin
              kualitas servis kendaraan Anda.
            </p>
          </motion.div>
          <motion.div
            variants={fadeUp}
            className="bg-zinc-950 border border-zinc-900 p-8 rounded-2xl space-y-3 hover:border-zinc-800 transition"
          >
            <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-600 font-bold">
              <Wrench className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">
              Transparan & Cepat
            </h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Bebas antre di lokasi, estimasi pengerjaan jelas, dan layanan
              komprehensif tanpa biaya tersembunyi.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="bg-zinc-950 border-t border-zinc-900 py-8 px-6 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            &copy; {new Date().getFullYear()} BENGKELKU. All rights reserved.
          </div>
          <div className="flex gap-6">
            <Link
              href="/register-mitra"
              className="hover:text-white transition"
            >
              Kemitraan
            </Link>
            <Link href="/login" className="hover:text-white transition">
              Masuk
            </Link>
            <Link href="/register" className="hover:text-white transition">
              Daftar
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
