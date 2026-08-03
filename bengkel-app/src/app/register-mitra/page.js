"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Store,
  User,
  Phone,
  MapPin,
  Lock,
  ArrowLeft,
  Wrench,
  TrendingUp,
  Smartphone,
  ChevronDown,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

// Data FAQ
const faqs = [
  {
    question: "Bagaimana cara mendaftar sebagai mitra bengkel?",
    answer:
      "Cukup lengkapi formulir pendaftaran di halaman ini. Setelah itu, tim Superadmin kami akan memverifikasi data Anda. Jika disetujui, Anda akan bisa langsung login ke dashboard.",
  },
  {
    question: "Dokumen apa saja yang dibutuhkan?",
    answer:
      "Saat ini kami hanya membutuhkan kelengkapan informasi dasar bengkel, alamat, dan nomor WhatsApp yang aktif untuk keperluan login dan notifikasi.",
  },
  {
    question: "Berapa biaya pendaftaran menjadi mitra?",
    answer:
      "100% Gratis. Kami tidak memungut biaya pendaftaran maupun biaya bulanan untuk penggunaan platform manajemen antrean ini.",
  },
];

const benefits = [
  {
    icon: TrendingUp,
    title: "Kelola Bisnis Berkelanjutan",
    description:
      "Tingkatkan visibilitas bengkel Anda ke ribuan pengguna platform kami di seluruh area sekitar Anda.",
    tag: "Growth & Revenue",
    gradient: "from-red-600/20 via-zinc-900 to-zinc-950",
  },
  {
    icon: ShieldCheck,
    title: "Manajemen Terpusat & Otonom",
    description:
      "Atur layanan, harga, dan jadwal operasional bengkel sepenuhnya di bawah kendali penuh Anda sendiri.",
    tag: "Full Control",
    gradient: "from-red-600/15 via-zinc-900 to-zinc-950",
  },
  {
    icon: Smartphone,
    title: "Kemudahan Akses Digital",
    description:
      "Sistem notifikasi otomatis via WhatsApp dan dashboard modern yang mudah diakses dari perangkat manapun.",
    tag: "Automation",
    gradient: "from-red-600/10 via-zinc-900 to-zinc-950",
  },
];

