"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import EmptyState from "@/components/EmptyState";
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
} from "lucide-react";

export default function UserDashboard() {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState("Semua");
  const [isLoading, setIsLoading] = useState(true);

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

  const fetchBookings = (userId) => {
    fetch(`/api/user-bookings?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setBookings(data.data);
        }
        setIsLoading(false);
      });
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      window.location.href = "/login";
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    fetchBookings(parsedUser.id);

    const interval = setInterval(() => {
      fetchBookings(parsedUser.id);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

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
        localStorage.removeItem("user");
        window.location.href = "/login";
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
        const res = await fetch("/api/booking/cancel", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ booking_id: bookingId, reason: cancelReason }),
        });

        const data = await res.json();

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
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings?user_id=${user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            booking_id: bookingId,
            new_date: formValues.date,
            new_time: formValues.time,
            reason: formValues.reason,
          }),
        });

        const data = await res.json();
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-bold text-zinc-500">
        Memuat data...
      </div>
    );
  }

  return (
    <main className="relative min-h-screen bg-black text-white font-sans pb-20 selection:bg-red-600 selection:text-white antialiased">
      <div className="absolute inset-0 z-0 fixed pointer-events-none">
        <img
          src="/workshop-bg.png"
          alt="Workshop Background"
          className="w-full h-full object-cover object-center filter brightness-[0.8] contrast-90"
        />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      </div>

      <header className="relative z-10 bg-zinc-950/85 backdrop-blur-xl border-b border-zinc-900 sticky top-0">
        <div className="max-w-6xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/30">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base md:text-lg font-black tracking-tight text-white">
                Halo, {user?.name}! 👋
              </h1>
              <p className="text-zinc-400 text-xs font-mono mt-0.5">
                {user?.whatsapp}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/booking"
              className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-lg shadow-red-600/20 flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" /> Buat Booking
            </Link>
            <button
              onClick={handleLogout}
              className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold transition border border-zinc-800 flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-6xl mx-auto mt-10 px-6 space-y-8">
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
                        {new Date(booking.booking_date).toLocaleDateString(
                          "id-ID",
                        )}{" "}
                        • {booking.booking_time}
                      </p>
                    </div>

                    {(booking.status === "Pending" ||
                      booking.status === "Dikonfirmasi") && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRescheduleBooking(booking.id)}
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
                    <Wrench className="w-4 h-4 animate-spin" /> Mekanik sedang
                    menangani perbaikan kendaraanmu di bengkel.
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}