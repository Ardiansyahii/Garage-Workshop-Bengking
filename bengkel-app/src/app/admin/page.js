"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
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
} from "lucide-react";

export default function AdminBengkelDashboard() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("booking"); // Tab aktif: booking, layanan, jadwal

  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);

  const [newService, setNewService] = useState({
    service_name: "",
    price: "",
    description: "",
  });

  // state pencarian
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBookings = bookings.filter((bk) => {
    const query = searchQuery.toLowerCase();
    return (
      bk.customer_name?.toLowerCase().includes(query) ||
      bk.vehicle_name?.toLowerCase().includes(query) ||
      bk.license_plate?.toLowerCase().includes(query) ||
      bk.booking_code?.toLowerCase().includes(query)
    );
  });

  // ==========================================
  // STATE JADWAL BENGKEL
  // ==========================================
  const [schedules, setSchedules] = useState([]);
  const [formSchedule, setFormSchedule] = useState({
    id: null,
    day_name: "Senin",
    open_time: "08:00",
    close_time: "17:00",
    is_closed: false,
  });
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);

  useEffect(() => {
    // Cek Sesi: Pastikan hanya Admin Bengkel yang bisa masuk
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
  }, []);

  // Fetch data berjalan setelah state user terisi
  useEffect(() => {
    if (user) {
      fetchServices();
      fetchBookings();
      fetchSchedules(user.bengkel_id);
      
    }
  }, [user, searchQuery]);

  const handleLogout = () => {
    localStorage.removeItem("user_session");
    window.location.href = "/login";
  };

  // ==========================================
  // FITUR: CRUD LAYANAN (SERVICES)
  // ==========================================
  const fetchServices = async () => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/services?bengkel_id=${user.bengkel_id}`,
    );
    const data = await res.json();
    if (data.success) setServices(data.data || []);
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/services`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newService, bengkel_id: user.bengkel_id }),
    });
    const data = await res.json();
    if (data.success) {
      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: data.message,
        background: "#09090b",
        color: "#f4f4f5",
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
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/services/${id}`,
        { method: "DELETE" },
      );
      const data = await res.json();
      if (data.success) fetchServices();
    }
  };

  // ==========================================
  // FITUR: CRUD & PENCARIAN BOOKING
  // ==========================================
  const fetchBookings = async () => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/bookings?bengkel_id=${user.bengkel_id}&search=${searchQuery}`,
    );
    const data = await res.json();
    if (data.success) setBookings(data.data || []);
  };

  const handleStatusChange = async (id, newStatus) => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/bookings/${id}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      },
    );
    const data = await res.json();
    if (data.success) {
      fetchBookings();
    } else {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: data.message,
        background: "#09090b",
        color: "#f4f4f5",
      });
    }
  };

  // ==========================================
  // FITUR: CRUD JADWAL OPERASIONAL
  // ==========================================
  const fetchSchedules = async (bengkelId) => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/schedules/${bengkelId}`,
    );
    const data = await res.json();
    if (data.success) setSchedules(data.data || []);
  };

  const handleSubmitSchedule = async (e) => {
    e.preventDefault();
    const url = isEditingSchedule
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/schedules/${formSchedule.id}`
      : `${process.env.NEXT_PUBLIC_API_URL}/api/schedules`;
    const method = isEditingSchedule ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formSchedule, bengkel_id: user.bengkel_id }),
    });
    const data = await res.json();

    if (data.success) {
      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: data.message,
        background: "#09090b",
        color: "#f4f4f5",
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
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/schedules/${id}`,
        { method: "DELETE" },
      );
      const data = await res.json();
      if (data.success) fetchSchedules(user.bengkel_id);
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

  if (!user)
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-bold text-zinc-500">
        Memuat Data Bengkel...
      </div>
    );

  return (
    <main className="relative min-h-screen bg-black font-sans">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src="/workshop-bg.png"
          alt="Background"
          className="w-full h-full object-cover brightness-[0.8]"
        />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      </div>

      <div className="relative z-10 p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* HEADER */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-950 p-6 rounded-3xl border border-zinc-900 shadow-xl">
            <div>
              <h1 className="text-xl font-black text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-red-600" /> PANEL ADMIN BENGKEL
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                Mengelola operasional bengkel: {user.name}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-zinc-900 hover:bg-red-600 text-zinc-300 hover:text-white font-bold px-5 py-2.5 rounded-xl border border-zinc-800 text-xs flex items-center gap-1.5 transition"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>

          {/* TAB MENU */}
          <div className="flex flex-wrap gap-4 border-b border-zinc-900 pb-4">
            <button
              onClick={() => setActiveTab("booking")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition ${activeTab === "booking" ? "bg-red-600 text-white" : "bg-zinc-900 text-zinc-400 hover:text-white"}`}
            >
              <ClipboardList className="w-4 h-4" /> Pesanan (Booking)
            </button>
            <button
              onClick={() => setActiveTab("layanan")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition ${activeTab === "layanan" ? "bg-red-600 text-white" : "bg-zinc-900 text-zinc-400 hover:text-white"}`}
            >
              <Briefcase className="w-4 h-4" /> Kelola Layanan
            </button>
            <button
              onClick={() => setActiveTab("jadwal")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition ${activeTab === "jadwal" ? "bg-red-600 text-white" : "bg-zinc-900 text-zinc-400 hover:text-white"}`}
            >
              <CalendarClock className="w-4 h-4" /> Jadwal Operasional
            </button>
          </div>

          {/* KONTEN TAB: BOOKING */}
          {activeTab === "booking" && (
            <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-900 shadow-xl space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-sm font-black text-white flex items-center gap-2">
                  <ClipboardList className="w-4 h-4" color ="red" />
                  Daftar Antrean Servis
                </h2>
                <div className="relative w-full sm:w-72">
                  <input
                    type="text"
                    placeholder="Cari nama, plat nomor, kode..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 px-4 py-2.5 rounded-xl text-xs text-white outline-none focus:border-red-600 transition"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-900/60 text-zinc-400 border-b border-zinc-800 uppercase tracking-wider">
                      <th className="p-4">Kode & Jadwal</th>
                      <th className="p-4">Pelanggan</th>
                      <th className="p-4">Kendaraan</th>
                      <th className="p-4">Layanan</th>
                      <th className="p-4">Status Transaksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900">
                    {bookings.length === 0 ? (
                      <tr>
                        <td
                          colSpan="5"
                          className="p-6 text-center text-zinc-500"
                        >
                          Belum ada pesanan masuk / tidak ditemukan.
                        </td>
                      </tr>
                    ) : (
                      bookings.map((b) => (
                        <tr
                          key={b.id}
                          className="hover:bg-zinc-900/40 transition"
                        >
                          <td className="p-4">
                            <span className="font-bold font-mono text-red-500">
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
                            <span className="text-[11px] font-mono text-zinc-400">
                              {b.whatsapp_number}
                            </span>
                          </td>
                          <td className="p-4 font-medium text-zinc-200">
                            {b.vehicle_name} <br />
                            <span className="text-[10px] bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 text-zinc-400 font-mono">
                              {b.license_plate}
                            </span>
                          </td>
                          <td className="p-4 font-semibold text-zinc-300">
                            {b.service_name}
                          </td>
                          <td className="p-4">
                            <select
                              value={b.status}
                              onChange={(e) =>
                                handleStatusChange(b.id, e.target.value)
                              }
                              className="bg-zinc-900 border border-zinc-800 p-2 rounded-lg text-xs font-bold text-white outline-none focus:border-red-600"
                            >
                              <option value="Menunggu">🕒 Menunggu</option>
                              <option value="Diproses">👨‍🔧 Diproses</option>
                              <option value="Selesai">✅ Selesai</option>
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

          {/* KONTEN TAB: LAYANAN */}
          {activeTab === "layanan" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
              <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-900 shadow-xl space-y-6 h-fit">
                <h2 className="text-sm font-black text-white flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-red-500" /> Tambah Layanan
                </h2>
                <form onSubmit={handleAddService} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-zinc-400 mb-1.5">
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
                      className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-white outline-none focus:border-red-600"
                      placeholder="Cth: Ganti Oli"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1.5">Harga</label>
                    <input
                      type="text"
                      required
                      value={newService.price}
                      onChange={(e) =>
                        setNewService({ ...newService, price: e.target.value })
                      }
                      className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-white outline-none focus:border-red-600"
                      placeholder="Cth: Rp 50.000"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1.5">
                      Deskripsi
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
                      className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-white outline-none focus:border-red-600"
                      placeholder="Rincian..."
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition"
                  >
                    Simpan Layanan
                  </button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-zinc-950 p-6 rounded-3xl border border-zinc-900 shadow-xl">
                <h2 className="text-sm font-black text-white flex items-center gap-2 mb-5">
                  <Briefcase className="w-4 h-4 text-red-500" /> Layanan Bengkel
                  Ini
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-zinc-900/60 text-zinc-400 border-b border-zinc-800 uppercase tracking-wider">
                        <th className="p-4">Layanan</th>
                        <th className="p-4">Harga</th>
                        <th className="p-4 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900">
                      {services.length === 0 ? (
                        <tr>
                          <td
                            colSpan="3"
                            className="p-6 text-center text-zinc-500"
                          >
                            Belum ada layanan.
                          </td>
                        </tr>
                      ) : (
                        services.map((s) => (
                          <tr
                            key={s.id}
                            className="hover:bg-zinc-900/40 transition"
                          >
                            <td className="p-4 font-bold text-white">
                              {s.service_name}
                            </td>
                            <td className="p-4 font-mono text-red-500">
                              {s.price}
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => handleDeleteService(s.id)}
                                className="bg-zinc-900 hover:bg-red-600 text-zinc-400 hover:text-white px-3 py-2 rounded-lg font-bold border border-zinc-800 transition inline-flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
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

          {/* KONTEN TAB: JADWAL BENGKEL */}
          {activeTab === "jadwal" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
              <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-900 shadow-xl h-fit">
                <h2 className="text-sm font-black flex items-center gap-2 mb-5">
                  <PlusCircle className="w-4 h-4 text-red-500" />{" "}
                  {isEditingSchedule ? "Edit Jadwal" : "Tambah Jadwal Hari"}
                </h2>
                <form
                  onSubmit={handleSubmitSchedule}
                  className="space-y-4 text-xs"
                >
                  <div>
                    <label className="block text-zinc-400 mb-1">
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
                      className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-white outline-none focus:border-red-600"
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

                  <div className="flex items-center gap-2 py-1">
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
                      className="w-4 h-4 accent-red-600 rounded cursor-pointer"
                    />
                    <label
                      htmlFor="is_closed"
                      className="text-zinc-300 font-bold cursor-pointer"
                    >
                      Libur / Tutup Pada Hari Ini
                    </label>
                  </div>

                  {!formSchedule.is_closed && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-zinc-400 mb-1">
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
                          className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-white outline-none focus:border-red-600 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-zinc-400 mb-1">
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
                          className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-white outline-none focus:border-red-600 font-mono"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl transition"
                    >
                      {isEditingSchedule ? "Update Jadwal" : "Simpan Jadwal"}
                    </button>
                    {isEditingSchedule && (
                      <button
                        type="button"
                        onClick={handleResetFormSchedule}
                        className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3.5 rounded-xl transition"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div className="lg:col-span-2 bg-zinc-950 p-6 rounded-3xl border border-zinc-900 shadow-xl">
                <h2 className="text-sm font-black flex items-center gap-2 mb-5">
                  <CalendarClock className="w-4 h-4 text-red-500" /> Jadwal
                  Operasional Aktif
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-zinc-900/50 text-zinc-400 border-b border-zinc-800 uppercase tracking-wider">
                        <th className="p-4">Hari</th>
                        <th className="p-4">Jam Operasional</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900">
                      {schedules.length === 0 ? (
                        <tr>
                          <td
                            colSpan="4"
                            className="p-6 text-center text-zinc-500 font-medium"
                          >
                            Belum ada jadwal operasional yang diatur.
                          </td>
                        </tr>
                      ) : (
                        schedules.map((item) => (
                          <tr key={item.id} className="hover:bg-zinc-900/30">
                            <td className="p-4 font-bold text-white">
                              {item.day_name}
                            </td>
                            <td className="p-4 font-mono text-zinc-300">
                              {item.is_closed
                                ? "-"
                                : `${item.open_time.substring(0, 5)} - ${item.close_time.substring(0, 5)}`}
                            </td>
                            <td className="p-4">
                              {item.is_closed ? (
                                <span className="bg-red-600/10 text-red-500 border border-red-600/20 px-2 py-1 rounded text-[10px] font-bold">
                                  LIBUR
                                </span>
                              ) : (
                                <span className="bg-emerald-600/10 text-emerald-500 border border-emerald-600/20 px-2 py-1 rounded text-[10px] font-bold">
                                  BUKA
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-center flex justify-center gap-2">
                              <button
                                onClick={() => handleEditSchedule(item)}
                                className="bg-zinc-400 hover:bg-blue-600 px-3 py-2 rounded-lg transition"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteSchedule(item.id)}
                                className="bg-zinc-400 hover:bg-red-600 px-3 py-2 rounded-lg transition"
                              >
                                <Trash2 className="w-3 h-3" />
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
        </div>
      </div>
    </main>
  );
}