export default function RegisterMitra() {
  const [formData, setFormData] = useState({
    bengkel_name: "",
    phone: "",
    address: "",
    owner_name: "",
    whatsapp: "",
    password: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const lenisRef = useRef(null);
  const heroImageRef = useRef(null);
  const benefitsContainerRef = useRef(null);

  // Inisialisasi Lenis & GSAP ScrollTrigger secara Aman
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // 1. Setup Smooth Scroll Lenis
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    // Connect Lenis to GSAP ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);

    const updateGSAP = (time) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateGSAP);
    gsap.ticker.lagSmoothing(0);

    // 2. Parallax Animasi pada Background Hero
    if (heroImageRef.current) {
      gsap.to(heroImageRef.current, {
        yPercent: 15,
        ease: "none",
        scrollTrigger: {
          trigger: heroImageRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }

    // 3. Animation untuk Overlapping Cards (Depth Scaling)
    if (benefitsContainerRef.current) {
      const cards =
        benefitsContainerRef.current.querySelectorAll(".benefit-card");
      cards.forEach((card, i) => {
        if (i < cards.length - 1) {
          gsap.to(card, {
            scale: 0.92 - i * 0.02,
            opacity: 0.5,
            ease: "power1.out",
            scrollTrigger: {
              trigger: cards[i + 1],
              start: "top 65%",
              end: "top 25%",
              scrub: true,
            },
          });
        }
      });
    }

    // Refresh ScrollTrigger setelah kalkulasi layout siap
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);

    return () => {
      clearTimeout(timer);
      gsap.ticker.remove(updateGSAP);
      lenis.destroy();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/register-mitra`,
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
          title: "Pengajuan Terkirim!",
          text: "Data bengkel Anda telah masuk ke sistem kami. Silakan tunggu proses verifikasi oleh tim Superadmin.",
          background: "#09090b",
          color: "#f4f4f5",
          confirmButtonColor: "#dc2626",
        }).then(() => {
          window.location.href = "/";
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Pendaftaran Gagal",
          text: data.message,
          background: "#09090b",
          color: "#f4f4f5",
          confirmButtonColor: "#dc2626",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Kesalahan Jaringan",
        text: "Gagal terhubung ke server. Pastikan backend sudah menyala.",
        background: "#09090b",
        color: "#f4f4f5",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const scrollToForm = () => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo("#form-section", { offset: -40 });
    } else {
      document
        .getElementById("form-section")
        ?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <main className="min-h-screen bg-[#070709] text-zinc-100 font-sans selection:bg-red-600 selection:text-white antialiased overflow-x-hidden">
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-[#070709]/80 backdrop-blur-xl border-b border-zinc-800/60">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Kembali ke Beranda</span>
          </Link>

          <div className="text-base font-black tracking-wider flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-600/30 ring-1 ring-white/10">
              <Wrench className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-white font-extrabold tracking-tight text-lg">
              BENGKEL<span className="text-red-600">KU</span>
            </span>
          </div>
        </div>
      </nav>

      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-16 px-6 max-w-7xl mx-auto">
        <div className="relative bg-zinc-950 border border-zinc-800/80 rounded-3xl overflow-hidden min-h-[520px] flex items-center shadow-2xl">
          {/* Parallax Image & Gradient Overlays */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <img
              ref={heroImageRef}
              src="/banner-bg.png"
              alt="Garage Background"
              className="w-full h-[125%] object-cover filter brightness-[0.35] contrast-125"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#070709] via-[#070709]/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#070709] via-transparent to-transparent" />
          </div>

          {/* Hero Content dengan Framer Motion */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-10 max-w-2xl p-8 md:p-16 space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-950/80 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-red-500" />
              <span>Program Kemitraan Digital</span>
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] text-white">
              Tingkatkan Omset & Kelola Antrean{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-600 to-orange-500">
                Secara Digital.
              </span>
            </h1>

            <p className="text-zinc-400 text-sm md:text-base leading-relaxed max-w-lg">
              Bergabunglah menjadi mitra BengkelKu. Pelanggan dapat menemukan
              bengkel Anda dengan mudah, reservasi online, dan memantau status
              servis secara realtime.
            </p>

            <div className="pt-2">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={scrollToForm}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold px-8 py-4 rounded-xl transition shadow-xl shadow-red-600/30 text-sm flex items-center gap-3"
              >
                <span>Daftar Jadi Mitra Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. MANFAAT SECTION (OVERLAPPING / STACKED CARDS) */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-16 space-y-3">
          <p className="text-xs font-bold text-red-500 tracking-widest uppercase">
            Fitur Utama
          </p>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            Keuntungan Menjadi Mitra
          </h2>
          <div className="w-12 h-1 bg-gradient-to-r from-red-600 to-amber-500 mx-auto rounded-full" />
        </div>

        {/* Container Stacking Cards */}
        <div ref={benefitsContainerRef} className="space-y-8 relative">
          {benefits.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className={`benefit-card sticky top-28 bg-gradient-to-br ${item.gradient} border border-zinc-800 p-8 md:p-10 rounded-3xl shadow-2xl backdrop-blur-2xl transition-all`}
              >
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0 shadow-lg">
                    <Icon className="w-8 h-8" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <span className="inline-block text-[10px] font-extrabold text-red-400 bg-red-950/80 border border-red-800/50 px-2.5 py-1 rounded-md tracking-wider uppercase">
                      {item.tag}
                    </span>
                    <h3 className="font-bold text-xl text-white">
                      {item.title}
                    </h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. FORM REGISTRASI SECTION */}
      <section
        id="form-section"
        className="py-24 px-6 relative bg-zinc-950/60 border-t border-b border-zinc-800/80"
      >
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-12 space-y-3">
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Formulir Pendaftaran
            </h2>
            <p className="text-zinc-400 text-sm max-w-md mx-auto">
              Lengkapi data di bawah ini untuk memulai integrasi sistem bengkel
              Anda.
            </p>
            <div className="w-12 h-1 bg-red-600 mx-auto rounded-full" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-black/80 border border-zinc-800 p-8 md:p-12 rounded-3xl shadow-2xl relative overflow-hidden backdrop-blur-xl"
          >
            {/* Ambient Background Glow */}
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-red-600/10 rounded-full blur-[100px] pointer-events-none" />

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              {/* Data Pemilik */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-600" />
                  <span className="text-xs font-bold text-zinc-300 tracking-wider uppercase">
                    Data Pemilik Bengkel
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-zinc-400 text-xs font-semibold mb-2">
                      Nama Lengkap Pemilik
                    </label>
                    <div className="relative group">
                      <User className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500 group-focus-within:text-red-500 transition-colors" />
                      <input
                        type="text"
                        name="owner_name"
                        required
                        value={formData.owner_name}
                        onChange={handleChange}
                        className="w-full bg-zinc-950 border border-zinc-800 p-3.5 pl-10 rounded-xl text-sm text-white placeholder-zinc-600 outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition"
                        placeholder="Masukkan nama Anda"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-zinc-400 text-xs font-semibold mb-2">
                      Nomor WhatsApp
                    </label>
                    <div className="relative group">
                      <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500 group-focus-within:text-red-500 transition-colors" />
                      <input
                        type="text"
                        name="whatsapp"
                        required
                        value={formData.whatsapp}
                        onChange={handleChange}
                        className="w-full bg-zinc-950 border border-zinc-800 p-3.5 pl-10 rounded-xl text-sm text-white placeholder-zinc-600 outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition"
                        placeholder="Cth: 08123456789"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Bengkel */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-600" />
                  <span className="text-xs font-bold text-zinc-300 tracking-wider uppercase">
                    Informasi Bengkel
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-zinc-400 text-xs font-semibold mb-2">
                      Nama Bengkel
                    </label>
                    <div className="relative group">
                      <Store className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500 group-focus-within:text-red-500 transition-colors" />
                      <input
                        type="text"
                        name="bengkel_name"
                        required
                        value={formData.bengkel_name}
                        onChange={handleChange}
                        className="w-full bg-zinc-950 border border-zinc-800 p-3.5 pl-10 rounded-xl text-sm text-white placeholder-zinc-600 outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition"
                        placeholder="Masukkan nama bengkel"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-zinc-400 text-xs font-semibold mb-2">
                      Nomor Telepon Bengkel
                    </label>
                    <div className="relative group">
                      <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500 group-focus-within:text-red-500 transition-colors" />
                      <input
                        type="text"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full bg-zinc-950 border border-zinc-800 p-3.5 pl-10 rounded-xl text-sm text-white placeholder-zinc-600 outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition"
                        placeholder="Cth: 021-123456"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Alamat */}
              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-2">
                  Alamat Bengkel
                </label>
                <div className="relative group">
                  <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500 group-focus-within:text-red-500 transition-colors" />
                  <textarea
                    name="address"
                    required
                    rows="3"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full bg-zinc-950 border border-zinc-800 p-3.5 pl-10 rounded-xl text-sm text-white placeholder-zinc-600 outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition"
                    placeholder="Tuliskan alamat lengkap bengkel..."
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-2">
                  Buat Password Login
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500 group-focus-within:text-red-500 transition-colors" />
                  <input
                    type="password"
                    name="password"
                    required
                    minLength="6"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-zinc-950 border border-zinc-800 p-3.5 pl-10 rounded-xl text-sm text-white placeholder-zinc-600 outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition"
                    placeholder="Minimal 6 karakter"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-500 text-white font-bold py-4 rounded-xl transition shadow-xl shadow-red-600/20 flex items-center justify-center gap-2 text-sm"
                >
                  {isLoading ? (
                    <>
                      <Wrench className="w-4 h-4 animate-spin text-white" />
                      <span>Mengirim Data...</span>
                    </>
                  ) : (
                    <>
                      <span>Kirim Pengajuan Kemitraan</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      </section>

      {/* 4. FAQ SECTION (SMOOTH ACCORDION) */}
      <section className="py-24 px-6 max-w-3xl mx-auto">
        <div className="text-center mb-12 space-y-3">
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            Pertanyaan Umum
          </h2>
          <div className="w-12 h-1 bg-red-600 mx-auto rounded-full" />
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="bg-zinc-950 border border-zinc-800/80 rounded-2xl overflow-hidden backdrop-blur-md"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-zinc-900/50 transition-colors"
                >
                  <span className="font-bold text-sm text-zinc-200">
                    {faq.question}
                  </span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown
                      className={`w-5 h-5 ${
                        isOpen ? "text-red-500" : "text-zinc-500"
                      }`}
                    />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <div className="px-6 pb-6 text-xs md:text-sm text-zinc-400 leading-relaxed border-t border-zinc-900 pt-4">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-zinc-950 border-t border-zinc-900 py-12 px-6 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
              <Wrench className="w-3 h-3" />
            </div>
            <span>
              &copy; {new Date().getFullYear()} BengkelKu Platform. All rights
              reserved.
            </span>
          </div>

          <div className="flex gap-6">
            <Link href="/" className="hover:text-zinc-300 transition-colors">
              Beranda
            </Link>
            <Link
              href="/login"
              className="hover:text-zinc-300 transition-colors"
            >
              Login Mitra
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
