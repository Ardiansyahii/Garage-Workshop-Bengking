"use client";

import { useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import { motion } from "framer-motion";
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
} from "lucide-react";

// Data dummy untuk bagian FAQ
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
    document
      .getElementById("form-section")
      .scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-black text-white selection:bg-red-600 font-sans overflow-x-hidden">
      {/* NAVBAR SEDERHANA */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition font-semibold text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
          </Link>
          <div className="text-lg font-black tracking-wider flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/30">
              <Wrench className="w-4 h-4 text-white" />
            </div>
            <span>
              BENGKEL<span className="text-red-600">KU</span>
            </span>
          </div>
        </div>
      </nav>

      {/* 1. HERO SECTION */}
      <section className="relative pt-12 pb-20 px-6 max-w-7xl mx-auto mt-10">
        <div className="relative bg-zinc-950 border border-zinc-900 rounded-3xl overflow-hidden min-h-[400px] flex items-center shadow-2xl">
          {/* Background Image & Overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src="/banner-bg.png"
              alt="Garage Background"
              className="w-full h-full object-cover filter brightness-[0.5] contrast-125"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
          </div>

          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 max-w-2xl p-8 md:p-22 space-y-6"
          >
            <h1 className="text-3xl md:text-5xl font-black leading-[1.2]">
              Tingkatkan Omset dan <br /> Kelola Antrean Bengkel{" "}
              <span className="text-red-600">Secara Digital.</span>
            </h1>
            <p className="text-zinc-400 text-sm md:text-base leading-relaxed max-w-lg">
              Bergabunglah menjadi mitra BengkelKu. Konsumen dapat menemukan
              bengkel Anda dengan mudah, melakukan reservasi online, dan
              memantau status servis.
            </p>
            <button
              onClick={scrollToForm}
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-4 rounded-xl transition shadow-lg shadow-red-600/20 text-sm flex items-center gap-2"
            >
              Daftar Jadi Mitra <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* 2. MANFAAT SECTION */}
      <section className="py-46 pt-1 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-black text-white">
            Manfaat Menjadi Mitra BengkelKu
          </h2>
          <div className="w-16 h-1 bg-red-600 mx-auto mt-4 rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-zinc-950 border border-zinc-900 p-8 rounded-3xl text-center space-y-4 hover:border-zinc-800 transition"
          >
            <div className="w-14 h-14 bg-red-600/10 rounded-2xl flex items-center justify-center mx-auto text-red-600">
              <TrendingUp className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-lg text-white">
              Kelola Bisnis Berkelanjutan
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Tingkatkan visibilitas bengkel Anda ke ribuan pengguna platform
              kami di seluruh area sekitar Anda.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-zinc-950 border border-zinc-900 p-8 rounded-3xl text-center space-y-4 hover:border-zinc-800 transition"
          >
            <div className="w-14 h-14 bg-red-600/10 rounded-2xl flex items-center justify-center mx-auto text-red-600">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-lg text-white">Manajemen Terpusat</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Atur layanan, harga, dan jadwal operasional bengkel sepenuhnya di
              bawah kendali Anda sendiri.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-zinc-950 border border-zinc-900 p-8 rounded-3xl text-center space-y-4 hover:border-zinc-800 transition"
          >
            <div className="w-14 h-14 bg-red-600/10 rounded-2xl flex items-center justify-center mx-auto text-red-600">
              <Smartphone className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-lg text-white">
              Kemudahan Akses Digital
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Sistem notifikasi otomatis via WhatsApp dan dashboard modern yang
              mudah diakses dari perangkat apapun.
            </p>
          </motion.div>
        </div>
      </section>

      {/* 3. FORM REGISTRASI SECTION */}
      <section
        id="form-section"
        className="py-20 px-6 bg-zinc-950/50 border-t border-b border-zinc-900"
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-black text-white">
              Daftar Jadi Mitra
            </h2>
            <div className="w-16 h-1 bg-red-600 mx-auto mt-4 rounded-full"></div>
            <p className="text-zinc-400 text-sm mt-4">
              Lengkapi informasi di bawah ini untuk mengajukan kemitraan.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-black border border-zinc-900 p-8 md:p-12 rounded-3xl shadow-2xl relative overflow-hidden"
          >
            {/* Visual Efek */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full blur-[80px] pointer-events-none" />

            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              {/* Data Pemilik (2 Kolom di Desktop) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-zinc-400 text-xs font-semibold mb-2">
                    Nama Lengkap Pemilik
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      name="owner_name"
                      required
                      value={formData.owner_name}
                      onChange={handleChange}
                      className="w-full bg-zinc-950 border border-zinc-800 p-3 pl-10 rounded-xl text-sm text-white outline-none focus:border-red-600 transition"
                      placeholder="Masukkan nama Anda"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs font-semibold mb-2">
                    Nomor WhatsApp Pribadi
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      name="whatsapp"
                      required
                      value={formData.whatsapp}
                      onChange={handleChange}
                      className="w-full bg-zinc-950 border border-zinc-800 p-3 pl-10 rounded-xl text-sm text-white outline-none focus:border-red-600 transition"
                      placeholder="Cth: 08123456789"
                    />
                  </div>
                </div>
              </div>

              {/* Data Bengkel (2 Kolom di Desktop) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-zinc-400 text-xs font-semibold mb-2">
                    Nama Bengkel
                  </label>
                  <div className="relative">
                    <Store className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      name="bengkel_name"
                      required
                      value={formData.bengkel_name}
                      onChange={handleChange}
                      className="w-full bg-zinc-950 border border-zinc-800 p-3 pl-10 rounded-xl text-sm text-white outline-none focus:border-red-600 transition"
                      placeholder="Masukkan nama bengkel"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs font-semibold mb-2">
                    Nomor Telepon Bengkel
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full bg-zinc-950 border border-zinc-800 p-3 pl-10 rounded-xl text-sm text-white outline-none focus:border-red-600 transition"
                      placeholder="Cth: 021-123456"
                    />
                  </div>
                </div>
              </div>

              {/* Alamat (Full Width) */}
              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-2">
                  Alamat Bengkel
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                  <textarea
                    name="address"
                    required
                    rows="3"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full bg-zinc-950 border border-zinc-800 p-3 pl-10 rounded-xl text-sm text-white outline-none focus:border-red-600 transition"
                    placeholder="Tuliskan alamat lengkap..."
                  ></textarea>
                </div>
              </div>

              {/* Password (Full Width) */}
              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-2">
                  Buat Password Login
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                  <input
                    type="password"
                    name="password"
                    required
                    minLength="6"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-zinc-950 border border-zinc-800 p-3 pl-10 rounded-xl text-sm text-white outline-none focus:border-red-600 transition"
                    placeholder="Minimal 6 karakter"
                  />
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-bold py-4 rounded-xl transition shadow-lg flex items-center justify-center gap-2 text-sm"
                >
                  {isLoading ? (
                    <>
                      <Wrench className="w-4 h-4 animate-spin" /> Mengirim
                      Data...
                    </>
                  ) : (
                    "Kirim Pengajuan Kemitraan"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </section>

      {/* 4. FAQ SECTION */}
      <section className="py-20 px-6 max-w-3xl mx-auto mb-10">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-black text-white">
            Hal yang sering ditanyakan
          </h2>
          <div className="w-16 h-1 bg-red-600 mx-auto mt-4 rounded-full"></div>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden transition-all duration-300"
            >
              <button
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full flex items-center justify-between p-5 md:p-6 text-left hover:bg-zinc-900/50 transition"
              >
                <span className="font-bold text-sm text-zinc-200">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-zinc-500 transition-transform duration-300 ${openFaq === index ? "rotate-180 text-red-500" : ""}`}
                />
              </button>

              <div
                className={`transition-all duration-300 ease-in-out ${openFaq === index ? "max-h-40 opacity-100" : "max-h-0 opacity-0"} overflow-hidden`}
              >
                <div className="p-5 md:p-6 pt-0 text-xs md:text-sm text-zinc-400 leading-relaxed border-t border-zinc-900/50 mt-2">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-zinc-950 border-t border-zinc-900 py-10 px-6 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            &copy; {new Date().getFullYear()} BengkelKu. All rights reserved.
          </div>
          <div className="flex gap-6">
            <Link href="/" className="hover:text-zinc-300 transition">
              Beranda
            </Link>
            <Link href="/login" className="hover:text-zinc-300 transition">
              Login Mitra
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
