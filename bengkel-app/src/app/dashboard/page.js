"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import EmptyState from "@/components/EmptyState";
import CustomerNavbar from "../../components/CustomerNavbar";
import { fetchWithAuth } from "@/utils/api";
import {
  Wrench,
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

  const handleCancelBooking = async (bookingId) => {
    const { value: cancelReason } = await Swal.fire({
      title: "Alasan Pembatalan",
      text: "Tuliskan alasan mengapa kamu ingin membatalkan jadwal servis ini:",
      input: "textarea",
      inputPlaceholder: "Contoh: Ada keperluan mendadak / salah jadwal...",
      showCancelButton: true,
      confirmButtonText: "Kirim Pengajuan",
      cancelButtonText: "Kembali",
      confirmButtonColor: "#111111",
      cancelButtonColor: "#9CA3AF",
      background: "#FFFFFF",
      color: "#111111",
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
            iconColor: "#111111",
            title: "Pengajuan Terkirim",
            text: data.message,
            background: "#FFFFFF",
            color: "#111111",
            confirmButtonColor: "#111111",
          }).then(() => {
            if (user) fetchBookings(user.id);
          });
        } else {
          Swal.fire({
            icon: "error",
            iconColor: "#111111",
            title: "Gagal",
            text: data.message,
            background: "#FFFFFF",
            color: "#111111",
            confirmButtonColor: "#111111",
          });
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          iconColor: "#111111",
          title: "Kesalahan Jaringan",
          text: "Gagal terhubung ke server.",
          background: "#FFFFFF",
          color: "#111111",
          confirmButtonColor: "#111111",
        });
      }
    }
  };

  const handleRescheduleBooking = async (bookingId) => {
    const { value: formValues } = await Swal.fire({
      title: "Ubah Jadwal (Reschedule)",
      html: `
        <div style="text-align: left; font-size: 12px; color: #6B7280; display: flex; flex-direction: column; gap: 10px;">
          <label>Tanggal Baru:</label>
          <input type="date" id="swal-date" class="swal2-input" style="background: #F1F1F1; color: #111111; border: 1px solid #E5E5E5; margin: 0; width: 100%;">
          <label>Jam Baru:</label>
          <input type="time" id="swal-time" class="swal2-input" style="background: #F1F1F1; color: #111111; border: 1px solid #E5E5E5; margin: 0; width: 100%;">
          <label>Alasan Reschedule:</label>
          <textarea id="swal-reason" class="swal2-textarea" placeholder="Contoh: Ada halangan mendadak di jam tersebut..." style="background: #F1F1F1; color: #111111; border: 1px solid #E5E5E5; margin: 0; width: 100%;"></textarea>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Ajukan Reschedule",
      cancelButtonText: "Batal",
      confirmButtonColor: "#111111",
      cancelButtonColor: "#9CA3AF",
      background: "#FFFFFF",
      color: "#111111",
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
            iconColor: "#111111",
            title: "Berhasil Diajukan",
            text: data.message,
            background: "#FFFFFF",
            color: "#111111",
            confirmButtonColor: "#111111",
          });
          if (user) fetchBookings(user.id);
        } else {
          Swal.fire({
            icon: "error",
            iconColor: "#111111",
            title: "Gagal",
            text: data.message,
            background: "#FFFFFF",
            color: "#111111",
            confirmButtonColor: "#111111",
          });
        }
      } catch (err) {
        Swal.fire({
          icon: "error",
          iconColor: "#111111",
          title: "Kesalahan Jaringan",
          text: "Gagal terhubung ke server.",
          background: "#FFFFFF",
          color: "#111111",
          confirmButtonColor: "#111111",
        });
      }
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    if (activeTab === "Semua") return true;
    return booking.status === activeTab;
  });

  // Badge status: hanya hitam, putih, dan abu-abu
  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-[#F1F1F1] text-[#4B5563] border border-[#E5E5E5]">
            <Clock className="w-3.5 h-3.5" strokeWidth={2.25} /> Pending
          </span>
        );
      case "Menunggu Pembatalan":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-white text-[#4B5563] border border-dashed border-[#9CA3AF]">
            <AlertCircle className="w-3.5 h-3.5" strokeWidth={2.25} /> Menunggu
            Pembatalan
          </span>
        );
      case "Menunggu Reschedule":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-white text-[#111111] border border-dashed border-[#111111]">
            <Calendar className="w-3.5 h-3.5" strokeWidth={2.25} /> Menunggu
            Reschedule
          </span>
        );
      case "Dikonfirmasi":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-[#111111]/10 text-[#111111] border border-[#111111]/30">
            <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.25} />{" "}
            Dikonfirmasi
          </span>
        );
      case "Sedang Dikerjakan":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-[#111111] text-white border border-[#111111]">
            <Wrench
              className="w-3.5 h-3.5 animate-spin"
              strokeWidth={2.25}
            />{" "}
            Sedang Dikerjakan
          </span>
        );
      case "Selesai":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-[#333333] text-white border border-[#333333]">
            <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.25} /> Selesai
          </span>
        );
      case "Dibatalkan":
      case "Cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-[#F1F1F1] text-[#9CA3AF] border border-[#E5E5E5]">
            <XCircle className="w-3.5 h-3.5" strokeWidth={2.25} /> Dibatalkan
          </span>
        );
      default:
        return (
          <span className="px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-[#F1F1F1] text-[#4B5563] border border-[#E5E5E5]">
            {status}
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen bg-[#F7F7F7] flex items-center justify-center text-sm font-medium tracking-wide text-[#6B7280]"
        style={{ fontFamily: "Poppins, Inter, ui-sans-serif, system-ui, sans-serif" }}
      >
        Memuat data...
      </div>
    );
  }

  return (
    <main
      className="relative min-h-screen bg-[#F7F7F7] text-[#111111] font-sans pb-20 selection:bg-[#111111] selection:text-white antialiased"
      style={{ fontFamily: "Poppins, Inter, ui-sans-serif, system-ui, sans-serif" }}
    >
      <div className="absolute inset-0 z-0 fixed pointer-events-none">
        <img
          src="/workshop-bg.png"
          alt="Workshop Background"
          className="w-full h-full object-cover object-center filter grayscale brightness-[0.7] contrast-[0.95] saturate-0"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#F7F7F7]/90 via-[#F7F7F7]/85 to-[#F7F7F7]/95 backdrop-blur-[6px]" />
      </div>

      <CustomerNavbar user={user} activePage="dashboard" />

      <div className="relative z-10 max-w-6xl mx-auto mt-10 px-6 space-y-8">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-[#E5E5E5] flex overflow-x-auto p-1.5 gap-1 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.1)] scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-6 py-3 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                activeTab === tab
                  ? "bg-[#111111] text-white shadow-md shadow-black/20 ring-1 ring-black/10"
                  : "text-[#6B7280] hover:text-[#111111] hover:bg-[#F1F1F1]"
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
                className="bg-white backdrop-blur-md rounded-3xl p-7 border border-[#E5E5E5] hover:border-[#9CA3AF] transition-all duration-300 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#111111] to-[#333333]" />

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#E5E5E5] pb-5 gap-3">
                  <div>
                    <span className="text-xs text-[#6B7280] font-medium">
                      Kode Reservasi:
                    </span>
                    <span className="ml-2 text-sm font-semibold text-[#111111] font-mono tracking-wider bg-[#F1F1F1] px-3 py-1 rounded-lg border border-[#E5E5E5]">
                      {booking.booking_code}
                    </span>
                  </div>
                  <div>{getStatusBadge(booking.status)}</div>
                </div>

                <div className="flex flex-col md:flex-row justify-between gap-6 pt-5 items-start md:items-center">
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold tracking-tight text-[#111111]">
                      {booking.service_type}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-[#4B5563]">
                      <span className="flex items-center gap-1.5 font-medium bg-[#F1F1F1] px-3 py-1.5 rounded-xl border border-[#E5E5E5]">
                        <Car className="w-4 h-4 text-[#111111]" strokeWidth={2.25} />{" "}
                        {booking.vehicle_name}
                      </span>
                      <span className="bg-[#F1F1F1] px-3 py-1.5 rounded-xl border border-[#E5E5E5] text-[#111111] font-mono text-xs font-semibold tracking-wider">
                        {booking.license_plate}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="bg-[#F7F7F7] p-4 rounded-2xl border border-[#E5E5E5] min-w-[220px]">
                      <p className="text-[11px] text-[#6B7280] font-medium mb-1">
                        Jadwal Servis:
                      </p>
                      <p className="text-xs font-semibold text-[#111111] flex items-center gap-2">
                        <Calendar
                          className="w-4 h-4 text-[#111111]"
                          strokeWidth={2.25}
                        />{" "}
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
                          className="bg-white hover:bg-[#F1F1F1] text-[#111111] border border-[#E5E5E5] hover:border-[#111111] px-4 py-3.5 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-md shadow-black/10 active:scale-[0.98]"
                          title="Ubah Jadwal"
                        >
                          <Calendar className="w-4 h-4" strokeWidth={2.25} />{" "}
                          Reschedule
                        </button>
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          className="bg-[#F1F1F1] hover:bg-[#E5E5E5] text-[#4B5563] hover:text-[#111111] border border-[#E5E5E5] hover:border-[#4B5563] px-4 py-3.5 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-md shadow-black/10 active:scale-[0.98]"
                          title="Batalkan Pesanan"
                        >
                          <Ban className="w-4 h-4" strokeWidth={2.25} />{" "}
                          Batalkan
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {booking.status === "Sedang Dikerjakan" && (
                  <div className="mt-5 pt-4 border-t border-[#E5E5E5] flex items-center gap-2 text-[#111111] text-xs font-medium animate-pulse">
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
