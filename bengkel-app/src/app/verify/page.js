"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";
import { Wrench, ShieldCheck, ArrowLeft, ArrowRight } from "lucide-react";

function VerifyContent() {
  const searchParams = useSearchParams();
  const [whatsapp, setWhatsapp] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const waParam = searchParams.get("whatsapp");
    if (waParam) setWhatsapp(waParam);
  }, [searchParams]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsapp, otp }),
      });
      const data = await res.json();

      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Verifikasi Berhasil!",
          text: "Akun kamu sudah aktif, silakan login.",
          confirmButtonColor: "#dc2626",
          background: "#09090b",
          color: "#f4f4f5",
        }).then(() => {
          window.location.href = "/login";
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Gagal Verifikasi",
          text: data.message || "Kode OTP salah.",
          confirmButtonColor: "#dc2626",
          background: "#09090b",
          color: "#f4f4f5",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Kesalahan Jaringan",
        text: "Tidak dapat terhubung ke server.",
        background: "#09090b",
        color: "#f4f4f5",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen flex flex-col md:flex-row text-white font-sans antialiased">
      <div className="absolute inset-0 z-0 fixed pointer-events-none">
        <img
          src="/banner-bg.png"
          alt="Background"
          className="w-full h-full object-cover filter brightness-[0.8]"
        />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      </div>

      <section className="relative z-10 w-full md:w-5/12 bg-black/45 p-8 md:p-12 flex flex-col justify-between md:h-screen border-r border-zinc-900">
        <div>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-300 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-full mb-10"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali
          </Link>
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center">
              <Wrench className="w-4 h-4 text-white" />
            </div>
            <div className="text-xl font-black">
              APEX<span className="text-red-600">GARAGE</span>
            </div>
          </div>
          <h1 className="text-3xl font-black mb-3">Verifikasi WhatsApp.</h1>
          <p className="text-zinc-300 text-xs md:text-sm">
            Masukkan 4 digit kode OTP yang telah dikirimkan ke nomor WhatsApp
            kamu.
          </p>
        </div>
      </section>

      <section className="relative z-10 w-full md:w-7/12 flex items-center justify-center p-8 md:p-12">
        <div className="w-full max-w-md bg-zinc-950/85 p-8 md:p-10 rounded-3xl border border-zinc-900 shadow-2xl">
          <h2 className="text-2xl font-black mb-1">Masukkan Kode OTP</h2>
          <p className="text-zinc-400 text-xs mb-6">
            Cek pesan masuk WhatsApp dari Fonnte.
          </p>

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-2">
                Nomor WhatsApp
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                required
                className="w-full bg-zinc-900 border border-zinc-800 px-4 py-3 rounded-xl text-xs text-white outline-none focus:border-red-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-2">
                Kode OTP (4 Digit)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-500">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  maxLength={4}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 pl-10 pr-4 py-3 rounded-xl text-xs text-white tracking-widest text-center font-bold text-lg outline-none focus:border-red-600"
                  placeholder="1234"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl transition text-xs flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isLoading ? (
                "Memverifikasi..."
              ) : (
                <>
                  Verifikasi Akun <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          Memuat...
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
