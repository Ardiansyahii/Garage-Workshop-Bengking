"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wrench,
  ArrowRight,
  Star,
  ChevronDown,
  XCircle,
  CheckCircle2,
  Car,
  Monitor,
  Smartphone,
  Search,
  Calendar,
  Activity,
  MessageSquare,
  AlertTriangle,
  MapPin,
  BadgeDollarSign,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "@studio-freight/lenis";
import Image from "next/image";

gsap.registerPlugin(ScrollTrigger);

// --- Konfigurasi Framer Motion ---
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};
const staggerChildren = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);

  // Refs untuk GSAP
  const containerRef = useRef(null);
  const heroRef = useRef(null);
  const scrollTextRef = useRef(null);
  const mockupRef = useRef(null);

  // --- 1. Inisialisasi Lenis & Sistem ---
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: "vertical",
      smooth: true,
    });

    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0, 0);

    // Simulasi loading sistem awal (jika kamu masih pakai API, fetch di sini)
    setTimeout(() => setIsLoading(false), 800);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(lenis.raf);
    };
  }, []);

  // --- 2. Arsitektur GSAP ---
  useEffect(() => {
    if (isLoading) return;

    let ctx = gsap.context(() => {
      // A. Overlapping Hero (Fade out saat di-scroll)
      gsap.to(heroRef.current, {
        opacity: 0,
        scale: 0.9,
        filter: "blur(10px)",
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      // B. Velocity Scroll pada Separator
      let direction = 1;
      ScrollTrigger.create({
        trigger: document.body,
        start: 0,
        end: "max",
        onUpdate: (self) => {
          direction = self.direction;
          let velocity = Math.abs(self.getVelocity() / 100);
          let skew = Math.max(0, Math.min(velocity, 15));
          gsap.to(scrollTextRef.current, {
            skewX: skew * direction,
            x: "-=" + direction * (velocity * 2),
            overwrite: "auto",
            duration: 0.5,
            ease: "power2.out",
          });
        },
      });

      // C. Parallax Mockup Dashboard
      gsap.fromTo(
        ".mockup-mobile",
        { y: 100 },
        {
          y: -50,
          ease: "none",
          scrollTrigger: {
            trigger: mockupRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
    }, containerRef);

    return () => ctx.revert();
  }, [isLoading]);

  const handleCtaClick = (e) => {
    e.preventDefault();
    const session = localStorage.getItem("user_session");
    if (session) {
      const parsed = JSON.parse(session);
      if (parsed.role === "superadmin") window.location.href = "/superadmin";
      else if (parsed.role === "admin_bengkel") window.location.href = "/admin";
      else window.location.href = "/dashboard";
    } else {
      Swal.fire({
        icon: "warning",
        title: "Akses Diperlukan",
        text: "Silakan masuk untuk menggunakan fitur reservasi.",
        confirmButtonText: "Masuk / Daftar",
        confirmButtonColor: "#dc2626",
        background: "#0a0a0a",
        color: "#ffffff",
      }).then((result) => {
        if (result.isConfirmed) window.location.href = "/login";
      });
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-[#050505] flex items-center justify-center text-white">
        <Wrench className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="bg-[#050505] text-zinc-100 font-sans selection:bg-red-600 selection:text-white"
    >
      {/* 1. NAVBAR */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center bg-[#050505]/70 backdrop-blur-md border-b border-white/[0.05]">
        <div className="text-xl font-black tracking-tighter flex items-center gap-2">
          <Wrench className="w-5 h-5 text-red-600" /> BENGKEL
          <span className="text-zinc-500">KU</span>
        </div>
        <div className="hidden md:flex gap-8 text-sm font-semibold">
          <Link
            href="/register-mitra"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            Jadi Mitra
          </Link>
          <Link
            href="/login"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            Masuk
          </Link>
          <Link
            href="/register"
            className="text-red-500 hover:text-red-400 transition-colors"
          >
            Daftar
          </Link>
        </div>
      </nav>

      {/* 2. HERO BESAR (Sticky/Pinned untuk Overlapping efek) */}
      <section
        ref={heroRef}
        className="h-screen w-full flex flex-col justify-center px-6 md:px-20 relative z-0 bg-[#050505] border-b border-zinc-900"
      >
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-red-900/10 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 max-w-7xl mx-auto w-full flex flex-col justify-center mt-16 md:mt-24 h-full">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerChildren}
            className="max-w-5xl"
          >
            {/* Tagline / Badge */}
            <motion.div
              variants={fadeUp}
              className="font-mono text-red-600 text-sm mb-6 tracking-widest uppercase flex items-center gap-2"
            ></motion.div>

            {/* Judul */}
            <motion.h1
              variants={fadeUp}
              className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8 uppercase"
            >
              Servis{" "}
              <span className="text-zinc-600 text-transparent bg-clip-text bg-gradient-to-b from-zinc-500 to-zinc-800">
                Cerdas.
              </span>
              <br />
              Nol Waktu
              <br />
              Tunggu.
            </motion.h1>

            {/* Subjudul */}
            <motion.p
              variants={fadeUp}
              className="text-zinc-400 max-w-xl text-lg md:text-xl leading-relaxed mb-10"
            >
              Hindari praktik harga gelap dan antrean panjang. Pilih bengkel,
              konfirmasi harga di awal, dan pantau status perbaikan kendaraanmu
              secara presisi.
            </motion.p>

            {/* Primary CTA */}
            <motion.button
              variants={fadeUp}
              onClick={handleCtaClick}
              className="group relative px-8 py-5 bg-red-600 text-white font-bold text-sm tracking-wide uppercase flex items-center gap-3 overflow-hidden w-fit"
            >
              <span className="absolute inset-0 bg-red-700 -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out"></span>
              <span className="relative z-10 flex items-center gap-3">
                Mulai Reservasi{" "}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </span>
            </motion.button>
          </motion.div>

          {/* Statistik (Masuk ke dalam Hero) */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerChildren}
            className="grid grid-cols-2 md:grid-cols-3 gap-8 mt-16 md:mt-auto pb-10 border-t border-zinc-900 pt-8 w-full max-w-4xl"
          >
            <motion.div variants={fadeUp} className="space-y-1">
              <h3 className="text-3xl md:text-5xl font-black text-white">
                10.000+
              </h3>
              <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest">
                Booking
              </p>
            </motion.div>
            <motion.div
              variants={fadeUp}
              className="space-y-1 col-span-2 md:col-span-1"
            >
              <h3 className="text-3xl md:text-5xl font-black text-white">
                98%
              </h3>
              <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest">
                Customer Satisfaction
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 3. PARTNER & STATISTIK (Overlapping Hero) */}
      <section className="relative z-10 bg-[#050505] pt-20 pb-10 border-t border-zinc-900">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerChildren}
          className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-zinc-900"
        >
          <motion.div variants={fadeUp} className="py-8">
            <h3 className="text-5xl font-black text-white mb-2">500+</h3>
            <p className="font-mono text-zinc-500 uppercase tracking-widest text-sm">
              Mitra Bengkel
            </p>
          </motion.div>
          <motion.div variants={fadeUp} className="py-8">
            <h3 className="text-5xl font-black text-white mb-2">20K+</h3>
            <p className="font-mono text-zinc-500 uppercase tracking-widest text-sm">
              Booking Sukses
            </p>
          </motion.div>
          <motion.div variants={fadeUp} className="py-8">
            <h3 className="text-5xl font-black text-white mb-2">98%</h3>
            <p className="font-mono text-zinc-500 uppercase tracking-widest text-sm">
              Satisfaction Rate
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* 4. MASALAH (Sticky Background) */}
      <section className="sticky top-20 z-0 bg-[#0a0505] min-h-[80vh] py-32 px-6 flex flex-col items-center">
        <div className="max-w-5xl w-full text-center mb-16">
          <p className="text-red-500 font-mono text-sm tracking-widest mb-4 uppercase">
            Realita Saat Ini
          </p>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter">
            Servis Mobil Harusnya
            <br />
            Tidak Sesulit Ini.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
          {[
            {
              icon: AlertTriangle,
              title: "Antre Berjam-jam",
              desc: "Datang pagi buta hanya untuk mengambil nomor antrean fisik.",
            },
            {
              icon: BadgeDollarSign,
              title: "Harga Gelap",
              desc: "Tagihan tiba-tiba membengkak di akhir tanpa konfirmasi awal.",
            },
            {
              icon: MapPin,
              title: "Sulit Cari Bengkel",
              desc: "Tidak tahu mana bengkel spesialis yang terpercaya di sekitar Anda.",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-red-950/20 border border-red-900/30 p-8 rounded-3xl text-center flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-red-950 text-red-500 flex items-center justify-center mb-6">
                <item.icon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">{item.title}</h3>
              <p className="text-zinc-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. SOLUSI (Menimpa Masalah secara elegan) */}
      <section className="relative z-20 bg-zinc-950 py-32 px-6 border-t border-zinc-900 rounded-t-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-emerald-500 font-mono text-sm tracking-widest mb-4 uppercase">
              Inovasi BengkelKu
            </p>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter">
              Kendali Penuh di
              <br />
              Tangan Anda.
            </h2>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerChildren}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              {
                icon: Smartphone,
                title: "Booking Online",
                desc: "Amankan slot mekanik dari rumah. Datang langsung dikerjakan.",
              },
              {
                icon: Activity,
                title: "Realtime Tracking",
                desc: "Pantau setiap proses servis (diagnosa, bongkar, selesai) via HP.",
              },
              {
                icon: CheckCircle2,
                title: "Harga Transparan",
                desc: "Estimasi biaya di depan. Setujui di aplikasi sebelum dikerjakan.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="bg-[#050505] border border-zinc-900 hover:border-emerald-900/50 transition-colors p-8 rounded-3xl text-center flex flex-col items-center group"
              >
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 group-hover:bg-emerald-950 text-zinc-500 group-hover:text-emerald-500 transition-colors flex items-center justify-center mb-6">
                  <item.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-zinc-400 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* VELOCITY SCROLL TEXT (Pemisah Dinamis) */}
      <section className="py-8 bg-white overflow-hidden relative z-20 border-y border-zinc-800">
        <div ref={scrollTextRef} className="flex whitespace-nowrap">
          {[...Array(6)].map((_, i) => (
            <h2
              key={i}
              className="text-6xl md:text-8xl font-black text-black leading-none mr-8 tracking-tighter uppercase"
            >
              BENGKELKU - WORKFLOW -
            </h2>
          ))}
        </div>
      </section>

      {/* 6. CARA KERJA (How It Works) */}
      <section className="py-32 px-6 bg-[#050505] relative z-20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-20 text-center">
            Bagaimana Cara Kerjanya?
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 relative">
            {/* Garis penghubung (Desktop) */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-zinc-800 -translate-y-1/2 z-0"></div>

            {[
              {
                step: "01",
                icon: Search,
                title: "Cari",
                desc: "Temukan bengkel terdekat",
              },
              {
                step: "02",
                icon: Calendar,
                title: "Booking",
                desc: "Pilih tanggal & jam pasti",
              },
              {
                step: "03",
                icon: Car,
                title: "Datang",
                desc: "Langsung masuk tanpa antre",
              },
              {
                step: "04",
                icon: Activity,
                title: "Pantau",
                desc: "Cek progres dari HP Anda",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative z-10 flex flex-col items-center text-center bg-[#050505] pt-4"
              >
                <div className="w-16 h-16 rounded-full bg-zinc-900 border-2 border-[#050505] flex items-center justify-center text-white font-black text-xl mb-6 shadow-xl">
                  {item.icon === Car ? (
                    <item.icon className="w-6 h-6 text-red-500" />
                  ) : (
                    item.step
                  )}
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-zinc-500 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. PREVIEW DASHBOARD (Desktop & Mobile Parallax) */}
      <section
        ref={mockupRef}
        className="py-32 px-6 bg-zinc-950 relative z-20 border-t border-zinc-900 overflow-hidden"
      >
        <div className="max-w-6xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">
            Satu Akun, Semua Perangkat.
          </h2>
          <p className="text-zinc-400">
            Akses via Desktop untuk analitik lengkap, atau via Mobile untuk
            pantauan saat bepergian.
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto h-[400px] md:h-[600px] flex justify-center items-end">
          {/* Desktop Mockup */}
          <div className="absolute bottom-0 w-full md:w-[80%] aspect-video bg-[#0a0a0a] border-t border-x border-zinc-800 rounded-t-3xl p-6 shadow-2xl flex flex-col">
            <div className="flex gap-2 border-b border-zinc-900 pb-4 mb-4">
              <Monitor className="w-5 h-5 text-zinc-500" />
              <span className="text-xs font-mono text-zinc-500">
                app.bengkelku.id/dashboard
              </span>
            </div>
            <div className="flex-1 flex gap-6">
              <div className="w-1/4 h-full bg-zinc-900/50 rounded-xl hidden md:block border border-zinc-800/50"></div>
              <div className="flex-1 h-full flex flex-col gap-4">
                <div className="w-full h-1/3 bg-zinc-900/50 rounded-xl border border-zinc-800/50"></div>
                <div className="w-full h-2/3 bg-zinc-900/50 rounded-xl border border-zinc-800/50"></div>
              </div>
            </div>
          </div>

          {/* Mobile Mockup (Parallax) */}
          <div className="mockup-mobile absolute -bottom-10 right-0 md:right-10 w-[200px] md:w-[280px] aspect-[9/16] bg-black border-4 border-zinc-800 rounded-[2rem] shadow-2xl p-4 flex flex-col z-20">
            <div className="flex justify-between items-center mb-6 mt-2 px-2">
              <Smartphone className="w-4 h-4 text-zinc-500" />
              <div className="w-12 h-4 bg-zinc-900 rounded-full"></div>
            </div>
            <div className="w-full h-24 bg-red-600/20 border border-red-900/30 rounded-xl mb-4 p-3 flex flex-col justify-between">
              <span className="text-[10px] text-red-500 font-mono">
                SERVIS AKTIF
              </span>
              <div className="h-2 w-3/4 bg-red-600 rounded-full"></div>
            </div>
            <div className="flex-1 bg-zinc-900/50 rounded-xl border border-zinc-800/50"></div>
          </div>
        </div>
      </section>

      {/* 8. TESTIMONI */}
      <section className="py-32 px-6 bg-[#050505] relative z-20 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter">
              Dipercaya Oleh
              <br />
              Pengendara Cerdas.
            </h2>
            <div className="flex gap-1 text-red-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 fill-current" />
              ))}
            </div>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerChildren}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              {
                name: "Budi S.",
                role: "Driver Online",
                msg: "Sangat membantu! Saya tidak perlu kehilangan waktu narik karena antre di bengkel. Datang langsung ganti oli.",
              },
              {
                name: "Anita K.",
                role: "Pekerja Kantoran",
                msg: "Dulu sering takut ditipu bengkel soal harga. Di BengkelKu, harganya fix di awal. Sangat transparan.",
              },
              {
                name: "Ridwan M.",
                role: "Klub Mobil",
                msg: "Fitur realtime tracking-nya gila. Saya bisa tahu mobil saya sedang di-scan atau dibongkar dari HP.",
              },
            ].map((testi, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="bg-zinc-950 border border-zinc-900 p-8 rounded-3xl flex flex-col justify-between"
              >
                <MessageSquare className="w-8 h-8 text-zinc-800 mb-6" />
                <p className="text-zinc-300 text-sm leading-relaxed mb-8">
                  "{testi.msg}"
                </p>
                <div className="border-t border-zinc-900 pt-4 mt-auto">
                  <p className="font-bold text-white">{testi.name}</p>
                  <p className="text-xs text-zinc-500">{testi.role}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 9. FAQ */}
      <section className="py-32 px-6 bg-zinc-950 relative z-20 border-t border-zinc-900">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-black tracking-tighter mb-12 text-center">
            Pertanyaan Umum
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "Apakah platform ini gratis untuk pemilik mobil?",
                a: "Ya. Akun pengguna 100% gratis. Anda hanya membayar biaya servis ke bengkel terkait.",
              },
              {
                q: "Bagaimana jika ada kerusakan tambahan yang ditemukan mekanik?",
                a: "Mekanik akan mengupdate sistem. Anda akan menerima notifikasi estimasi biaya tambahan, dan bengkel baru akan bekerja SETELAH Anda menekan tombol Setuju di aplikasi.",
              },
              {
                q: "Apakah saya bisa membatalkan jadwal?",
                a: "Bisa, pembatalan gratis dapat dilakukan maksimal 2 jam sebelum jadwal yang telah ditentukan.",
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                className="border border-zinc-800 bg-[#050505] rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex justify-between items-center p-6 text-left font-bold text-zinc-200"
                >
                  {faq.q}
                  <motion.div
                    animate={{ rotate: openFaq === idx ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="w-5 h-5 text-red-600" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-6 text-zinc-400 text-sm leading-relaxed">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. CTA GABUNG MITRA */}
      <section className="bg-red-600 relative z-20 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none">
          <h2 className="text-[20vw] font-black leading-none text-black">
            MITRA
          </h2>
        </div>
        <div className="py-32 px-6 max-w-5xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-10 text-center md:text-left">
          <div>
            <h2 className="text-5xl md:text-7xl font-black text-black tracking-tighter mb-4 leading-none">
              PUNYA
              <br />
              BENGKEL?
            </h2>
            <p className="text-red-950 font-bold max-w-sm text-lg">
              Digitalisasi bengkel Anda. Dapatkan pelanggan baru dan kelola
              antrean secara sistematis.
            </p>
          </div>
          <Link
            href="/register-mitra"
            className="shrink-0 bg-black text-white px-10 py-6 text-lg font-bold hover:bg-zinc-900 transition-colors flex items-center gap-3"
          >
            Gabung Jadi Mitra <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* 11. FOOTER */}
      <footer className="bg-black py-12 px-6 border-t border-zinc-900 relative z-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-red-600" />
            <span className="text-lg font-black tracking-tighter text-white">
              BENGKEL<span className="text-zinc-600">KU</span>
            </span>
          </div>
          <div className="flex gap-8 text-xs font-mono text-zinc-500 font-bold">
            <Link href="/login" className="hover:text-white transition-colors">
              MASUK
            </Link>
            <Link
              href="/register"
              className="hover:text-white transition-colors"
            >
              DAFTAR
            </Link>
            <Link
              href="/register-mitra"
              className="hover:text-white transition-colors"
            >
              KEMITRAAN
            </Link>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-zinc-900 text-center text-xs font-mono text-zinc-600">
          &copy; {new Date().getFullYear()} BENGKELKU. HAK CIPTA DILINDUNGI.
        </div>
      </footer>
    </div>
  );
}
