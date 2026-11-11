"use client";

import { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import { fetchWithAuth } from "@/utils/api";
import {
  Wrench,
  LogOut,
  PlusCircle,
  Trash2,
  Search,
  ClipboardList,
  Briefcase,
  CalendarClock,
  Edit,
  Menu,
  X,
  Store,
  Activity,
  Clock,
  UserRound,
} from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export default function AdminBengkelDashboard() {
  const [user, setUser] = useState(null);
  const [hasMounted, setHasMounted] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const session = localStorage.getItem("user_session");
      if (!session) {
        window.location.href = "/login";
        return;
      }

      const parsedUser = JSON.parse(session);
      if (parsedUser.role !== "admin_bengkel" || !parsedUser.bengkel_id) {
        window.location.href = "/login";
        return;
      }

      setUser(parsedUser);
    } catch (error) {
      window.location.href = "/login";
      return;
    } finally {
      setHasMounted(true);
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const [activeTab, setActiveTab] = useState("booking");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState({
    service_name: "",
    price: "",
    description: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [profileAdmin, setProfileAdmin] = useState({
    name: "",
    whatsapp: "",
    password: "",
  });
  const [profileBengkel, setProfileBengkel] = useState({
    name: "",
    address: "",
    phone: "",
  });

  // Filter Pencarian
  const filteredBookings = bookings.filter((bk) => {
    const query = searchQuery.toLowerCase();
    return (
      bk.customer_name?.toLowerCase().includes(query) ||
      bk.vehicle_name?.toLowerCase().includes(query) ||
      bk.license_plate?.toLowerCase().includes(query) ||
      bk.booking_code?.toLowerCase().includes(query)
    );
  });

  // Kalkulasi Statistik & Data untuk Recharts
  const statMenunggu = bookings.filter((b) => b.status === "Menunggu").length;
  const statDiproses = bookings.filter((b) => b.status === "Diproses").length;
  const statSelesai = bookings.filter((b) => b.status === "Selesai").length;
  const statBatal = bookings.filter((b) => b.status === "Batal").length;

  // Format array data khusus untuk library Recharts
  const chartData = [
    { status: "Menunggu", jumlah: statMenunggu, fill: "#eab308" }, // Kuning
    { status: "Diproses", jumlah: statDiproses, fill: "#3b82f6" }, // Biru
    { status: "Selesai", jumlah: statSelesai, fill: "#10b981" }, // Hijau
    { status: "Batal", jumlah: statBatal, fill: "#ef4444" }, // Merah
  ];

  // State Jadwal
  const [schedules, setSchedules] = useState([]);
  const [formSchedule, setFormSchedule] = useState({
    id: null,
    day_name: "Senin",
    open_time: "08:00",
    close_time: "17:00",
    is_closed: false,
  });
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("user_session");
    localStorage.removeItem("auth_token");
    document.cookie =
      "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    window.location.href = "/login";
  };

  // ==========================================
  // FITUR: CRUD LAYANAN (SERVICES)
  // ==========================================
  const fetchServices = useCallback(async () => {
    if (!user) return;
    const data = await fetchWithAuth(
      `/api/services?bengkel_id=${user.bengkel_id}`,
    );
    if (data?.success) setServices(data.data || []);
  }, [user]);

  const handleAddService = async (e) => {
    e.preventDefault();
    const data = await fetchWithAuth(`/api/services`, {
      method: "POST",
      body: JSON.stringify({ ...newService, bengkel_id: user.bengkel_id }),
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
      setNewService({ service_name: "", price: "", description: "" });
      fetchServices();
    }
  };

  const handleDeleteService = async (id) => {
    const confirm = await Swal.fire({
      title: "Hapus Layanan?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      background: "#09090b",
      color: "#f4f4f5",
    });
    if (confirm.isConfirmed) {
      const data = await fetchWithAuth(`/api/services/${id}`, {
        method: "DELETE",
      });
      if (data?.success) fetchServices();
    }
  };

  // ==========================================
  // FITUR: CRUD & PENCARIAN BOOKING
  // ==========================================
  const fetchBookings = useCallback(async () => {
    if (!user) return;
    const data = await fetchWithAuth(
      `/api/bookings?bengkel_id=${user.bengkel_id}&search=${searchQuery}`,
    );
    if (data?.success) setBookings(data.data || []);
  }, [searchQuery, user]);

  const handleStatusChange = async (id, newStatus) => {
    const data = await fetchWithAuth(`/api/bookings/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: newStatus }),
    });
    if (data.success) {
      fetchBookings();
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

  // ==========================================
  // FITUR: CETAK LAPORAN PDF (MENGGUNAKAN LIBRARY JSPDF)
  // ==========================================
  const handleExportPDF = () => {
    if (filteredBookings.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Kosong",
        text: "Tidak ada data untuk dicetak menjadi PDF.",
        background: "#09090b",
        color: "#f4f4f5",
      });
      return;
    }

    const doc = new jsPDF();

    // 1. Desain Kop / Judul Dokumen di dalam PDF
    doc.setFontSize(16);
    doc.setTextColor(220, 38, 38); // Warna merah khas Apex Garage
    doc.text("LAPORAN ANTREAN & TRANSAKSI BENGKEL", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Dicetak Oleh: ${user.name} (ID Bengkel: ${user.bengkel_id})`,
      14,
      28,
    );
    doc.text(`Waktu Cetak: ${new Date().toLocaleString("id-ID")}`, 14, 34);

    // 2. Format Kolom dan Baris Tabel
    const tableColumns = [
      "Kode",
      "Tanggal",
      "Pelanggan",
      "Kendaraan",
      "Plat Nomor",
      "Layanan",
      "Status",
    ];
    const tableRows = filteredBookings.map((b) => [
      b.booking_code,
      `${new Date(b.booking_date).toLocaleDateString("id-ID")}`,
      b.customer_name,
      b.vehicle_name,
      b.license_plate,
      b.service_name,
      b.status,
    ]);

    // 3. Render Tabel otomatis menggunakan jspdf-autotable
    doc.autoTable({
      head: [tableColumns],
      body: tableRows,
      startY: 40,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    // 4. Unduh file PDF otomatis
    doc.save(`Laporan_Servis_Bengkel_${user.bengkel_id}_${Date.now()}.pdf`);

    Swal.fire({
      icon: "success",
      title: "PDF Berhasil Dicetak!",
      text: "File laporan transaksi telah diunduh ke komputer Anda.",
      background: "#09090b",
      color: "#f4f4f5",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  // ==========================================
  // FITUR: CRUD JADWAL OPERASIONAL
  // ==========================================
  const fetchSchedules = useCallback(async (bengkelId) => {
    const data = await fetchWithAuth(`/api/schedules/${bengkelId}`);
    if (data?.success) setSchedules(data.data || []);
  }, []);

  const fetchProfileData = useCallback(async () => {
    if (!user) return;

    try {
      const { data } = await fetchWithAuth("/api/profile");
      if (data?.success) {
        setProfileAdmin({ ...data.data.admin, password: "" });
        if (data.data.bengkel) {
          setProfileBengkel(data.data.bengkel);
        }
      }
    } catch (error) {
      console.error("Gagal memuat profil admin:", error);
      Swal.fire({
        icon: "error",
        title: "Gagal memuat profil",
        text: "Data profil tidak dapat diambil saat ini.",
        background: "#09090b",
        color: "#f4f4f5",
        confirmButtonColor: "#dc2626",
      });
    }
  }, [user]);

  const handleUpdateAdmin = async (e) => {
    e.preventDefault();

    try {
      const { data } = await fetchWithAuth("/api/profile/admin", {
        method: "PUT",
        body: JSON.stringify(profileAdmin),
      });

      if (data?.success) {
        Swal.fire({
          icon: "success",
          title: "Berhasil",
          text: data.message,
          background: "#09090b",
          color: "#f4f4f5",
          confirmButtonColor: "#dc2626",
        });
        setProfileAdmin({ ...profileAdmin, password: "" });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Gagal memperbarui profil",
        text: error.message || "Terjadi kesalahan.",
        background: "#09090b",
        color: "#f4f4f5",
        confirmButtonColor: "#dc2626",
      });
    }
  };

  const handleUpdateBengkel = async (e) => {
    e.preventDefault();

    try {
      const { data } = await fetchWithAuth("/api/profile/bengkel", {
        method: "PUT",
        body: JSON.stringify(profileBengkel),
      });

      if (data?.success) {
        Swal.fire({
          icon: "success",
          title: "Berhasil",
          text: data.message,
          background: "#09090b",
          color: "#f4f4f5",
          confirmButtonColor: "#dc2626",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Gagal memperbarui bengkel",
        text: error.message || "Terjadi kesalahan.",
        background: "#09090b",
        color: "#f4f4f5",
        confirmButtonColor: "#dc2626",
      });
    }
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (user) {
      fetchProfileData();
      fetchServices();
      fetchBookings();
      fetchSchedules(user.bengkel_id);
    }
  }, [
    user,
    searchQuery,
    fetchProfileData,
    fetchServices,
    fetchBookings,
    fetchSchedules,
  ]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleSubmitSchedule = async (e) => {
    e.preventDefault();
    const url = isEditingSchedule
      ? `/api/schedules/${formSchedule.id}`
      : `/api/schedules`;
    const method = isEditingSchedule ? "PUT" : "POST";
    const data = await fetchWithAuth(url, {
      method,
      body: JSON.stringify({ ...formSchedule, bengkel_id: user.bengkel_id }),
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
      handleResetFormSchedule();
      fetchSchedules(user.bengkel_id);
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

  const handleEditSchedule = (item) => {
    setFormSchedule({
      id: item.id,
      day_name: item.day_name,
      open_time: item.open_time ? item.open_time.substring(0, 5) : "08:00",
      close_time: item.close_time ? item.close_time.substring(0, 5) : "17:00",
      is_closed: item.is_closed === 1 || item.is_closed === true,
    });
    setIsEditingSchedule(true);
  };

  const handleDeleteSchedule = async (id) => {
    const confirm = await Swal.fire({
      title: "Hapus Jadwal?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      background: "#09090b",
      color: "#f4f4f5",
    });
    if (confirm.isConfirmed) {
      const data = await fetchWithAuth(`/api/schedules/${id}`, {
        method: "DELETE",
      });
      if (data?.success) fetchSchedules(user.bengkel_id);
    }
  };

  const handleResetFormSchedule = () => {
    setFormSchedule({
      id: null,
      day_name: "Senin",
      open_time: "08:00",
      close_time: "17:00",
      is_closed: false,
    });
    setIsEditingSchedule(false);
  };

  // Konfigurasi Navigasi Sidebar
  const navItems = [
    {
      id: "booking",
      label: "Pesanan Masuk",
      icon: ClipboardList,
      badge: bookings.filter((b) => b.status === "Menunggu").length,
    },
    { id: "layanan", label: "Kelola Layanan", icon: Briefcase },
    { id: "jadwal", label: "Jadwal Operasional", icon: CalendarClock },
    { id: "profile-admin", label: "Profile Admin", icon: UserRound },
    { id: "profile-bengkel", label: "Profil Bengkel", icon: Store },
  ];

  if (!hasMounted || !user)
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500 font-bold">
        <div className="animate-pulse flex items-center gap-2">
          <Store className="w-5 h-5 text-red-600" /> Memuat Ruang Kerja...
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
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-wider leading-none">
                MITRA<span className="text-red-600">BENGKEL</span>
              </h1>
              <p className="text-[10px] text-zinc-500 font-mono mt-1">
                DASHBOARD GARAGE SYSTEM
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
        <div className="px-6 py-5 mx-4 mt-4 bg-zinc-900/50 rounded-2xl border border-zinc-800/50 flex flex-col gap-1">
          <p className="text-xs text-zinc-500 font-medium">Administrator:</p>
          <p className="text-sm font-bold text-white truncate">{user.name}</p>
          <div className="w-full h-px bg-zinc-800/80 my-2"></div>
          <div className="flex items-center gap-2 text-xs text-red-500 font-bold">
            <Store className="w-3.5 h-3.5" /> ID Bengkel: #{user.bengkel_id}
          </div>
        </div>

        {/* Menu Navigasi Samping */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 custom-scrollbar">
          <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-4 mb-3">
            Menu Operasional
          </div>
          {navItems.map((item) => {
            const isCurrent = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isCurrent
                    ? "bg-red-600/10 text-red-500 border border-red-600/20 shadow-inner"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900/50 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon
                    className={`w-4 h-4 ${isCurrent ? "text-red-500" : "text-zinc-500"}`}
                  />
                  {item.label}
                </div>
                {item.badge > 0 && (
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isCurrent ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-300"}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Logout */}
        <div className="p-6 border-t border-zinc-900/50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-red-600 text-zinc-400 hover:text-white py-3 rounded-xl text-sm font-bold transition-all border border-zinc-800 hover:border-red-500 group"
          >
            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />{" "}
            Tutup & Keluar
          </button>
        </div>
      </aside>

      {/* =========================================================
          AREA KONTEN UTAMA (KANAN)
      ========================================================= */}
      <section className="flex-1 flex flex-col h-screen overflow-hidden bg-[url('/workshop-bg.png')] bg-cover bg-center bg-no-repeat relative">
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-0" />

        {/* Header Mobile / Topbar */}
        <header className="relative z-10 lg:hidden flex items-center justify-between p-6 border-b border-zinc-900/80 bg-zinc-950/80 backdrop-blur-md">
          <div className="flex items-center gap-2 font-black tracking-wider text-sm">
            <Wrench className="w-4 h-4 text-red-600" /> PANEL ADMIN
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="text-zinc-400 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        <div className="relative z-10 flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          {/* STATS WIDGETS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-zinc-950 border border-zinc-900/80 p-5 rounded-2xl shadow-xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-600/10 flex items-center justify-center border border-blue-600/20">
                <ClipboardList className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-0.5">
                  Total Reservasi
                </p>
                <p className="text-2xl font-black text-white">
                  {bookings.length}
                </p>
              </div>
            </div>
            <div className="bg-zinc-950 border border-zinc-900/80 p-5 rounded-2xl shadow-xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-600/10 flex items-center justify-center border border-emerald-600/20">
                <Briefcase className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-0.5">
                  Layanan Tersedia
                </p>
                <p className="text-2xl font-black text-white">
                  {services.length}
                </p>
              </div>
            </div>
            <div className="bg-zinc-950 border border-zinc-900/80 p-5 rounded-2xl shadow-xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-600/10 flex items-center justify-center border border-red-600/20">
                <CalendarClock className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-0.5">
                  Hari Operasional
                </p>
                <p className="text-2xl font-black text-white">
                  {schedules.filter((s) => !s.is_closed).length} Hari
                </p>
              </div>
            </div>
          </div>

          {/* ========================================================
              VISUALISASI GRAFIK ANALITIK (MENGGUNAKAN RECHARTS)
          ======================================================== */}
          <div className="bg-zinc-950/80 backdrop-blur-md p-6 rounded-3xl border border-zinc-900/80 shadow-2xl mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-black text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-red-500" /> Analitik Status
                Pesanan
              </h2>
              <span className="text-[10px] bg-red-600/10 text-red-500 px-2 py-1 rounded-md border border-red-600/20 font-bold tracking-wider">
                LIVE DATA
              </span>
            </div>

            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <XAxis
                    dataKey="status"
                    stroke="#71717a"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#71717a"
                    fontSize={12}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(255, 255, 255, 0.03)" }}
                    contentStyle={{
                      backgroundColor: "#09090b",
                      borderColor: "#27272a",
                      borderRadius: "12px",
                      color: "#f4f4f5",
                      fontSize: "12px",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
                    }}
                  />
                  <Bar dataKey="jumlah" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
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
                  KONTEN TAB: DATA BOOKING
              ======================================================== */}
              {activeTab === "booking" && (
                <div className="bg-zinc-950/80 backdrop-blur-md p-6 rounded-3xl border border-zinc-900/80 shadow-2xl space-y-6">
                  {/* BUG FIX: Hapus duplikat Header UI di sini */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h2 className="text-lg font-black text-white flex items-center gap-2">
                        <Activity className="w-5 h-5 text-red-500" /> Daftar
                        Antrean Kendaraan
                      </h2>
                      <p className="text-xs text-zinc-400 mt-1">
                        Ubah status pekerjaan dari dropdown untuk mengabari
                        pelanggan via WhatsApp otomatis.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                      <button
                        onClick={handleExportPDF}
                        className="w-full sm:w-auto bg-emerald-600/10 hover:bg-emerald-600 text-emerald-500 hover:text-white border border-emerald-500/30 px-4 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 text-sm shadow-sm"
                      >
                        <ClipboardList className="w-4 h-4" /> Cetak PDF
                      </button>

                      <div className="relative w-full sm:w-64 group">
                        <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500 group-focus-within:text-red-500 transition-colors" />
                        <input
                          type="text"
                          placeholder="Cari pesanan..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-zinc-900/50 border border-zinc-800 pl-10 pr-4 py-3 rounded-xl text-sm text-white outline-none focus:border-red-600 focus:bg-zinc-900 transition-all shadow-inner"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-zinc-800/50">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800 uppercase tracking-wider">
                          <th className="p-4 font-bold">Kode & Jadwal</th>
                          <th className="p-4 font-bold">Pelanggan</th>
                          <th className="p-4 font-bold">Kendaraan</th>
                          <th className="p-4 font-bold">Layanan</th>
                          <th className="p-4 text-center font-bold">
                            Status Transaksi
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
                              Belum ada pesanan masuk / tidak ditemukan.
                            </td>
                          </tr>
                        ) : (
                          filteredBookings.map((b) => (
                            <tr
                              key={b.id}
                              className="hover:bg-zinc-900/40 transition"
                            >
                              <td className="p-4">
                                <span className="font-bold font-mono text-red-500 text-sm">
                                  {b.booking_code}
                                </span>
                                <br />
                                <span className="text-zinc-400">
                                  {new Date(b.booking_date).toLocaleDateString(
                                    "id-ID",
                                  )}{" "}
                                  • {b.booking_time}
                                </span>
                              </td>
                              <td className="p-4 font-bold text-white">
                                {b.customer_name} <br />
                                <span className="text-[11px] font-mono text-zinc-500">
                                  {b.whatsapp_number}
                                </span>
                              </td>
                              <td className="p-4 font-medium text-zinc-200">
                                {b.vehicle_name} <br />
                                <span className="text-[10px] bg-black px-2 py-0.5 rounded border border-zinc-700 text-zinc-400 font-mono tracking-wider">
                                  {b.license_plate}
                                </span>
                              </td>
                              <td className="p-4 font-bold text-zinc-300">
                                {b.service_name}
                              </td>
                              <td className="p-4">
                                <select
                                  value={b.status}
                                  onChange={(e) =>
                                    handleStatusChange(b.id, e.target.value)
                                  }
                                  className={`w-full bg-black border border-zinc-800 px-3 py-2 rounded-xl text-xs font-bold outline-none cursor-pointer focus:border-zinc-500 appearance-none text-center ${b.status === "Selesai" ? "text-emerald-500 bg-emerald-500/5" : b.status === "Batal" ? "text-red-500 bg-red-500/5" : "text-yellow-500 bg-yellow-500/5"}`}
                                >
                                  <option value="Menunggu">🕒 Menunggu</option>
                                  <option value="Diproses">⚙️ Diproses</option>
                                  <option value="Selesai">✅ Selesai</option>
                                  <option value="Batal">❌ Batal</option>
                                </select>
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
                  KONTEN TAB: LAYANAN
              ======================================================== */}
              {activeTab === "layanan" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-zinc-950/80 backdrop-blur-md p-6 rounded-3xl border border-zinc-900/80 shadow-2xl h-fit">
                    <h2 className="text-base font-black text-white flex items-center gap-2 mb-5">
                      <PlusCircle className="w-5 h-5 text-red-500" /> Tambah
                      Layanan
                    </h2>
                    <form
                      onSubmit={handleAddService}
                      className="space-y-4 text-xs"
                    >
                      <div>
                        <label className="block text-zinc-400 font-bold mb-1.5 uppercase tracking-wider text-[10px]">
                          Nama Layanan
                        </label>
                        <input
                          type="text"
                          required
                          value={newService.service_name}
                          onChange={(e) =>
                            setNewService({
                              ...newService,
                              service_name: e.target.value,
                            })
                          }
                          className="w-full bg-zinc-900/50 border border-zinc-800 p-3.5 rounded-xl text-sm text-white outline-none focus:border-red-600 focus:bg-zinc-900 transition-all shadow-inner"
                          placeholder="Cth: Ganti Oli Mesin"
                        />
                      </div>
                      <div>
                        <label className="block text-zinc-400 font-bold mb-1.5 uppercase tracking-wider text-[10px]">
                          Harga / Biaya
                        </label>
                        <input
                          type="text"
                          required
                          value={newService.price}
                          onChange={(e) =>
                            setNewService({
                              ...newService,
                              price: e.target.value,
                            })
                          }
                          className="w-full bg-zinc-900/50 border border-zinc-800 p-3.5 rounded-xl text-sm text-white outline-none focus:border-red-600 focus:bg-zinc-900 transition-all shadow-inner"
                          placeholder="Cth: Rp 50.000"
                        />
                      </div>
                      <div>
                        <label className="block text-zinc-400 font-bold mb-1.5 uppercase tracking-wider text-[10px]">
                          Deskripsi Pekerjaan
                        </label>
                        <textarea
                          rows="3"
                          value={newService.description}
                          onChange={(e) =>
                            setNewService({
                              ...newService,
                              description: e.target.value,
                            })
                          }
                          className="w-full bg-zinc-900/50 border border-zinc-800 p-3.5 rounded-xl text-sm text-white outline-none focus:border-red-600 focus:bg-zinc-900 transition-all shadow-inner"
                          placeholder="Rincian layanan..."
                        ></textarea>
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-900/20 active:scale-[0.98] transition text-sm"
                      >
                        Simpan Layanan Baru
                      </button>
                    </form>
                  </div>

                  <div className="lg:col-span-2 bg-zinc-950/80 backdrop-blur-md p-6 rounded-3xl border border-zinc-900/80 shadow-2xl">
                    <h2 className="text-base font-black text-white mb-5 flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-red-500" /> Katalog
                      Layanan Bengkel
                    </h2>
                    <div className="overflow-x-auto rounded-2xl border border-zinc-800/50">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800 uppercase tracking-wider">
                            <th className="p-4 font-bold">Nama Layanan</th>
                            <th className="p-4 font-bold">Harga</th>
                            <th className="p-4 text-center font-bold">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900/50">
                          {services.length === 0 ? (
                            <tr>
                              <td
                                colSpan="3"
                                className="p-10 text-center text-zinc-500 font-medium"
                              >
                                Belum ada layanan terdaftar.
                              </td>
                            </tr>
                          ) : (
                            services.map((s) => (
                              <tr
                                key={s.id}
                                className="hover:bg-zinc-900/40 transition"
                              >
                                <td className="p-4">
                                  <span className="font-bold text-white text-sm">
                                    {s.service_name}
                                  </span>
                                  <br />
                                  <span className="text-zinc-500 text-xs truncate max-w-[200px] inline-block">
                                    {s.description || "Tidak ada deskripsi"}
                                  </span>
                                </td>
                                <td className="p-4 font-mono font-bold text-red-500">
                                  {s.price}
                                </td>
                                <td className="p-4 text-center">
                                  <button
                                    onClick={() => handleDeleteService(s.id)}
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
                </div>
              )}

              {/* ========================================================
                  KONTEN TAB: JADWAL BENGKEL
              ======================================================== */}
              {activeTab === "jadwal" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-zinc-950/80 backdrop-blur-md p-6 rounded-3xl border border-zinc-900/80 shadow-2xl h-fit">
                    <h2 className="text-base font-black text-white flex items-center gap-2 mb-5">
                      <Clock className="w-5 h-5 text-red-500" />{" "}
                      {isEditingSchedule
                        ? "Edit Waktu Buka"
                        : "Tambah Waktu Buka"}
                    </h2>
                    <form
                      onSubmit={handleSubmitSchedule}
                      className="space-y-4 text-xs"
                    >
                      <div>
                        <label className="block text-zinc-400 font-bold mb-1.5 uppercase tracking-wider text-[10px]">
                          Pilih Hari
                        </label>
                        <select
                          value={formSchedule.day_name}
                          onChange={(e) =>
                            setFormSchedule({
                              ...formSchedule,
                              day_name: e.target.value,
                            })
                          }
                          className="w-full bg-zinc-900/50 border border-zinc-800 p-3.5 rounded-xl text-sm text-white outline-none focus:border-red-600 focus:bg-zinc-900 transition-all appearance-none cursor-pointer"
                        >
                          <option value="Senin">Senin</option>
                          <option value="Selasa">Selasa</option>
                          <option value="Rabu">Rabu</option>
                          <option value="Kamis">Kamis</option>
                          <option value="Jumat">Jumat</option>
                          <option value="Sabtu">Sabtu</option>
                          <option value="Minggu">Minggu</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-3 py-2 px-1">
                        <input
                          type="checkbox"
                          id="is_closed"
                          checked={formSchedule.is_closed}
                          onChange={(e) =>
                            setFormSchedule({
                              ...formSchedule,
                              is_closed: e.target.checked,
                            })
                          }
                          className="w-5 h-5 accent-red-600 rounded cursor-pointer"
                        />
                        <label
                          htmlFor="is_closed"
                          className="text-zinc-300 font-bold cursor-pointer text-sm"
                        >
                          Libur / Tutup Pada Hari Ini
                        </label>
                      </div>

                      {!formSchedule.is_closed && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-zinc-400 font-bold mb-1.5 uppercase tracking-wider text-[10px]">
                              Jam Buka
                            </label>
                            <input
                              type="time"
                              required={!formSchedule.is_closed}
                              value={formSchedule.open_time}
                              onChange={(e) =>
                                setFormSchedule({
                                  ...formSchedule,
                                  open_time: e.target.value,
                                })
                              }
                              className="w-full bg-zinc-900/50 border border-zinc-800 p-3.5 rounded-xl text-sm text-white outline-none focus:border-red-600 focus:bg-zinc-900 transition-all font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-zinc-400 font-bold mb-1.5 uppercase tracking-wider text-[10px]">
                              Jam Tutup
                            </label>
                            <input
                              type="time"
                              required={!formSchedule.is_closed}
                              value={formSchedule.close_time}
                              onChange={(e) =>
                                setFormSchedule({
                                  ...formSchedule,
                                  close_time: e.target.value,
                                })
                              }
                              className="w-full bg-zinc-900/50 border border-zinc-800 p-3.5 rounded-xl text-sm text-white outline-none focus:border-red-600 focus:bg-zinc-900 transition-all font-mono"
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex gap-3 pt-2">
                        <button
                          type="submit"
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition text-sm"
                        >
                          {isEditingSchedule ? "Update" : "Simpan"}
                        </button>
                        {isEditingSchedule && (
                          <button
                            type="button"
                            onClick={handleResetFormSchedule}
                            className="w-24 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 rounded-xl transition text-sm"
                          >
                            Batal
                          </button>
                        )}
                      </div>
                    </form>
                  </div>

                  <div className="lg:col-span-2 bg-zinc-950/80 backdrop-blur-md p-6 rounded-3xl border border-zinc-900/80 shadow-2xl">
                    <h2 className="text-base font-black text-white mb-5 flex items-center gap-2">
                      <CalendarClock className="w-5 h-5 text-red-500" /> Jadwal
                      Operasional Aktif
                    </h2>
                    <div className="overflow-x-auto rounded-2xl border border-zinc-800/50">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800 uppercase tracking-wider">
                            <th className="p-4 font-bold">Hari</th>
                            <th className="p-4 font-bold">Jam Operasional</th>
                            <th className="p-4 font-bold">Status</th>
                            <th className="p-4 text-center font-bold">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900/50">
                          {schedules.length === 0 ? (
                            <tr>
                              <td
                                colSpan="4"
                                className="p-10 text-center text-zinc-500 font-medium"
                              >
                                Belum ada jadwal operasional yang diatur.
                              </td>
                            </tr>
                          ) : (
                            schedules.map((item) => (
                              <tr
                                key={item.id}
                                className="hover:bg-zinc-900/40 transition"
                              >
                                <td className="p-4 font-bold text-white text-sm">
                                  {item.day_name}
                                </td>
                                <td className="p-4 font-mono text-zinc-300">
                                  {item.is_closed
                                    ? "-"
                                    : `${item.open_time.substring(0, 5)} - ${item.close_time.substring(0, 5)}`}
                                </td>
                                <td className="p-4">
                                  {item.is_closed ? (
                                    <span className="bg-red-600/10 text-red-500 border border-red-600/20 px-3 py-1.5 rounded-lg text-[11px] font-bold">
                                      TUTUP / LIBUR
                                    </span>
                                  ) : (
                                    <span className="bg-emerald-600/10 text-emerald-500 border border-emerald-600/20 px-3 py-1.5 rounded-lg text-[11px] font-bold">
                                      BUKA
                                    </span>
                                  )}
                                </td>
                                <td className="p-4 text-center">
                                  <div className="flex justify-center gap-2">
                                    <button
                                      onClick={() => handleEditSchedule(item)}
                                      className="text-zinc-400 hover:text-white bg-zinc-800 hover:bg-blue-600 p-2.5 rounded-lg transition shadow-sm"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeleteSchedule(item.id)
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

              {activeTab === "profile-admin" && (
                <div className="bg-zinc-950/80 backdrop-blur-md p-6 rounded-3xl border border-zinc-900/80 shadow-2xl max-w-3xl mx-auto">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center">
                      <UserRound className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
                        Pengaturan Akun
                      </p>
                      <h2 className="text-xl font-black text-white">
                        Profile Admin
                      </h2>
                    </div>
                  </div>

                  <form onSubmit={handleUpdateAdmin} className="space-y-5">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-zinc-400 font-bold mb-2">
                        Nama Lengkap
                      </label>
                      <input
                        type="text"
                        required
                        value={profileAdmin.name}
                        onChange={(e) =>
                          setProfileAdmin({
                            ...profileAdmin,
                            name: e.target.value,
                          })
                        }
                        className="w-full bg-zinc-900/50 border border-zinc-800 p-3.5 rounded-xl text-sm text-white outline-none focus:border-red-600 focus:bg-zinc-900 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-zinc-400 font-bold mb-2">
                        Nomor WhatsApp
                      </label>
                      <input
                        type="text"
                        required
                        value={profileAdmin.whatsapp}
                        onChange={(e) =>
                          setProfileAdmin({
                            ...profileAdmin,
                            whatsapp: e.target.value,
                          })
                        }
                        className="w-full bg-zinc-900/50 border border-zinc-800 p-3.5 rounded-xl text-sm text-white outline-none focus:border-red-600 focus:bg-zinc-900 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-zinc-400 font-bold mb-2">
                        Password Baru (Opsional)
                      </label>
                      <input
                        type="password"
                        placeholder="Isi jika ingin mengganti password"
                        value={profileAdmin.password}
                        onChange={(e) =>
                          setProfileAdmin({
                            ...profileAdmin,
                            password: e.target.value,
                          })
                        }
                        className="w-full bg-zinc-900/50 border border-zinc-800 p-3.5 rounded-xl text-sm text-white outline-none focus:border-red-600 focus:bg-zinc-900 transition-all"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-900/20 transition"
                    >
                      Simpan Profil Admin
                    </button>
                  </form>
                </div>
              )}

              {activeTab === "profile-bengkel" && (
                <div className="bg-zinc-950/80 backdrop-blur-md p-6 rounded-3xl border border-zinc-900/80 shadow-2xl max-w-3xl mx-auto">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center">
                      <Store className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
                        Informasi Umum
                      </p>
                      <h2 className="text-xl font-black text-white">
                        Profil Bengkel
                      </h2>
                    </div>
                  </div>

                  <form onSubmit={handleUpdateBengkel} className="space-y-5">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-zinc-400 font-bold mb-2">
                        Nama Bengkel
                      </label>
                      <input
                        type="text"
                        required
                        value={profileBengkel.name}
                        onChange={(e) =>
                          setProfileBengkel({
                            ...profileBengkel,
                            name: e.target.value,
                          })
                        }
                        className="w-full bg-zinc-900/50 border border-zinc-800 p-3.5 rounded-xl text-sm text-white outline-none focus:border-red-600 focus:bg-zinc-900 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-zinc-400 font-bold mb-2">
                        Nomor Telepon Bengkel
                      </label>
                      <input
                        type="text"
                        required
                        value={profileBengkel.phone}
                        onChange={(e) =>
                          setProfileBengkel({
                            ...profileBengkel,
                            phone: e.target.value,
                          })
                        }
                        className="w-full bg-zinc-900/50 border border-zinc-800 p-3.5 rounded-xl text-sm text-white outline-none focus:border-red-600 focus:bg-zinc-900 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-zinc-400 font-bold mb-2">
                        Alamat Lengkap
                      </label>
                      <textarea
                        required
                        rows="4"
                        value={profileBengkel.address}
                        onChange={(e) =>
                          setProfileBengkel({
                            ...profileBengkel,
                            address: e.target.value,
                          })
                        }
                        className="w-full bg-zinc-900/50 border border-zinc-800 p-3.5 rounded-xl text-sm text-white outline-none focus:border-red-600 focus:bg-zinc-900 transition-all resize-none"
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-900/20 transition"
                    >
                      Simpan Informasi Bengkel
                    </button>
                  </form>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </main>
  );
}
