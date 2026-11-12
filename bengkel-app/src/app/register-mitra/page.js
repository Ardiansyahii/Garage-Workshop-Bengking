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
    gradient: "from-white via-white to-zinc-50",
  },
  {
    icon: ShieldCheck,
    title: "Manajemen Terpusat & Otonom",
    description:
      "Atur layanan, harga, dan jadwal operasional bengkel sepenuhnya di bawah kendali penuh Anda sendiri.",
    tag: "Full Control",
    gradient: "from-white via-white to-zinc-50",
  },
  {
    icon: Smartphone,
    title: "Kemudahan Akses Digital",
    description:
      "Sistem notifikasi otomatis via WhatsApp dan dashboard modern yang mudah diakses dari perangkat manapun.",
    tag: "Automation",
    gradient: "from-white via-white to-zinc-50",
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
          background: "#ffffff",
          color: "#171717",
          confirmButtonColor: "#171717",
        }).then(() => {
          window.location.href = "/";
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Pendaftaran Gagal",
          text: data.message,
          background: "#ffffff",
          color: "#171717",
          confirmButtonColor: "#171717",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Kesalahan Jaringan",
        text: "Gagal terhubung ke server. Pastikan backend sudah menyala.",
        background: "#ffffff",
        color: "#171717",
        confirmButtonColor: "#171717",
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
    <main className="min-h-screen bg-[#FAFAFA] text-zinc-900 font-sans selection:bg-zinc-900 selection:text-white antialiased overflow-x-hidden">
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-900 transition-colors text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Kembali ke Beranda</span>
          </Link>

          <div className="text-base font-black tracking-wider flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 flex items-center justify-center shadow-lg shadow-zinc-900/20 ring-1 ring-black/10">
              <Wrench className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-zinc-900 font-extrabold tracking-tight text-lg">
              APE<span className="text-zinc-500">X</span> GARAGE
            </span>
          </div>
        </div>
      </nav>

      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-16 px-6 max-w-7xl mx-auto">
        <div className="relative bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden min-h-[520px] flex items-center shadow-2xl">
          {/* Parallax Image & Gradient Overlays */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <img
              ref={heroImageRef}
              src="/banner-bg.png"
              alt="Garage Background"
              className="w-full h-[125%] object-cover filter grayscale brightness-[0.35] contrast-125"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#171717] via-[#171717]/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#171717] via-transparent to-transparent" />
          </div>

          {/* Hero Content dengan Framer Motion */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-10 max-w-2xl p-8 md:p-16 space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>Program Kemitraan Digital</span>
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] text-white">
              Tingkatkan Omset & Kelola Antrean{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-300 via-white to-zinc-400">
                Secara Digital.
              </span>
            </h1>

            <p className="text-zinc-300 text-sm md:text-base leading-relaxed max-w-lg">
              Bergabunglah menjadi mitra APEX GARAGE. Pelanggan dapat menemukan
              bengkel Anda dengan mudah, reservasi online, dan memantau status
              servis secara realtime.
            </p>

            <div className="pt-2">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={scrollToForm}
                className="bg-white hover:bg-zinc-200 text-zinc-900 font-bold px-8 py-4 rounded-xl transition shadow-xl shadow-black/30 text-sm flex items-center gap-3"
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
          <p className="text-xs font-bold text-zinc-500 tracking-widest uppercase">
            Fitur Utama
          </p>
          <h2 className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tight">
            Keuntungan Menjadi Mitra
          </h2>
          <div className="w-12 h-1 bg-zinc-900 mx-auto rounded-full" />
        </div>

        {/* Container Stacking Cards */}
        <div ref={benefitsContainerRef} className="space-y-8 relative">
          {benefits.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className={`benefit-card sticky top-28 bg-gradient-to-br ${item.gradient} border border-zinc-200 p-8 md:p-10 rounded-3xl shadow-xl shadow-zinc-200/60 backdrop-blur-2xl transition-all`}
              >
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-900 shrink-0 shadow-sm">
                    <Icon className="w-8 h-8" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <span className="inline-block text-[10px] font-extrabold text-zinc-600 bg-zinc-100 border border-zinc-200 px-2.5 py-1 rounded-md tracking-wider uppercase">
                      {item.tag}
                    </span>
                    <h3 className="font-bold text-xl text-zinc-900">
                      {item.title}
                    </h3>
                    <p className="text-sm text-zinc-600 leading-relaxed">
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
        className="py-24 px-6 relative bg-white border-t border-b border-zinc-200"
      >
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-12 space-y-3">
            <h2 className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tight">
              Formulir Pendaftaran
            </h2>
            <p className="text-zinc-500 text-sm max-w-md mx-auto">
              Lengkapi data di bawah ini untuk memulai integrasi sistem bengkel
              Anda.
            </p>
            <div className="w-12 h-1 bg-zinc-900 mx-auto rounded-full" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white border border-zinc-200 p-8 md:p-12 rounded-3xl shadow-xl shadow-zinc-200/60 relative overflow-hidden backdrop-blur-xl"
          >
            {/* Ambient Background Glow */}
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-zinc-200/50 rounded-full blur-[100px] pointer-events-none" />

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              {/* Data Pemilik */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-zinc-900" />
                  <span className="text-xs font-bold text-zinc-700 tracking-wider uppercase">
                    Data Pemilik Bengkel
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-zinc-700 text-xs font-semibold mb-2">
                      Nama Lengkap Pemilik
                    </label>
                    <div className="relative group">
                      <User className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
                      <input
                        type="text"
                        name="owner_name"
                        required
                        value={formData.owner_name}
                        onChange={handleChange}
                        className="w-full bg-white border border-zinc-200 p-3.5 pl-10 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/20 transition"
                        placeholder="Masukkan nama Anda"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-zinc-700 text-xs font-semibold mb-2">
                      Nomor WhatsApp
                    </label>
                    <div className="relative group">
                      <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
                      <input
                        type="text"
                        name="whatsapp"
                        required
                        value={formData.whatsapp}
                        onChange={handleChange}
                        className="w-full bg-white border border-zinc-200 p-3.5 pl-10 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/20 transition"
                        placeholder="Cth: 08123456789"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Bengkel */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-zinc-900" />
                  <span className="text-xs font-bold text-zinc-700 tracking-wider uppercase">
                    Informasi Bengkel
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-zinc-700 text-xs font-semibold mb-2">
                      Nama Bengkel
                    </label>
                    <div className="relative group">
                      <Store className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
                      <input
                        type="text"
                        name="bengkel_name"
                        required
                        value={formData.bengkel_name}
                        onChange={handleChange}
                        className="w-full bg-white border border-zinc-200 p-3.5 pl-10 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/20 transition"
                        placeholder="Masukkan nama bengkel"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-zinc-700 text-xs font-semibold mb-2">
                      Nomor Telepon Bengkel
                    </label>
                    <div className="relative group">
                      <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
                      <input
                        type="text"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full bg-white border border-zinc-200 p-3.5 pl-10 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/20 transition"
                        placeholder="Cth: 021-123456"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Alamat */}
              <div>
                <label className="block text-zinc-700 text-xs font-semibold mb-2">
                  Alamat Bengkel
                </label>
                <div className="relative group">
                  <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
                  <textarea
                    name="address"
                    required
                    rows="3"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-200 p-3.5 pl-10 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/20 transition"
                    placeholder="Tuliskan alamat lengkap bengkel..."
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-zinc-700 text-xs font-semibold mb-2">
                  Buat Password Login
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
                  <input
                    type="password"
                    name="password"
                    required
                    minLength="6"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-200 p-3.5 pl-10 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/20 transition"
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
                  className="w-full bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-500 text-white font-bold py-4 rounded-xl transition shadow-lg shadow-zinc-300/60 flex items-center justify-center gap-2 text-sm"
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
          <h2 className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tight">
            Pertanyaan Umum
          </h2>
          <div className="w-12 h-1 bg-zinc-900 mx-auto rounded-full" />
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="bg-white border border-zinc-200 rounded-2xl overflow-hidden backdrop-blur-md shadow-sm"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-zinc-50 transition-colors"
                >
                  <span className="font-bold text-sm text-zinc-900">
                    {faq.question}
                  </span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown
                      className={`w-5 h-5 ${
                        isOpen ? "text-zinc-900" : "text-zinc-400"
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
                      <div className="px-6 pb-6 text-xs md:text-sm text-zinc-600 leading-relaxed border-t border-zinc-100 pt-4">
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
      <footer className="bg-white border-t border-zinc-200 py-12 px-6 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-900">
              <Wrench className="w-3 h-3" />
            </div>
            <span>
              &copy; {new Date().getFullYear()} APEX GARAGE. All rights
              reserved.
            </span>
          </div>

          <div className="flex gap-6">
            <Link
              href="/"
              className="text-zinc-700 hover:text-zinc-900 transition-colors"
            >
              Beranda
            </Link>
            <Link
              href="/login"
              className="text-zinc-700 hover:text-zinc-900 transition-colors"
            >
              Login Mitra
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}