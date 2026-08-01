"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import { fetchWithAuth } from "@/utils/api";
import {
  LogOut,
  Store,
  PlusCircle,
  Trash2,
  Users,
  Car,
  UserCog,
  Edit,
  ClipboardList,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  ShieldAlert,
  ClipboardCheck,
  Search,
  LayoutDashboard,
  Menu,
  X,
  TrendingUp,
  Activity,
} from "lucide-react";

export default function SuperadminDashboard() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("verifikasi");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // State Data
  const [bengkels, setBengkels] = useState([]);
  const [newBengkel, setNewBengkel] = useState({
    name: "",
    address: "",
    phone: "",
  });
  const [bookings, setBookings] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState([]);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    whatsapp: "",
    password: "",
  });
  const [vehicles, setVehicles] = useState([]);
  const [mitraRequests, setMitraRequests] = useState([]);
  const [adminBengkels, setAdminBengkels] = useState([]);
  const [formAdmin, setFormAdmin] = useState({
    id: null,
    name: "",
    whatsapp: "",
    password: "",
    bengkel_id: "",
  });
  const [isEditingAdmin, setIsEditingAdmin] = useState(false);

  // Filter Bookings
  const filteredBookings = bookings.filter((bk) => {
    const query = searchQuery.toLowerCase();
    return (
      bk.customer_name?.toLowerCase().includes(query) ||
      bk.bengkel_name?.toLowerCase().includes(query) ||
      bk.status?.toLowerCase().includes(query) ||
      bk.whatsapp?.includes(query)
    );
  });

  useEffect(() => {
    const session = localStorage.getItem("user_session");
    if (!session) {
      window.location.href = "/login";
      return;
    }
    const parsedUser = JSON.parse(session);
    if (parsedUser.role !== "superadmin") {
      window.location.href = "/login";
      return;
    }

    setUser(parsedUser);
    fetchBengkels();
    fetchCustomers();
    fetchVehicles();
    fetchAdminBengkels();
    fetchBookings();
    fetchMitraRequests();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("user_session");
    localStorage.removeItem("auth_token");
    document.cookie =
      "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    window.location.href = "/login";
  };

  // ==========================================
  // FUNGSI CRUD (TETAP SAMA 100%)
  // ==========================================
  const fetchBengkels = async () => {
    const data = await fetchWithAuth(`/api/bengkels`);
    if (data?.success) setBengkels(data.data || []);
  };

  const handleAddBengkel = async (e) => {
    e.preventDefault();
    const data = await fetchWithAuth(`/api/bengkels`, {
      method: "POST",
      body: JSON.stringify(newBengkel),
    });
    if (data.success) {
      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: data.message,
        background: "#09090b",
        color: "#f4f4f5",
        confirmButtonColor: "#dc2626",
      });
      setNewBengkel({ name: "", address: "", phone: "" });
      fetchBengkels();
    }
  };

  const handleDeleteBengkel = async (id) => {
    const confirm = await Swal.fire({
      title: "Hapus Bengkel?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      background: "#09090b",
      color: "#f4f4f5",
    });
    if (confirm.isConfirmed) {
      const data = await fetchWithAuth(`/api/bengkels/${id}`, {
        method: "DELETE",
      });
      if (data?.success) fetchBengkels();
    }
  };

  const handleViewSchedule = async (bengkelId, bengkelName) => {
    try {
      const data = await fetchWithAuth(`/api/schedules/${bengkelId}`);
      let htmlContent = '<div style="text-align: left; margin-top: 10px;">';
      if (!data.success || data.data.length === 0) {
        htmlContent +=
          '<p style="text-align: center; color: #71717a; font-size: 14px;">Admin bengkel ini belum mengatur jadwal operasional.</p>';
      } else {
        htmlContent +=
          '<table style="width: 100%; border-collapse: collapse; font-size: 14px;">';
        data.data.forEach((item) => {
          const statusText = item.is_closed
            ? '<span style="color: #ef4444; font-weight: bold; padding: 2px 6px; background: rgba(239, 68, 68, 0.1); border-radius: 4px;">LIBUR</span>'
            : `<span style="color: #a1a1aa; font-family: monospace;">${item.open_time.substring(0, 5)} - ${item.close_time.substring(0, 5)}</span>`;
          htmlContent += `<tr style="border-bottom: 1px solid #27272a;"><td style="padding: 10px 0; font-weight: bold; color: #fff;">${item.day_name}</td><td style="padding: 10px 0; text-align: right;">${statusText}</td></tr>`;
        });
        htmlContent += "</table>";
      }
      htmlContent += "</div>";
      Swal.fire({
        title: `🕒 Jadwal ${bengkelName}`,
        html: htmlContent,
        background: "#18181b",
        color: "#f4f4f5",
        confirmButtonColor: "#dc2626",
        confirmButtonText: "Tutup",
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: "Terjadi kesalahan jaringan.",
        background: "#09090b",
        color: "#f4f4f5",
        confirmButtonColor: "#dc2626",
      });
    }
  };

  const fetchCustomers = async () => {
    const data = await fetchWithAuth(`/api/users`);
    if (data?.success) setCustomers(data.data || []);
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    const data = await fetchWithAuth(`/api/users`, {
      method: "POST",
      body: JSON.stringify(newCustomer),
    });
    if (data.success) {
      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: data.message,
        background: "#09090b",
        color: "#f4f4f5",
        confirmButtonColor: "#dc2626",
      });
      setNewCustomer({ name: "", whatsapp: "", password: "" });
      fetchCustomers();
    }
  };

  const handleDeleteCustomer = async (id) => {
    const confirm = await Swal.fire({
      title: "Hapus Pelanggan?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      background: "#09090b",
      color: "#f4f4f5",
    });
    if (confirm.isConfirmed) {
      const data = await fetchWithAuth(`/api/users/${id}`, {
        method: "DELETE",
      });
      if (data?.success) fetchCustomers();
    }
  };

  const fetchVehicles = async () => {
    const data = await fetchWithAuth(`/api/vehicles`);
    if (data?.success) setVehicles(data.data || []);
  };

  const handleDeleteVehicle = async (id) => {
    const confirm = await Swal.fire({
      title: "Hapus Kendaraan?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      background: "#09090b",
      color: "#f4f4f5",
    });
    if (confirm.isConfirmed) {
      const data = await fetchWithAuth(`/api/vehicles/${id}`, {
        method: "DELETE",
      });
      if (data?.success) fetchVehicles();
    }
  };

  const fetchAdminBengkels = async () => {
    const data = await fetchWithAuth(`/api/admin-bengkel`);
    if (data?.success) setAdminBengkels(data.data || []);
  };

  const handleSubmitAdmin = async (e) => {
    e.preventDefault();
    const url = isEditingAdmin
      ? `/api/admin-bengkel/${formAdmin.id}`
      : `/api/admin-bengkel`;
    const method = isEditingAdmin ? "PUT" : "POST";
    const data = await fetchWithAuth(url, {
      method,
      body: JSON.stringify(formAdmin),
    });
    if (data.success) {
      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: data.message,
        background: "#09090b",
        color: "#f4f4f5",
        confirmButtonColor: "#dc2626",
      });
      handleCancelEditAdmin();
      fetchAdminBengkels();
    } else {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: data.message,
        background: "#09090b",
        color: "#f4f4f5",
        confirmButtonColor: "#dc2626",
      });
    }
  };

  const handleEditAdmin = (admin) => {
    setFormAdmin({
      id: admin.id,
      name: admin.name,
      whatsapp: admin.whatsapp,
      password: "",
      bengkel_id: admin.bengkel_id,
    });
    setIsEditingAdmin(true);
  };

  const handleCancelEditAdmin = () => {
    setFormAdmin({
      id: null,
      name: "",
      whatsapp: "",
      password: "",
      bengkel_id: "",
    });
    setIsEditingAdmin(false);
  };

  const handleDeleteAdmin = async (id) => {
    const confirm = await Swal.fire({
      title: "Hapus Akun?",
      text: "Admin bengkel ini tidak akan bisa login lagi.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      background: "#09090b",
      color: "#f4f4f5",
    });
    if (confirm.isConfirmed) {
      const data = await fetchWithAuth(`/api/admin-bengkel/${id}`, {
        method: "DELETE",
      });
      if (data?.success) fetchAdminBengkels();
    }
  };

  const fetchBookings = async () => {
    const data = await fetchWithAuth(`/api/superadmin-bookings`);
    if (data?.success) setBookings(data.data || []);
  };

  const handleUpdateStatusBooking = async (id, newStatus) => {
    const data = await fetchWithAuth(`/api/superadmin-bookings/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status: newStatus }),
    });
    if (data?.success) fetchBookings();
  };

  const handleDeleteBooking = async (id) => {
    const confirm = await Swal.fire({
      title: "Hapus Pesanan?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      background: "#09090b",
      color: "#f4f4f5",
    });
    if (confirm.isConfirmed) {
      const data = await fetchWithAuth(`/api/superadmin-bookings/${id}`, {
        method: "DELETE",
      });
      if (data?.success) fetchBookings();
    }
  };

  const fetchMitraRequests = async () => {
    try {
      const data = await fetchWithAuth(`/api/register-mitra/requests`);
      if (data?.success) setMitraRequests(data.data || []);
    } catch (error) {
      console.error("Gagal memuat request mitra", error);
    }
  };

  const handleApproveMitra = async (id, bengkelName) => {
    const confirm = await Swal.fire({
      title: "Setujui Mitra?",
      text: `Anda akan mendaftarkan ${bengkelName} ke sistem utama.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Setujui",
      confirmButtonColor: "#10b981",
      background: "#09090b",
      color: "#f4f4f5",
    });
    if (confirm.isConfirmed) {
      Swal.fire({
        title: "Memproses...",
        background: "#09090b",
        color: "#f4f4f5",
        didOpen: () => Swal.showLoading(),
      });
      const data = await fetchWithAuth(`/api/register-mitra/approve/${id}`, {
        method: "POST",
      });
      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: data.message,
          background: "#09090b",
          color: "#f4f4f5",
          confirmButtonColor: "#dc2626",
        });
        fetchMitraRequests();
        fetchBengkels();
        fetchAdminBengkels();
      } else {
        Swal.fire({
          icon: "error",
          title: "Gagal",
          text: data.message,
          background: "#09090b",
          color: "#f4f4f5",
          confirmButtonColor: "#dc2626",
        });
      }
    }
  };

  const handleRejectMitra = async (id) => {
    const confirm = await Swal.fire({
      title: "Tolak Pengajuan?",
      text: "Data pengajuan ini akan ditolak.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Tolak",
      confirmButtonColor: "#dc2626",
      background: "#09090b",
      color: "#f4f4f5",
    });
    if (confirm.isConfirmed) {
      const data = await fetchWithAuth(`/api/register-mitra/reject/${id}`, {
        method: "POST",
      });
      if (data.success) fetchMitraRequests();
    }
  };

  // Konfigurasi Navigasi Sidebar
  const navItems = [
    {
      id: "verifikasi",
      label: "Verifikasi Mitra",
      icon: ClipboardCheck,
      badge: mitraRequests.length,
    },
    { id: "bengkel", label: "Manajemen Bengkel", icon: Store },
    { id: "admin_bengkel", label: "Admin Bengkel", icon: UserCog },
    { id: "pelanggan", label: "Data Pelanggan", icon: Users },
    { id: "kendaraan", label: "Data Kendaraan", icon: Car },
    { id: "booking", label: "Semua Transaksi", icon: ClipboardList },
  ];

  if (!user)
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500 font-bold">
        <div className="animate-pulse flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-red-600" /> Memuat Ruang
          Kendali...
        </div>
      </div>
    );

  return (
    <main className="min-h-screen bg-black text-white font-sans flex overflow-hidden selection:bg-red-600">
      {/* =========================================================
          SIDEBAR KIRI (DESKTOP & MOBILE)
      ========================================================= */}
      {/* Overlay Mobile */}
      <div
        className={`fixed inset-0 bg-black/80 z-40 lg:hidden transition-opacity duration-300 ${isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      <aside
        className={`fixed lg:static top-0 left-0 h-full w-72 bg-zinc-950/80 backdrop-blur-xl border-r border-zinc-900/80 z-50 flex flex-col transition-transform duration-300 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Header / Logo Sidebar */}
        <div className="p-6 md:p-8 flex items-center justify-between border-b border-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/20">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-wider leading-none">
                SUPER<span className="text-red-600">ADMIN</span>
              </h1>
              <p className="text-[10px] text-zinc-500 font-mono mt-1">
                APEX GARAGE SYSTEM
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

        {/* User Info (Mini Profile) */}
        <div className="px-6 py-5 mx-4 mt-4 bg-zinc-900/50 rounded-2xl border border-zinc-800/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
            <UserCog className="w-5 h-5 text-zinc-400" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-white truncate">
              {user.name || "Administrator Utama"}
            </p>
            <p className="text-xs text-red-500 font-medium capitalize">
              {user.role}
            </p>
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
              onClick={() => {
                setActiveTab(item.id);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === item.id
                  ? "bg-red-600/10 text-red-500 border border-red-600/20 shadow-inner"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/50 border border-transparent"
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon
                  className={`w-4 h-4 ${activeTab === item.id ? "text-red-500" : "text-zinc-500"}`}
                />
                {item.label}
              </div>
              {item.badge > 0 && (
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full ${activeTab === item.id ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-300"}`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom Logout */}
        <div className="p-6 border-t border-zinc-900/50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-red-600 text-zinc-400 hover:text-white py-3 rounded-xl text-sm font-bold transition-all border border-zinc-800 hover:border-red-500 group"
          >
            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />{" "}
            Keluar Sistem
          </button>
        </div>
      </aside>

      {/* =========================================================
          AREA KONTEN UTAMA (KANAN)
      ========================================================= */}
      <section className="flex-1 flex flex-col h-screen overflow-hidden bg-[url('/workshop-bg.png')] bg-cover bg-center bg-no-repeat relative">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-0" />{" "}
        {/* Overlay background */}
        {/* Header Mobile / Topbar */}
        <header className="relative z-10 lg:hidden flex items-center justify-between p-6 border-b border-zinc-900/80 bg-zinc-950/80 backdrop-blur-md">
          <div className="flex items-center gap-2 font-black tracking-wider text-sm">
            <ShieldAlert className="w-4 h-4 text-red-600" /> SUPERADMIN
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="text-zinc-400 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>
        <div className="relative z-10 flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          {/* STATS WIDGETS (MIMIC REFERENCE IMAGE) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-zinc-950 border border-zinc-900/80 p-5 rounded-2xl shadow-xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-600/10 flex items-center justify-center border border-blue-600/20">
                <Store className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-0.5">
                  Total Bengkel
                </p>
                <p className="text-2xl font-black text-white">
                  {bengkels.length}
                </p>
              </div>
            </div>
            <div className="bg-zinc-950 border border-zinc-900/80 p-5 rounded-2xl shadow-xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-600/10 flex items-center justify-center border border-emerald-600/20">
                <Users className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-0.5">
                  Pelanggan Aktif
                </p>
                <p className="text-2xl font-black text-white">
                  {customers.length}
                </p>
              </div>
            </div>
            <div className="bg-zinc-950 border border-zinc-900/80 p-5 rounded-2xl shadow-xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-600/10 flex items-center justify-center border border-purple-600/20">
                <ClipboardList className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-0.5">
                  Total Transaksi
                </p>
                <p className="text-2xl font-black text-white">
                  {bookings.length}
                </p>
              </div>
            </div>
            <div className="bg-zinc-950 border border-zinc-900/80 p-5 rounded-2xl shadow-xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-600/10 flex items-center justify-center border border-red-600/20">
                <Activity className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-0.5">
                  Permintaan Mitra
                </p>
                <p className="text-2xl font-black text-white">
                  {mitraRequests.length}
                </p>
              </div>
            </div>
          </div>

          {/* DYNAMIC CONTENT AREA DENGAN ANIMASI */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              {/* ========================================================
                  KONTEN TAB: VERIFIKASI MITRA
              ======================================================== */}
              {activeTab === "verifikasi" && (
                <div className="bg-zinc-950/80 backdrop-blur-md p-6 rounded-3xl border border-zinc-900/80 shadow-2xl space-y-6">
                  <div>
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      <Clock className="w-5 h-5 text-red-500" /> Pengajuan
                      Kemitraan Menunggu
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      Calon mitra yang mendaftar melalui halaman publik. Setujui
                      untuk membuatkan mereka akun otomatis.
                    </p>
                  </div>
                  <div className="overflow-x-auto rounded-2xl border border-zinc-800/50">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800 uppercase tracking-wider">
                          <th className="p-4 font-bold">Tgl Pengajuan</th>
                          <th className="p-4 font-bold">Data Pemilik</th>
                          <th className="p-4 font-bold">Data Bengkel</th>
                          <th className="p-4 text-center font-bold">
                            Aksi Verifikasi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900/50">
                        {mitraRequests.length === 0 ? (
                          <tr>
                            <td
                              colSpan="4"
                              className="p-10 text-center text-zinc-500 font-medium"
                            >
                              Tidak ada pengajuan kemitraan baru saat ini.
                            </td>
                          </tr>
                        ) : (
                          mitraRequests.map((req) => (
                            <tr
                              key={req.id}
                              className="hover:bg-zinc-900/40 transition"
                            >
                              <td className="p-4 text-zinc-400 align-top">
                                {new Date(req.created_at).toLocaleDateString(
                                  "id-ID",
                                )}{" "}
                                <br />
                                <span className="text-[10px] font-mono">
                                  {new Date(req.created_at).toLocaleTimeString(
                                    "id-ID",
                                    { hour: "2-digit", minute: "2-digit" },
                                  )}
                                </span>
                              </td>
                              <td className="p-4 align-top">
                                <span className="font-bold text-white text-sm">
                                  {req.owner_name}
                                </span>
                                <br />
                                <span className="font-mono text-zinc-500 text-xs">
                                  WA: {req.whatsapp}
                                </span>
                              </td>
                              <td className="p-4 align-top">
                                <span className="font-bold text-red-500">
                                  {req.bengkel_name}
                                </span>
                                <br />
                                <span className="text-xs text-zinc-400 block max-w-xs">
                                  {req.address} <br /> Telp: {req.phone}
                                </span>
                              </td>
                              <td className="p-4 text-center align-top">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() =>
                                      handleApproveMitra(
                                        req.id,
                                        req.bengkel_name,
                                      )
                                    }
                                    className="bg-emerald-600/10 hover:bg-emerald-600 text-emerald-500 hover:text-white border border-emerald-500/30 px-4 py-2 rounded-xl font-bold transition text-xs flex items-center gap-1.5"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" />{" "}
                                    Setujui
                                  </button>
                                  <button
                                    onClick={() => handleRejectMitra(req.id)}
                                    className="bg-zinc-900 hover:bg-red-600 text-zinc-400 hover:text-white border border-zinc-800 px-4 py-2 rounded-xl font-bold transition text-xs flex items-center gap-1.5"
                                  >
                                    <XCircle className="w-3.5 h-3.5" /> Tolak
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ========================================================
                  KONTEN TAB: BENGKEL
              ======================================================== */}
              {activeTab === "bengkel" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-zinc-950/80 backdrop-blur-md p-6 rounded-3xl border border-zinc-900/80 shadow-2xl h-fit">
                    <h2 className="text-base font-black text-white flex items-center gap-2 mb-5">
                      <PlusCircle className="w-5 h-5 text-red-500" /> Tambah
                      Bengkel
                    </h2>
                    <form
                      onSubmit={handleAddBengkel}
                      className="space-y-4 text-xs"
                    >
                      <input
                        type="text"
                        required
                        value={newBengkel.name}
                        onChange={(e) =>
                          setNewBengkel({ ...newBengkel, name: e.target.value })
                        }
                        className="w-full bg-zinc-900/50 border border-zinc-800 p-3.5 rounded-xl text-sm text-white outline-none focus:border-red-600 focus:bg-zinc-900 transition-all"
                        placeholder="Nama Bengkel"
                      />
                      <input
                        type="text"
                        required
                        value={newBengkel.phone}
                        onChange={(e) =>
                          setNewBengkel({
                            ...newBengkel,
                            phone: e.target.value,
                          })
                        }
                        className="w-full bg-zinc-900/50 border border-zinc-800 p-3.5 rounded-xl text-sm text-white outline-none focus:border-red-600 focus:bg-zinc-900 transition-all"
                        placeholder="No. Telp / WA"
                      />
                      <textarea
                        required
                        rows="3"
                        value={newBengkel.address}
                        onChange={(e) =>
                          setNewBengkel({
                            ...newBengkel,
                            address: e.target.value,
                          })
                        }
                        className="w-full bg-zinc-900/50 border border-zinc-800 p-3.5 rounded-xl text-sm text-white outline-none focus:border-red-600 focus:bg-zinc-900 transition-all"
                        placeholder="Alamat Lengkap"
                      ></textarea>
                      <button
                        type="submit"
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition text-sm shadow-lg shadow-red-900/20 active:scale-[0.98]"
                      >
                        Simpan Data
                      </button>
                    </form>
                  </div>
                  <div className="lg:col-span-2 bg-zinc-950/80 backdrop-blur-md p-6 rounded-3xl border border-zinc-900/80 shadow-2xl">
                    <h2 className="text-base font-black text-white mb-5">
                      Daftar Jaringan Bengkel
                    </h2>
                    <div className="overflow-x-auto rounded-2xl border border-zinc-800/50">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800 uppercase">
                            <th className="p-4 font-bold">Bengkel</th>
                            <th className="p-4 font-bold">Kontak</th>
                            <th className="p-4 font-bold">Alamat</th>
                            <th className="p-4 text-center font-bold">
                              Jadwal
                            </th>
                            <th className="p-4 text-center font-bold">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900/50">
                          {bengkels.map((b) => (
                            <tr
                              key={b.id}
                              className="hover:bg-zinc-900/40 transition"
                            >
                              <td className="p-4 font-bold text-zinc-200">
                                {b.name}
                              </td>
                              <td className="p-4 text-zinc-400 font-mono text-[11px]">
                                {b.phone}
                              </td>
                              <td
                                className="p-4 text-zinc-400 max-w-[150px] truncate"
                                title={b.address}
                              >
                                {b.address}
                              </td>
                              <td className="p-4 text-center">
                                <button
                                  onClick={() =>
                                    handleViewSchedule(b.id, b.name)
                                  }
                                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-xl transition text-[10px] font-bold mx-auto flex items-center gap-1.5"
                                >
                                  <Eye className="w-3.5 h-3.5" /> Lihat
                                </button>
                              </td>
                              <td className="p-4 text-center">
                                <button
                                  onClick={() => handleDeleteBengkel(b.id)}
                                  className="text-zinc-500 hover:text-white bg-zinc-900 hover:bg-red-600 p-2.5 rounded-lg transition mx-auto shadow-sm"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================
                  KONTEN TAB: ADMIN BENGKEL
              ======================================================== */}
              {activeTab === "admin_bengkel" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-zinc-950/80 backdrop-blur-md p-6 rounded-3xl border border-zinc-900/80 shadow-2xl h-fit">
                    <h2 className="text-base font-black text-white flex items-center gap-2 mb-5">
                      <UserCog className="w-5 h-5 text-red-500" />{" "}
                      {isEditingAdmin ? "Edit Akses Admin" : "Buat Akun Admin"}
                    </h2>
                    <form
                      onSubmit={handleSubmitAdmin}
                      className="space-y-4 text-xs"
                    >
                      <input
                        type="text"
                        required
                        value={formAdmin.name}
                        onChange={(e) =>
                          setFormAdmin({ ...formAdmin, name: e.target.value })
                        }
                        className="w-full bg-zinc-900/50 border border-zinc-800 p-3.5 rounded-xl text-sm text-white outline-none focus:border-red-600 focus:bg-zinc-900 transition-all"
                        placeholder="Nama Lengkap Admin"
                      />
                      <input
                        type="text"
                        required
                        value={formAdmin.whatsapp}
                        onChange={(e) =>
                          setFormAdmin({
                            ...formAdmin,
                            whatsapp: e.target.value,
                          })
                        }
                        className="w-full bg-zinc-900/50 border border-zinc-800 p-3.5 rounded-xl text-sm text-white outline-none focus:border-red-600 focus:bg-zinc-900 transition-all"
                        placeholder="No. WhatsApp (ID Login)"
                      />
                      <input
                        type={isEditingAdmin ? "text" : "password"}
                        required={!isEditingAdmin}
                        value={formAdmin.password}
                        onChange={(e) =>
                          setFormAdmin({
                            ...formAdmin,
                            password: e.target.value,
                          })
                        }
                        className="w-full bg-zinc-900/50 border border-zinc-800 p-3.5 rounded-xl text-sm text-white outline-none focus:border-red-600 focus:bg-zinc-900 transition-all"
                        placeholder={
                          isEditingAdmin
                            ? "Password Baru (Opsional)"
                            : "Buat Password Login"
                        }
                      />
                      <select
                        required
                        value={formAdmin.bengkel_id}
                        onChange={(e) =>
                          setFormAdmin({
                            ...formAdmin,
                            bengkel_id: e.target.value,
                          })
                        }
                        className="w-full bg-zinc-900/50 border border-zinc-800 p-3.5 rounded-xl text-sm text-white outline-none focus:border-red-600 focus:bg-zinc-900 transition-all appearance-none cursor-pointer"
                      >
                        <option value="" disabled>
                          -- Tugaskan Ke Bengkel --
                        </option>
                        {bengkels.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-3 pt-2">
                        <button
                          type="submit"
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition text-sm shadow-lg active:scale-[0.98]"
                        >
                          {isEditingAdmin ? "Update" : "Buat Akun"}
                        </button>
                        {isEditingAdmin && (
                          <button
                            type="button"
                            onClick={handleCancelEditAdmin}
                            className="w-24 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 rounded-xl transition text-sm"
                          >
                            Batal
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                  <div className="lg:col-span-2 bg-zinc-950/80 backdrop-blur-md p-6 rounded-3xl border border-zinc-900/80 shadow-2xl">
                    <h2 className="text-base font-black text-white mb-5">
                      Daftar Admin Pengelola Bengkel
                    </h2>
                    <div className="overflow-x-auto rounded-2xl border border-zinc-800/50">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800 uppercase">
                            <th className="p-4 font-bold">Profil Admin</th>
                            <th className="p-4 font-bold">
                              Ditugaskan di Bengkel
                            </th>
                            <th className="p-4 text-center font-bold">Opsi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900/50">
                          {adminBengkels.length === 0 ? (
                            <tr>
                              <td
                                colSpan="3"
                                className="p-10 text-center text-zinc-500 font-medium"
                              >
                                Belum ada akun Admin Bengkel.
                              </td>
                            </tr>
                          ) : (
                            adminBengkels.map((admin) => (
                              <tr
                                key={admin.id}
                                className="hover:bg-zinc-900/40 transition"
                              >
                                <td className="p-4">
                                  <span className="font-bold text-white text-sm">
                                    {admin.name}
                                  </span>{" "}
                                  <br />
                                  <span className="text-zinc-500 font-mono text-[11px]">
                                    {admin.whatsapp}
                                  </span>
                                </td>
                                <td className="p-4 text-zinc-300">
                                  <span className="bg-red-600/10 text-red-500 border border-red-600/20 px-3 py-1.5 rounded-lg font-bold text-xs">
                                    {admin.bengkel_name || "Tidak Diketahui"}
                                  </span>
                                </td>
                                <td className="p-4 text-center">
                                  <div className="flex justify-center gap-2">
                                    <button
                                      onClick={() => handleEditAdmin(admin)}
                                      className="text-zinc-400 hover:text-white bg-zinc-800 hover:bg-blue-600 p-2.5 rounded-lg transition shadow-sm"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeleteAdmin(admin.id)
                                      }
                                      className="text-zinc-400 hover:text-white bg-zinc-800 hover:bg-red-600 p-2.5 rounded-lg transition shadow-sm"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================
                  KONTEN TAB: PELANGGAN
              ======================================================== */}
              {activeTab === "pelanggan" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-zinc-950/80 backdrop-blur-md p-6 rounded-3xl border border-zinc-900/80 shadow-2xl h-fit">
                    <h2 className="text-base font-black text-white flex items-center gap-2 mb-5">
                      <PlusCircle className="w-5 h-5 text-red-500" /> Tambah
                      Pelanggan
                    </h2>
                    <form
                      onSubmit={handleAddCustomer}
                      className="space-y-4 text-xs"
                    >
                      <input
                        type="text"
                        required
                        value={newCustomer.name}
                        onChange={(e) =>
                          setNewCustomer({
                            ...newCustomer,
                            name: e.target.value,
                          })
                        }
                        className="w-full bg-zinc-900/50 border border-zinc-800 p-3.5 rounded-xl text-sm text-white outline-none focus:border-red-600 focus:bg-zinc-900 transition-all"
                        placeholder="Nama Lengkap"
                      />
                      <input
                        type="text"
                        required
                        value={newCustomer.whatsapp}
                        onChange={(e) =>
                          setNewCustomer({
                            ...newCustomer,
                            whatsapp: e.target.value,
                          })
                        }
                        className="w-full bg-zinc-900/50 border border-zinc-800 p-3.5 rounded-xl text-sm text-white outline-none focus:border-red-600 focus:bg-zinc-900 transition-all"
                        placeholder="No. WhatsApp"
                      />
                      <input
                        type="password"
                        required
                        value={newCustomer.password}
                        onChange={(e) =>
                          setNewCustomer({
                            ...newCustomer,
                            password: e.target.value,
                          })
                        }
                        className="w-full bg-zinc-900/50 border border-zinc-800 p-3.5 rounded-xl text-sm text-white outline-none focus:border-red-600 focus:bg-zinc-900 transition-all"
                        placeholder="Password Aplikasi"
                      />
                      <button
                        type="submit"
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition text-sm shadow-lg active:scale-[0.98] mt-2"
                      >
                        Daftarkan Pelanggan
                      </button>
                    </form>
                  </div>
                  <div className="lg:col-span-2 bg-zinc-950/80 backdrop-blur-md p-6 rounded-3xl border border-zinc-900/80 shadow-2xl">
                    <h2 className="text-base font-black text-white mb-5">
                      Database Pelanggan Aplikasi
                    </h2>
                    <div className="overflow-x-auto rounded-2xl border border-zinc-800/50">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800 uppercase">
                            <th className="p-4 font-bold">
                              Identitas Pelanggan
                            </th>
                            <th className="p-4 font-bold">Terdaftar Sejak</th>
                            <th className="p-4 text-center font-bold">Hapus</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900/50">
                          {customers.map((c) => (
                            <tr
                              key={c.id}
                              className="hover:bg-zinc-900/40 transition"
                            >
                              <td className="p-4 font-bold text-zinc-200">
                                {c.name}
                              </td>
                              <td className="p-4 text-zinc-400">
                                {new Date(c.created_at).toLocaleDateString(
                                  "id-ID",
                                )}
                              </td>
                              <td className="p-4 text-center">
                                <button
                                  onClick={() => handleDeleteCustomer(c.id)}
                                  className="text-zinc-500 hover:text-white bg-zinc-900 hover:bg-red-600 p-2 rounded-lg transition shadow-sm mx-auto"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================
                  KONTEN TAB: KENDARAAN
              ======================================================== */}
              {activeTab === "kendaraan" && (
                <div className="bg-zinc-950/80 backdrop-blur-md p-6 rounded-3xl border border-zinc-900/80 shadow-2xl">
                  <h2 className="text-lg font-black text-white flex items-center gap-2 mb-6">
                    <Car className="w-5 h-5 text-red-500" /> Database Kendaraan
                    Pelanggan
                  </h2>
                  <div className="overflow-x-auto rounded-2xl border border-zinc-800/50">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800 uppercase tracking-wider">
                          <th className="p-4 font-bold">Pemilik / Pelanggan</th>
                          <th className="p-4 font-bold">Tipe Kendaraan</th>
                          <th className="p-4 font-bold">Plat Nomor</th>
                          <th className="p-4 text-center font-bold">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900/50">
                        {vehicles.length === 0 ? (
                          <tr>
                            <td
                              colSpan="4"
                              className="p-10 text-center text-zinc-500 font-medium"
                            >
                              Belum ada data kendaraan terdaftar.
                            </td>
                          </tr>
                        ) : (
                          vehicles.map((v) => (
                            <tr
                              key={v.id}
                              className="hover:bg-zinc-900/40 transition"
                            >
                              <td className="p-4">
                                <span className="font-bold text-white text-sm">
                                  {v.customer_name}
                                </span>{" "}
                                <br />
                                <span className="font-mono text-xs text-zinc-500">
                                  {v.whatsapp}
                                </span>
                              </td>
                              <td className="p-4 text-zinc-300 font-medium text-sm">
                                {v.vehicle_name}
                              </td>
                              <td className="p-4">
                                <span className="bg-black border border-zinc-700 px-3 py-1.5 rounded-lg text-zinc-200 font-mono font-bold tracking-widest text-xs shadow-inner">
                                  {v.license_plate}
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                <button
                                  onClick={() => handleDeleteVehicle(v.id)}
                                  className="text-zinc-500 hover:text-white bg-zinc-900 hover:bg-red-600 p-2.5 rounded-lg transition shadow-sm mx-auto"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ========================================================
                  KONTEN TAB: DATA BOOKING
              ======================================================== */}
              {activeTab === "booking" && (
                <div className="bg-zinc-950/80 backdrop-blur-md p-6 rounded-3xl border border-zinc-900/80 shadow-2xl space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-lg font-black text-white flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-red-500" />{" "}
                        Pantauan Seluruh Transaksi
                      </h2>
                      <p className="text-xs text-zinc-400 mt-1">
                        Data historis reservasi servis dari seluruh jaringan
                        bengkel.
                      </p>
                    </div>

                    {/* Kotak Pencarian Modern */}
                    <div className="relative w-full sm:w-80 group">
                      <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500 group-focus-within:text-red-500 transition-colors" />
                      <input
                        type="text"
                        placeholder="Cari nama, bengkel, status..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-zinc-800 pl-10 pr-4 py-3 rounded-xl text-sm text-white outline-none focus:border-red-600 focus:bg-zinc-900 transition-all shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-zinc-800/50">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800 uppercase tracking-wider">
                          <th className="p-4 font-bold">Waktu Booking</th>
                          <th className="p-4 font-bold">Data Pelanggan</th>
                          <th className="p-4 font-bold">Tujuan Bengkel</th>
                          <th className="p-4 font-bold">Status Global</th>
                          <th className="p-4 text-center font-bold">
                            Tindakan Khusus
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900/50">
                        {filteredBookings.length === 0 ? (
                          <tr>
                            <td
                              colSpan="5"
                              className="p-10 text-center text-zinc-500 font-medium"
                            >
                              {searchQuery
                                ? "Pencarian tidak ditemukan."
                                : "Belum ada riwayat transaksi."}
                            </td>
                          </tr>
                        ) : (
                          filteredBookings.map((bk) => (
                            <tr
                              key={bk.id}
                              className="hover:bg-zinc-900/40 transition"
                            >
                              <td className="p-4 text-zinc-400 font-mono">
                                {new Date(bk.booking_date).toLocaleDateString(
                                  "id-ID",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )}{" "}
                                <br />
                                <span className="text-[10px]">
                                  {new Date(bk.booking_date).toLocaleTimeString(
                                    "id-ID",
                                    { hour: "2-digit", minute: "2-digit" },
                                  )}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className="font-bold text-white text-sm">
                                  {bk.customer_name}
                                </span>{" "}
                                <br />
                                <span className="text-zinc-500 font-mono text-xs">
                                  {bk.whatsapp}
                                </span>
                              </td>
                              <td className="p-4 text-zinc-300 font-bold text-sm">
                                {bk.bengkel_name}
                              </td>
                              <td className="p-4">
                                <select
                                  value={bk.status}
                                  onChange={(e) =>
                                    handleUpdateStatusBooking(
                                      bk.id,
                                      e.target.value,
                                    )
                                  }
                                  className={`bg-black border border-zinc-800 px-3 py-2 rounded-lg text-xs font-bold outline-none cursor-pointer focus:border-zinc-500 appearance-none text-center min-w-[100px] ${bk.status === "Selesai" ? "text-emerald-500 bg-emerald-500/5" : bk.status === "Batal" ? "text-red-500 bg-red-500/5" : "text-yellow-500 bg-yellow-500/5"}`}
                                >
                                  <option value="Menunggu">⏳ Menunggu</option>
                                  <option value="Diproses">⚙️ Diproses</option>
                                  <option value="Selesai">✅ Selesai</option>
                                  <option value="Batal">❌ Batal</option>
                                </select>
                              </td>
                              <td className="p-4 text-center">
                                <button
                                  onClick={() => handleDeleteBooking(bk.id)}
                                  className="text-zinc-500 hover:text-white bg-zinc-900 hover:bg-red-600 p-2.5 rounded-lg transition shadow-sm mx-auto"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </main>
  );
}
