"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import EmptyState from "@/components/EmptyState";
import { fetchWithAuth } from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wrench,
  PlusCircle,
  LogOut,
  Clock,
  Calendar,
  Car,
  CheckCircle2,
  XCircle,
  FileText,
  Ban,
  AlertCircle,
  Menu,
  X,
  LayoutDashboard,
  CalendarDays,
  ChevronDown,
  UserRound,
  Bell,
  Phone,
  Lightbulb,
  Info,
  CalendarClock,
  Sparkles,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

export default function UserDashboard() {
  const [user, setUser] = useState(() => {
    const storedUser =
      typeof window !== "undefined"
        ? localStorage.getItem("user") || localStorage.getItem("user_session")
        : null;

    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState("Semua");
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const profileRef = useRef(null);

  const tabs = [
    "Semua",
    "Pending",
    "Menunggu Pembatalan",
    "Menunggu Reschedule",
    "Dikonfirmasi",
    "Sedang Dikerjakan",
    "Selesai",
    "Dibatalkan",
  ];

  // ==========================================
  // FIX: endpoint & query param disesuaikan dengan backend Express
  // Sebelumnya: /api/user-bookings?userId=... (404, endpoint tidak ada)
  // Sekarang:   /api/bookings?user_id=...     (sesuai routes/bookings.js
  //             & bookingController.getAllBookings)
  // ==========================================
  const fetchBookings = (userId) => {
    fetchWithAuth(`/api/bookings?user_id=${userId}`)
      .then((data) => {
        if (data?.success) {
          setBookings(data.data);
        }
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  };

  useEffect(() => {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    localStorage.setItem("user", JSON.stringify(user));
    fetchBookings(user.id);

    const interval = setInterval(() => {
      fetchBookings(user.id);
    }, 3000);

    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const scrollToSection = (id) => {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
    setIsMobileMenuOpen(false);
  };

  const clearAuthSession = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_session");
    document.cookie = "user_role=; path=/; max-age=0";
    document.cookie =
      "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  };

  const handleLogout = () => {
    Swal.fire({
      title: "Keluar Akun",
      text: "Apakah kamu yakin ingin keluar dari sesi ini?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Keluar",
      cancelButtonText: "Batal",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#27272a",
      background: "#09090b",
      color: "#f4f4f5",
    }).then((result) => {
      if (result.isConfirmed) {
        clearAuthSession();
        window.location.replace("/login");
      }
    });
  };

  const handleCancelBooking = async (bookingId) => {
    const { value: cancelReason } = await Swal.fire({
      title: "Alasan Pembatalan",
      text: "Tuliskan alasan mengapa kamu ingin membatalkan jadwal servis ini:",
      input: "textarea",
      inputPlaceholder: "Contoh: Ada keperluan mendadak / salah jadwal...",
      showCancelButton: true,
      confirmButtonText: "Kirim Pengajuan",
      cancelButtonText: "Kembali",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#52525b",
      background: "#09090b",
      color: "#f4f4f5",
      inputValidator: (value) => {
        if (!value) {
          return "Kamu wajib mengisi alasan pembatalan!";
        }
      },
    });

    if (cancelReason) {
      try {
        // NOTE: endpoint ini (/api/booking/cancel) belum terkonfirmasi ada
        // di backend (routes/bookings.js). Cek dulu apakah route & controller
        // untuk pembatalan booking sudah dibuat, kalau belum akan 404 juga.
        const data = await fetchWithAuth("/api/booking/cancel", {
          method: "PATCH",
          body: JSON.stringify({ booking_id: bookingId, reason: cancelReason }),
        });

        if (data.success) {
          Swal.fire({
            icon: "success",
            title: "Pengajuan Terkirim",
            text: data.message,
            background: "#09090b",
            color: "#f4f4f5",
            confirmButtonColor: "#dc2626",
          }).then(() => {
            if (user) fetchBookings(user.id);
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Gagal",
            text: data.message,
            background: "#09090b",
            color: "#f4f4f5",
          });
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Kesalahan Jaringan",
          text: "Gagal terhubung ke server.",
          background: "#09090b",
          color: "#f4f4f5",
        });
      }
    }
  };

  const handleRescheduleBooking = async (bookingId) => {
    const { value: formValues } = await Swal.fire({
      title: "Ubah Jadwal (Reschedule)",
      html: `
        <div style="text-align: left; font-size: 12px; color: #a1a1aa; display: flex; flex-direction: column; gap: 10px;">
          <label>Tanggal Baru:</label>
          <input type="date" id="swal-date" class="swal2-input" style="background: #18181b; color: white; border: 1px solid #27272a; margin: 0; width: 100%;">
          <label>Jam Baru:</label>
          <input type="time" id="swal-time" class="swal2-input" style="background: #18181b; color: white; border: 1px solid #27272a; margin: 0; width: 100%;">
          <label>Alasan Reschedule:</label>
          <textarea id="swal-reason" class="swal2-textarea" placeholder="Contoh: Ada halangan mendadak di jam tersebut..." style="background: #18181b; color: white; border: 1px solid #27272a; margin: 0; width: 100%;"></textarea>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Ajukan Reschedule",
      cancelButtonText: "Batal",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#52525b",
      background: "#09090b",
      color: "#f4f4f5",
      preConfirm: () => {
        const date = document.getElementById("swal-date").value;
        const time = document.getElementById("swal-time").value;
        const reason = document.getElementById("swal-reason").value;
        if (!date || !time || !reason) {
          Swal.showValidationMessage("Semua field wajib diisi!");
        }
        return { date, time, reason };
      },
    });

    if (formValues) {
      try {
        // NOTE: request ini PATCH ke /api/bookings (list endpoint), bukan ke
        // /api/bookings/:id. Cek lagi apakah backend memang punya handler
        // PATCH pada root "/", karena routes/bookings.js yang sebelumnya
        // dishare hanya punya PATCH /:id/status, bukan PATCH untuk reschedule.
        const data = await fetchWithAuth(`/api/bookings?user_id=${user.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            booking_id: bookingId,
            new_date: formValues.date,
            new_time: formValues.time,
            reason: formValues.reason,
          }),
        });
        if (data.success) {
          Swal.fire({
            icon: "success",
            title: "Berhasil Diajukan",
            text: data.message,
            background: "#09090b",
            color: "#f4f4f5",
          });
          if (user) fetchBookings(user.id);
        } else {
          Swal.fire({
            icon: "error",
            title: "Gagal",
            text: data.message,
            background: "#09090b",
            color: "#f4f4f5",
          });
        }
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Kesalahan Jaringan",
          text: "Gagal terhubung ke server.",
          background: "#09090b",
          color: "#f4f4f5",
        });
      }
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    if (activeTab === "Semua") return true;
    return booking.status === activeTab;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" /> Pending
          </span>
        );
      case "Menunggu Pembatalan":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <AlertCircle className="w-3.5 h-3.5" /> Menunggu Pembatalan
          </span>
        );
      case "Menunggu Reschedule":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Calendar className="w-3.5 h-3.5" /> Menunggu Reschedule
          </span>
        );
      case "Dikonfirmasi":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Dikonfirmasi
          </span>
        );
      case "Sedang Dikerjakan":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Wrench className="w-3.5 h-3.5 animate-spin" /> Sedang Dikerjakan
          </span>
        );
      case "Selesai":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
          </span>
        );
      case "Dibatalkan":
      case "Cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/20">
            <XCircle className="w-3.5 h-3.5" /> Dibatalkan
          </span>
        );
      default:
        return (
          <span className="px-3 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-zinc-800 text-zinc-300">
            {status}
          </span>
        );
    }
  };

  const statTotal = bookings.length;
  const statDikerjakan = bookings.filter(
    (b) => b.status === "Sedang Dikerjakan",
  ).length;
  const statSelesai = bookings.filter((b) => b.status === "Selesai").length;
  const statBatal = bookings.filter(
    (b) => b.status === "Dibatalkan" || b.status === "Cancelled",
  ).length;

  const stats = [
    {
      label: "Total Reservasi",
      value: statTotal,
      icon: FileText,
      accent: "text-blue-500",
      bg: "bg-blue-600/10 border-blue-600/20",
    },
    {
      label: "Sedang Dikerjakan",
      value: statDikerjakan,
      icon: Wrench,
      accent: "text-purple-500",
      bg: "bg-purple-600/10 border-purple-600/20",
    },
    {
      label: "Selesai",
      value: statSelesai,
      icon: CheckCircle2,
      accent: "text-emerald-500",
      bg: "bg-emerald-600/10 border-emerald-600/20",
    },
    {
      label: "Dibatalkan",
      value: statBatal,
      icon: XCircle,
      accent: "text-red-500",
      bg: "bg-red-600/10 border-red-600/20",
    },
  ];

  const navItems = [
    {
      id: "beranda",
      label: "Beranda",
      icon: LayoutDashboard,
      action: () => scrollToSection("beranda"),
    },
    {
      id: "pesanan",
      label: "Pesanan Saya",
      icon: CalendarDays,
      action: () => scrollToSection("pesanan"),
    },
  ];

  // ==========================================
  // PANEL KANAN: helper display-only (tidak mengubah logika booking)
  // ==========================================
  const ACTIVE_BOOKING_STATUSES = [
    "Pending",
    "Menunggu Pembatalan",
    "Menunggu Reschedule",
    "Dikonfirmasi",
    "Sedang Dikerjakan",
  ];

  const activeBookings = bookings
    .filter((b) => ACTIVE_BOOKING_STATUSES.includes(b.status))
    .sort((a, b) => b.id - a.id);
  const activeBooking = activeBookings[0] || null;

  const nextSchedule =
    bookings
      .filter((b) => ACTIVE_BOOKING_STATUSES.includes(b.status))
      .map((b) => ({
        booking: b,
        ts: new Date(`${b.booking_date}T${b.booking_time}`).getTime(),
      }))
      .sort((a, b) => a.ts - b.ts)[0]?.booking || null;

  const timelineSteps = [
    { key: "Pending", label: "Pesanan Dibuat", icon: FileText },
    { key: "Dikonfirmasi", label: "Dikonfirmasi", icon: CheckCircle2 },
    { key: "Sedang Dikerjakan", label: "Sedang Dikerjakan", icon: Wrench },
    { key: "Selesai", label: "Selesai", icon: CheckCircle2 },
  ];

  const getTimelineIndex = (status) => {
    if (
      status === "Pending" ||
      status === "Menunggu Pembatalan" ||
      status === "Menunggu Reschedule"
    )
      return 0;
    if (status === "Dikonfirmasi") return 1;
    if (status === "Sedang Dikerjakan") return 2;
    if (status === "Selesai" || status === "Cancelled") return 3;
    return -1;
  };

  const tips = [
    "Datang 15 menit sebelum jadwal agar servis langsung dikerjakan.",
    "Siapkan STNK dan buku servis kendaraan saat menyerahkan mobil.",
    "Konfirmasi ulang estimasi biaya di aplikasi sebelum mekanik bekerja.",
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500 font-bold">
        <div className="animate-pulse flex items-center gap-2">
          <Wrench className="w-5 h-5 text-red-600" /> Memuat data...
        </div>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen bg-zinc-950 text-white font-sans flex overflow-hidden selection:bg-red-600 selection:text-white">
      {/* Overlay Mobile */}
      <div
        className={`fixed inset-0 bg-black/80 z-40 lg:hidden transition-opacity duration-300 ${
          isMobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* =========================================================
          SIDEBAR KIRI (DESKTOP & MOBILE)
      ========================================================= */}
      <aside
        className={`fixed lg:static top-0 left-0 h-full w-72 bg-zinc-950/80 backdrop-blur-xl border-r border-zinc-900/80 z-50 flex flex-col transition-transform duration-300 ${
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Header / Logo Sidebar */}
        <div className="p-6 md:p-8 flex items-center justify-between border-b border-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/20">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-wider leading-none">
                BENGKEL<span className="text-red-600">KU</span>
              </h1>
              <p className="text-[10px] text-zinc-500 font-mono mt-1">
                USER DASHBOARD
              </p>
            </div>
          </div>
          <button
            className="lg:hidden text-zinc-500 hover:text-white"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Kartu Profil Mini */}
        <div className="px-6 py-5 mx-4 mt-4 bg-zinc-900/50 rounded-2xl border border-zinc-800/50 flex flex-col gap-1">
          <p className="text-xs text-zinc-500 font-medium">Pengguna:</p>
          <p className="text-sm font-bold text-white truncate">{user?.name}</p>
          <div className="w-full h-px bg-zinc-800/80 my-2"></div>
          <div className="flex items-center gap-2 text-xs text-red-500 font-bold">
            <Phone className="w-3.5 h-3.5" /> {user?.whatsapp}
          </div>
        </div>

        {/* Menu Navigasi Samping */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 custom-scrollbar">
          <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-4 mb-3">
            Menu Utama
          </div>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={item.action}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900/50 border border-transparent transition-all cursor-pointer"
            >
              <item.icon className="w-4 h-4 text-zinc-500" />
              {item.label}
            </button>
          ))}
          <Link
            href="/booking"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900/50 border border-transparent transition-all"
          >
            <PlusCircle className="w-4 h-4 text-zinc-500" />
            Buat Booking
          </Link>
        </nav>

        {/* Bottom Logout */}
        <div className="p-6 border-t border-zinc-900/50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-red-600 text-zinc-400 hover:text-white py-3 rounded-xl text-sm font-bold transition-all border border-zinc-800 hover:border-red-500 group cursor-pointer"
          >
            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />{" "}
            Keluar
          </button>
        </div>
      </aside>

      {/* =========================================================
          AREA KONTEN UTAMA (KANAN)
      ========================================================= */}
      <section className="flex-1 flex flex-col h-screen overflow-hidden bg-[url('/workshop-bg.png')] bg-cover bg-center bg-no-repeat relative">
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-0" />

        {/* Topbar: hamburger + profil kanan-atas */}
        <header className="relative z-20 flex items-center justify-between px-5 md:px-8 py-4 border-b border-zinc-900/80 bg-zinc-950/70 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden text-zinc-400 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="lg:hidden flex items-center gap-2 font-black tracking-wider text-sm">
              <Wrench className="w-4 h-4 text-red-600" /> BENGKELKU
            </div>
          </div>

          {/* Profil kanan-atas */}
          <div className="flex items-center gap-2">
            <button
              className="hidden sm:flex w-10 h-10 items-center justify-center rounded-2xl bg-zinc-900/70 hover:bg-zinc-800/70 border border-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer relative"
              title="Notifikasi"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            </button>

            <div ref={profileRef} className="relative">
              <button
                onClick={() => setProfileOpen((open) => !open)}
                className="flex items-center gap-3 bg-zinc-900/70 hover:bg-zinc-800/70 border border-zinc-800 hover:border-zinc-700 rounded-2xl pl-2 pr-3 py-1.5 transition-all cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-sm font-black text-white shadow-lg shadow-red-600/30">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-bold text-white leading-tight">
                    {user?.name}
                  </p>
                  <p className="text-[10px] text-zinc-500 font-mono leading-tight">
                    {user?.whatsapp}
                  </p>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ${
                    profileOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 mt-2 w-72 bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-50"
                  >
                    <div className="p-5 border-b border-zinc-900">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center text-lg font-black text-white shadow-lg shadow-red-600/30">
                          {user?.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div>
                          <p className="font-bold text-white">{user?.name}</p>
                          <p className="text-xs text-zinc-500">
                            {user?.whatsapp}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 w-fit">
                        <UserRound className="w-3.5 h-3.5 text-red-500" />{" "}
                        {user?.role || "user"}
                      </div>
                    </div>
                    <div className="p-3">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-600/10 transition-all cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" /> Keluar Akun
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Area konten scrollable */}
        <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-5xl mx-auto px-6 md:px-10 py-10 space-y-10">
            {/* HERO RINGKAS */}
            <motion.section
              id="beranda"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="scroll-mt-6 pt-4"
            >
              <motion.div
                variants={fadeUp}
                className="inline-flex items-center gap-2 font-mono text-red-500 text-xs tracking-widest uppercase mb-5"
              >
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                Servis Cerdas • Transparan • Anti Antre
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="text-4xl md:text-6xl font-black tracking-tighter leading-[1.05] mb-5"
              >
                Halo, <span className="text-red-500">{user?.name}</span>!{" "}
                <Sparkles className="w-7 h-7 text-red-500 inline -mt-1" />
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="text-zinc-400 max-w-2xl leading-relaxed mb-8"
              >
                Kelola reservasi servis kendaraanmu di satu tempat — pantau
                status, ubah jadwal, atau batalkan pesanan dengan mudah dan
                transparan.
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="flex flex-wrap items-center gap-3"
              >
                <Link
                  href="/booking"
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3.5 rounded-2xl text-sm font-bold transition shadow-lg shadow-red-600/20 flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" /> Buat Booking
                </Link>
                <button
                  onClick={() => scrollToSection("pesanan")}
                  className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white px-6 py-3.5 rounded-2xl text-sm font-bold transition border border-zinc-800 flex items-center gap-2 cursor-pointer"
                >
                  <CalendarDays className="w-4 h-4" /> Lihat Pesanan
                </button>
              </motion.div>
            </motion.section>

            {/* TRACKER MOBILE (lg:hidden) */}
            {activeBooking && (
              <section className="lg:hidden bg-zinc-950/85 backdrop-blur-md rounded-2xl border border-zinc-900 p-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">
                      Pesanan Aktif
                    </p>
                    <h3 className="text-sm font-black text-white truncate">
                      {activeBooking.service_type}
                    </h3>
                  </div>
                  <div className="shrink-0">
                    {getStatusBadge(activeBooking.status)}
                  </div>
                </div>

                <div className="relative mt-1">
                  <div className="absolute top-4 left-8 right-8 h-0.5 bg-zinc-800" />
                  <div className="relative flex justify-between">
                    {timelineSteps.map((step, i) => {
                      const currentIdx = getTimelineIndex(
                        activeBooking.status,
                      );
                      const isDone = i < currentIdx;
                      const isActive = i === currentIdx;
                      return (
                        <div
                          key={step.key}
                          className="flex flex-col items-center gap-1.5 w-16"
                        >
                          <motion.div
                            animate={isActive ? { scale: [1, 1.15, 1] } : {}}
                            transition={{
                              repeat: isActive ? Infinity : 0,
                              duration: 1.2,
                            }}
                            className={`relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                              isDone
                                ? "bg-emerald-600/20 border-emerald-500 text-emerald-400"
                                : isActive
                                  ? "bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/30"
                                  : "bg-zinc-900 border-zinc-800 text-zinc-600"
                            }`}
                          >
                            <step.icon className="w-4 h-4" />
                          </motion.div>
                          <span
                            className={`text-[8px] font-bold text-center leading-tight ${
                              isDone
                                ? "text-emerald-400"
                                : isActive
                                  ? "text-red-400"
                                  : "text-zinc-600"
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* STATISTIK */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat) => (
                <motion.div
                  key={stat.label}
                  whileHover={{ y: -4 }}
                  className="bg-zinc-950/80 backdrop-blur-md border border-zinc-900 rounded-2xl p-5 flex items-center gap-4 shadow-xl"
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${stat.bg}`}
                  >
                    <stat.icon className={`w-5 h-5 ${stat.accent}`} />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-0.5">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-black text-white">
                      {stat.value}
                    </p>
                  </div>
                </motion.div>
              ))}
            </section>

            {/* PESANAN */}
            <section id="pesanan" className="scroll-mt-6 space-y-6 pt-2">
              <div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                  Pesanan Saya
                </h2>
                <p className="text-zinc-500 text-sm mt-1">
                  Pantau dan kelola semua reservasi servis kendaraanmu.
                </p>
              </div>

              <div className="bg-zinc-950/85 backdrop-blur-md rounded-2xl border border-zinc-900 flex overflow-x-auto p-2 shadow-lg scrollbar-none">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`whitespace-nowrap px-6 py-3 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                      activeTab === tab
                        ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="space-y-5">
                {filteredBookings.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title={`Tidak Ada Pesanan (${activeTab})`}
                    description={`Kamu belum memiliki riwayat reservasi servis kendaraan dengan kategori status tersebut.`}
                    actionText="Buat Booking Sekarang"
                    onAction={() => (window.location.href = "/booking")}
                  />
                ) : (
                  filteredBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="bg-zinc-950/85 backdrop-blur-md rounded-3xl p-7 border border-zinc-900 hover:border-zinc-800 transition shadow-2xl relative overflow-hidden group"
                    >
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600" />

                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-900 pb-5 gap-3">
                        <div>
                          <span className="text-xs text-zinc-400 font-medium">
                            Kode Reservasi:
                          </span>
                          <span className="ml-2 text-sm font-black text-white font-mono tracking-wider bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-800">
                            {booking.booking_code}
                          </span>
                        </div>
                        <div>{getStatusBadge(booking.status)}</div>
                      </div>

                      <div className="flex flex-col md:flex-row justify-between gap-6 pt-5 items-start md:items-center">
                        <div className="space-y-2">
                          <h3 className="text-xl font-black text-white">
                            {booking.service_type}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-zinc-300">
                            <span className="flex items-center gap-1.5 font-semibold bg-zinc-900/80 px-3 py-1.5 rounded-xl border border-zinc-800">
                              <Car className="w-4 h-4 text-red-500" />{" "}
                              {booking.vehicle_name}
                            </span>
                            <span className="bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800 text-zinc-200 font-mono text-xs font-bold">
                              {booking.license_plate}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                          <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800/80 min-w-[220px]">
                            <p className="text-[11px] text-zinc-400 font-medium mb-1">
                              Jadwal Servis:
                            </p>
                            <p className="text-xs font-bold text-white flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-red-500" />{" "}
                              {new Date(
                                booking.booking_date,
                              ).toLocaleDateString("id-ID")}{" "}
                              • {booking.booking_time}
                            </p>
                          </div>

                          {(booking.status === "Pending" ||
                            booking.status === "Dikonfirmasi") && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  handleRescheduleBooking(booking.id)
                                }
                                className="bg-zinc-900 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:border-blue-500 px-4 py-3.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg"
                                title="Ubah Jadwal"
                              >
                                <Calendar className="w-4 h-4" /> Reschedule
                              </button>
                              <button
                                onClick={() => handleCancelBooking(booking.id)}
                                className="bg-zinc-900 hover:bg-red-600/20 text-red-500 border border-red-500/30 hover:border-red-500 px-4 py-3.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg"
                                title="Batalkan Pesanan"
                              >
                                <Ban className="w-4 h-4" /> Batalkan
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {booking.status === "Sedang Dikerjakan" && (
                        <div className="mt-5 pt-4 border-t border-zinc-900 flex items-center gap-2 text-purple-400 text-xs font-semibold animate-pulse">
                          <Wrench className="w-4 h-4 animate-spin" /> Mekanik
                          sedang menangani perbaikan kendaraanmu di bengkel.
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </section>

      {/* =========================================================
          PANEL KANAN (INFO PESANAN)
      ========================================================= */}
      <aside className="hidden lg:flex flex-col w-80 shrink-0 h-screen overflow-y-auto custom-scrollbar bg-zinc-950/85 backdrop-blur-xl border-l border-zinc-900/80">
        <div className="p-6 space-y-6">
          {/* Header Panel */}
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400">
              Info Pesanan
            </h2>
          </div>

          {/* Kartu Pesanan Aktif */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                Pesanan Aktif
              </p>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            {activeBooking ? (
              <>
                <div>
                  <h3 className="text-base font-black text-white leading-tight">
                    {activeBooking.service_type}
                  </h3>
                  <p className="text-[11px] text-zinc-500 font-mono mt-1">
                    {activeBooking.booking_code}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-300">
                  <Car className="w-4 h-4 text-red-500" />
                  <span className="font-semibold">
                    {activeBooking.vehicle_name}
                  </span>
                  <span className="text-zinc-500">•</span>
                  <span className="font-mono">
                    {activeBooking.license_plate}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2">
                  <CalendarClock className="w-4 h-4 text-red-500" />
                  <span className="text-zinc-300">
                    {new Date(activeBooking.booking_date).toLocaleDateString(
                      "id-ID",
                    )}{" "}
                    • {activeBooking.booking_time}
                  </span>
                </div>
                <div>{getStatusBadge(activeBooking.status)}</div>
              </>
            ) : (
              <div className="text-xs text-zinc-500 leading-relaxed">
                Belum ada pesanan aktif. Yuk buat booking sekarang!
              </div>
            )}
          </div>

          {/* Timeline Status */}
          {activeBooking && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-5">
                Status Servis
              </p>
              <div className="space-y-0">
                {timelineSteps.map((step, i) => {
                  const currentIdx = getTimelineIndex(activeBooking.status);
                  const isDone = i < currentIdx;
                  const isActive = i === currentIdx;
                  return (
                    <div key={step.key} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <motion.div
                          animate={isActive ? { scale: [1, 1.15, 1] } : {}}
                          transition={{
                            repeat: isActive ? Infinity : 0,
                            duration: 1.2,
                          }}
                          className={`w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            isDone
                              ? "bg-emerald-600/20 border-emerald-500 text-emerald-400"
                              : isActive
                                ? "bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/30"
                                : "bg-zinc-900 border-zinc-800 text-zinc-600"
                          }`}
                        >
                          <step.icon className="w-4 h-4" />
                        </motion.div>
                        {i < timelineSteps.length - 1 && (
                          <div
                            className={`w-0.5 flex-1 min-h-[26px] ${
                              i < currentIdx
                                ? "bg-emerald-500/70"
                                : "bg-zinc-800"
                            }`}
                          />
                        )}
                      </div>
                      <div className="pb-6 pt-2">
                        <p
                          className={`text-sm font-bold ${
                            isDone
                              ? "text-emerald-400"
                              : isActive
                                ? "text-red-400"
                                : "text-zinc-500"
                          }`}
                        >
                          {step.label}
                        </p>
                        {isActive && (
                          <p className="text-[10px] text-zinc-500 mt-0.5">
                            Sedang berlangsung...
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Jadwal Berikutnya */}
          {nextSchedule && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-3">
                Jadwal Berikutnya
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center shrink-0">
                  <CalendarClock className="w-5 h-5 text-red-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">
                    {nextSchedule.service_type}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {new Date(nextSchedule.booking_date).toLocaleDateString(
                      "id-ID",
                    )}{" "}
                    • {nextSchedule.booking_time}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tips Servis */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                Tips Servis
              </p>
            </div>
            <ul className="space-y-2.5">
              {tips.map((tip, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-zinc-400 leading-relaxed"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 mt-1.5 shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>
    </main>
  );
}