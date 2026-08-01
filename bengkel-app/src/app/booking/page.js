"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import { fetchWithAuth } from "@/utils/api";
import {
  Wrench,
  ArrowLeft,
  Car,
  Calendar,
  Clock,
  MapPin,
  Store,
  ChevronRight,
  Briefcase,
  CheckCircle2,
} from "lucide-react";

export default function BookingPage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // State Data Master
  const [bengkels, setBengkels] = useState([]);
  const [services, setServices] = useState([]);
  const [schedules, setSchedules] = useState([]);

  // State Pemilihan (Kiri)
  const [selectedBengkel, setSelectedBengkel] = useState(null);

  // State Form (Kanan)
  const [formData, setFormData] = useState({
    vehicle_name: "",
    license_plate: "",
    service_id: "",
    service_name: "", // Untuk display
    booking_date: "",
    booking_time: "",
  });

  // 1. Cek Sesi & Ambil Daftar Bengkel
  useEffect(() => {
    const session = localStorage.getItem("user_session");
    if (!session) {
      Swal.fire({
        icon: "warning",
        title: "Akses Dibatasi",
        text: "Silakan masuk atau daftar terlebih dahulu untuk melakukan booking.",
        background: "#09090b",
        color: "#f4f4f5",
        confirmButtonColor: "#dc2626",
      }).then(() => {
        window.location.href = "/login";
      });
      return;
    }
    setUser(JSON.parse(session));

    fetchWithAuth(`/api/bengkels`)
      .then((data) => {
        if (data?.success) setBengkels(data.data || []);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  // 2. Handler Saat Bengkel Dipilih
  const handleSelectBengkel = async (bengkel) => {
    setSelectedBengkel(bengkel);
    setFormData({
      ...formData,
      service_id: "",
      service_name: "",
      booking_date: "",
      booking_time: "",
    }); // Reset form terkait

    // Fetch Layanan dari Bengkel ini
    fetchWithAuth(`/api/services?bengkel_id=${bengkel.id}`).then((data) =>
      setServices(data?.success ? data.data : []),
    );

    // Fetch Jadwal dari Bengkel ini
    fetchWithAuth(`/api/schedules/${bengkel.id}`).then((data) =>
      setSchedules(data?.success ? data.data : []),
    );
  };

  // 3. Handler Saat Kembali ke Daftar Bengkel
  const handleBackToBengkels = () => {
    setSelectedBengkel(null);
    setServices([]);
    setSchedules([]);
    setFormData({
      ...formData,
      service_id: "",
      service_name: "",
      booking_date: "",
      booking_time: "",
    });
  };

  // 4. Validasi Tanggal (Cek Hari Libur)
  const handleDateChange = (e) => {
    const selectedDate = e.target.value;

    // Dapatkan Nama Hari dari tanggal yang dipilih (Format JavaScript: 0 = Minggu, 1 = Senin, dst)
    const dateObj = new Date(selectedDate);
    const days = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];
    const dayName = days[dateObj.getDay()];

    // Cari jadwal bengkel di hari tersebut
    const schedule = schedules.find((s) => s.day_name === dayName);

    if (!schedule || schedule.is_closed) {
      Swal.fire({
        icon: "error",
        title: "Bengkel Tutup",
        text: `Maaf, ${selectedBengkel.name} tutup/libur pada hari ${dayName}. Silakan pilih tanggal lain.`,
        background: "#09090b",
        color: "#f4f4f5",
        confirmButtonColor: "#dc2626",
      });
      setFormData({ ...formData, booking_date: "", booking_time: "" });
      return;
    }

    setFormData({ ...formData, booking_date: selectedDate, booking_time: "" });
  };

  // 5. Validasi Jam (Cek Jam Operasional)
  const handleTimeChange = (e) => {
    const selectedTime = e.target.value;

    if (!formData.booking_date) {
      Swal.fire({
        icon: "info",
        title: "Pilih Tanggal Dulu",
        text: "Silakan tentukan tanggal servis terlebih dahulu.",
        background: "#09090b",
        color: "#f4f4f5",
      });
      setFormData({ ...formData, booking_time: "" });
      return;
    }

    const dateObj = new Date(formData.booking_date);
    const days = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];
    const schedule = schedules.find(
      (s) => s.day_name === days[dateObj.getDay()],
    );

    const openTime = schedule.open_time.substring(0, 5);
    const closeTime = schedule.close_time.substring(0, 5);

    if (selectedTime < openTime || selectedTime > closeTime) {
      Swal.fire({
        icon: "error",
        title: "Di Luar Jam Operasional",
        text: `Pada hari tersebut, bengkel buka dari jam ${openTime} sampai ${closeTime}.`,
        background: "#09090b",
        color: "#f4f4f5",
        confirmButtonColor: "#dc2626",
      });
      setFormData({ ...formData, booking_time: "" });
      return;
    }

    setFormData({ ...formData, booking_time: selectedTime });
  };

  // 6. Submit Data ke Backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBengkel || !formData.service_id) {
      Swal.fire({
        icon: "warning",
        title: "Data Belum Lengkap",
        text: "Pastikan Anda sudah memilih bengkel dan layanan di sisi kiri.",
        background: "#09090b",
        color: "#f4f4f5",
      });
      return;
    }

    // Konstruksi Payload sesuai field standar
    const payload = {
      bengkel_id: selectedBengkel.id,
      user_id: user.id,
      service_id: formData.service_id,
      vehicle_name: formData.vehicle_name,
      license_plate: formData.license_plate,
      booking_date: formData.booking_date,
      booking_time: formData.booking_time,
    };

    try {
      const data = await fetchWithAuth(`/api/bookings`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (data?.success) {
        Swal.fire({
          icon: "success",
          title: "Booking Berhasil!",
          text: `Pesanan Anda sudah masuk antrean bengkel.`,
          background: "#09090b",
          color: "#f4f4f5",
          confirmButtonColor: "#dc2626",
        }).then(() => {
          window.location.href = "/"; // Atau arahkan ke dashboard pelanggan jika sudah ada
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Gagal Booking",
          text: data.message,
          background: "#09090b",
          color: "#f4f4f5",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error Jaringan",
        text: "Gagal terhubung ke server.",
        background: "#09090b",
        color: "#f4f4f5",
      });
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 text-white">
        <Wrench className="w-8 h-8 text-red-600 animate-spin" />
        <p className="font-bold text-zinc-500 text-sm animate-pulse">
          Menyiapkan Ruang Reservasi...
        </p>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen flex flex-col md:flex-row text-white font-sans antialiased selection:bg-red-600 selection:text-white">
      {/* BACKGROUND GAMBAR */}
      <div className="absolute inset-0 z-0 fixed pointer-events-none">
        <img
          src="/workshop-bg.png"
          alt="Workshop Background"
          className="w-full h-full object-cover object-center filter brightness-[0.4] contrast-125"
        />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      </div>

      {/* SISI KIRI: DINAMIS (DAFTAR BENGKEL -> DAFTAR LAYANAN) */}
      <section className="relative z-10 w-full md:w-5/12 bg-zinc-950/80 backdrop-blur-xl border-r border-zinc-900/80 flex flex-col p-6 md:p-10 md:h-screen md:overflow-y-auto custom-scrollbar">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white mb-8 transition group w-fit"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />{" "}
          Kembali ke Beranda
        </Link>

        <AnimatePresence mode="wait">
          {/* TAMPILAN 1: PILIH BENGKEL */}
          {!selectedBengkel ? (
            <motion.div
              key="bengkel-list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-3xl font-black tracking-tight mb-2">
                Pilih Bengkel.
              </h2>
              <p className="text-zinc-400 text-xs md:text-sm mb-6 leading-relaxed">
                Pilih lokasi bengkel mitra terdekat untuk perawatan kendaraan
                Anda.
              </p>

              <div className="space-y-4">
                {bengkels.map((bengkel) => (
                  <div
                    key={bengkel.id}
                    onClick={() => handleSelectBengkel(bengkel)}
                    className="bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/80 p-5 rounded-2xl cursor-pointer transition group"
                  >
                    <h3 className="font-bold text-white group-hover:text-red-500 transition mb-2">
                      {bengkel.name}
                    </h3>
                    <p className="text-xs text-zinc-400 flex items-start gap-1.5 mb-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />{" "}
                      {bengkel.address}
                    </p>
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-zinc-800">
                      <span className="text-[10px] bg-red-600/10 text-red-500 px-2 py-1 rounded font-bold uppercase tracking-wider">
                        Mitra Aktif
                      </span>
                      <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-red-500 group-hover:translate-x-1 transition" />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            /* TAMPILAN 2: PILIH LAYANAN DARI BENGKEL YANG DIPILIH */
            <motion.div
              key="service-list"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <button
                onClick={handleBackToBengkels}
                className="mb-6 flex items-center gap-2 text-xs font-bold text-red-500 hover:text-red-400 transition bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20"
              >
                <Store className="w-3.5 h-3.5" /> Ganti Bengkel
              </button>

              <h2 className="text-3xl font-black tracking-tight mb-2 text-red-500">
                {selectedBengkel.name}
              </h2>
              <p className="text-zinc-400 text-xs md:text-sm mb-6 leading-relaxed flex items-start gap-1.5">
                <MapPin className="w-4 h-4 shrink-0 text-zinc-500" />{" "}
                {selectedBengkel.address}
              </p>

              <h3 className="text-sm font-bold text-white mb-4 border-b border-zinc-800 pb-2">
                Pilih Layanan Servis
              </h3>

              {services.length === 0 ? (
                <div className="text-center p-6 border border-dashed border-zinc-800 rounded-2xl text-zinc-500 text-xs">
                  Bengkel ini belum mendaftarkan layanannya.
                </div>
              ) : (
                <div className="space-y-3">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          service_id: service.id,
                          service_name: service.service_name,
                        })
                      }
                      className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between ${formData.service_id === service.id ? "bg-red-600/10 border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.15)]" : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-600"}`}
                    >
                      <div>
                        <div className="font-bold text-sm text-white flex items-center gap-2">
                          {formData.service_id === service.id && (
                            <CheckCircle2 className="w-4 h-4 text-red-500" />
                          )}{" "}
                          {service.service_name}
                        </div>
                        <p className="text-xs text-zinc-400 mt-1">
                          {service.description || "Perawatan standar"}
                        </p>
                      </div>
                      <div className="font-mono font-bold text-red-500">
                        {service.price}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* SISI KANAN: FORM BOOKING */}
      <section className="relative z-10 w-full md:w-7/12 flex items-center justify-center p-6 md:p-12 md:h-screen md:overflow-y-auto">
        <div className="w-full max-w-lg bg-zinc-950/85 backdrop-blur-2xl p-8 md:p-10 rounded-3xl border border-zinc-800/80 shadow-2xl my-auto relative overflow-hidden">
          {/* Visual Efek */}
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-red-600/10 rounded-full blur-[80px] pointer-events-none" />

          <div className="mb-8 relative z-10">
            <h3 className="text-2xl font-black tracking-tight text-white mb-1">
              Form Reservasi
            </h3>
            <p className="text-zinc-400 text-xs">
              Atur kendaraan dan jadwal pengerjaan.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            {/* Indikator Bengkel & Layanan Terpilih */}
            <div className="bg-black/50 border border-zinc-800 p-4 rounded-2xl mb-2 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500 font-semibold flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5" /> Bengkel
                </span>
                <span className="font-bold text-white text-right">
                  {selectedBengkel ? (
                    selectedBengkel.name
                  ) : (
                    <span className="text-red-500 animate-pulse">
                      Pilih di sisi kiri...
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-zinc-800/50 pt-3">
                <span className="text-zinc-500 font-semibold flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" /> Layanan
                </span>
                <span className="font-bold text-white text-right">
                  {formData.service_name ? (
                    formData.service_name
                  ) : (
                    <span className="text-red-500 animate-pulse">
                      Pilih di sisi kiri...
                    </span>
                  )}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  Nama Kendaraan
                </label>
                <div className="relative">
                  <Car className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    name="vehicle_name"
                    required
                    value={formData.vehicle_name}
                    onChange={(e) =>
                      setFormData({ ...formData, vehicle_name: e.target.value })
                    }
                    className="w-full bg-zinc-900 border border-zinc-800 pl-10 pr-4 py-3 rounded-xl text-xs text-white outline-none focus:border-red-600 transition"
                    placeholder="Cth: Honda NMAX"
                    disabled={!selectedBengkel || !formData.service_id}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  Plat Nomor
                </label>
                <input
                  type="text"
                  name="license_plate"
                  required
                  value={formData.license_plate}
                  onChange={(e) =>
                    setFormData({ ...formData, license_plate: e.target.value })
                  }
                  className="w-full bg-zinc-900 border border-zinc-800 px-4 py-3 rounded-xl text-xs text-white outline-none focus:border-red-600 transition font-mono uppercase"
                  placeholder="B 1234 XYZ"
                  disabled={!selectedBengkel || !formData.service_id}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  Tanggal Servis
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    value={formData.booking_date}
                    onChange={handleDateChange}
                    className="w-full bg-zinc-900 border border-zinc-800 pl-10 pr-4 py-3 rounded-xl text-xs text-white outline-none focus:border-red-600 transition cursor-pointer"
                    disabled={!selectedBengkel || !formData.service_id}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  Jam Servis
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                  <input
                    type="time"
                    required
                    value={formData.booking_time}
                    onChange={handleTimeChange}
                    className="w-full bg-zinc-900 border border-zinc-800 pl-10 pr-4 py-3 rounded-xl text-xs text-white outline-none focus:border-red-600 transition cursor-pointer"
                    disabled={!formData.booking_date}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={
                !selectedBengkel ||
                !formData.service_id ||
                !formData.booking_time
              }
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold py-4 rounded-xl shadow-lg transition mt-6 text-xs flex justify-center items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> Konfirmasi Reservasi
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
