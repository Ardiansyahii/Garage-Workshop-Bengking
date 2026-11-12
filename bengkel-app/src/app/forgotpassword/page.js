"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Wrench,
  Phone,
  Lock,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  X,
  Loader2,
} from "lucide-react";

// Samakan dengan base URL API di halaman Login/Register web kamu.
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Endpoint yang diasumsikan ada di backend (sama seperti versi mobile):
//   POST /api/auth/request-reset-otp { whatsapp }                -> kirim OTP
//   POST /api/auth/reset-password    { whatsapp, otp, password } -> ganti password
const ROUTES = { login: "/login" };
const OTP_LENGTH = 4;

const cx = (...c) => c.filter(Boolean).join(" ");

// ---- Kelas Tailwind yang dipakai berulang -------------------------------
const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900";

const inputWrap = (error, locked) =>
  cx(
    "flex min-h-[54px] items-center gap-2 rounded-2xl border-[1.5px] px-4 transition-colors",
    "focus-within:border-zinc-900 focus-within:bg-white focus-within:text-zinc-900",
    error ? "border-red-600 bg-red-50 text-zinc-400" : "border-transparent bg-zinc-100 text-zinc-400",
    locked && "opacity-75"
  );

const textInput =
  "w-full min-w-0 flex-1 bg-transparent py-3.5 text-base text-zinc-900 outline-none " +
  "placeholder:text-zinc-400 disabled:[-webkit-text-fill-color:#18181b]";

const primaryBtn =
  "mt-2 flex h-[54px] w-full items-center justify-center rounded-full bg-zinc-900 text-[15px] font-semibold " +
  "text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-zinc-400 disabled:hover:opacity-100 " +
  focusRing;

const labelCls = "mb-2 block text-[13px] font-semibold text-zinc-700";
const errorCls = "mt-1.5 break-words text-xs text-red-600";
const btnRow = "inline-flex items-center gap-2";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [whatsapp, setWhatsapp] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  // Pengganti Alert di mobile: banner status inline
  const [notice, setNotice] = useState(null); // { type: "success" | "error", text }

  // Kunci scroll body & tutup modal dengan Escape
  useEffect(() => {
    if (!showPasswordModal) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape" && !isSubmitting) closePasswordModal();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPasswordModal, isSubmitting]);

  // STEP 1: minta OTP dikirim ke WhatsApp
  const requestOtp = async () => {
    const res = await fetch(`${API_URL}/api/auth/request-reset-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ whatsapp }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.success) {
      throw new Error(data?.message || "Gagal mengirim OTP");
    }
  };

  const handleRequestOtp = async (e) => {
    e?.preventDefault();
    if (!whatsapp.trim()) {
      setErrors({ whatsapp: "Nomor WhatsApp wajib diisi" });
      return;
    }
    setErrors({});
    setNotice(null);
    try {
      setIsSendingOtp(true);
      await requestOtp();
      setOtp("");
      setOtpSent(true);
      setNotice({ type: "success", text: "Kode OTP sudah dikirim ke WhatsApp Anda." });
    } catch (err) {
      setNotice({ type: "error", text: err.message || "Terjadi kesalahan, silakan coba lagi." });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleChangeNumber = () => {
    setOtpSent(false);
    setOtp("");
    setErrors({});
    setNotice(null);
  };

  const handleResendOtp = async () => {
    setNotice(null);
    try {
      setIsResending(true);
      await requestOtp();
      setOtp("");
      setNotice({ type: "success", text: "Kode OTP baru sudah dikirim." });
    } catch (err) {
      setNotice({ type: "error", text: err.message || "Gagal mengirim ulang OTP." });
    } finally {
      setIsResending(false);
    }
  };

  // Validasi format OTP lalu buka modal password baru.
  // Verifikasi OTP sebenarnya dilakukan server saat reset-password.
  const handleVerifyOtpStep = (e) => {
    e?.preventDefault();
    if (!/^[0-9]{4}$/.test(otp.trim())) {
      setErrors({ otp: "OTP harus terdiri dari 4 angka" });
      return;
    }
    setErrors({});
    setNotice(null);
    setShowPasswordModal(true);
  };

  const validatePassword = () => {
    const next = {};
    if (!password) next.password = "Password baru wajib diisi";
    else if (password.length < 8) next.password = "Password minimal 8 karakter";
    if (password !== confirmPassword) next.confirmPassword = "Konfirmasi password tidak sama";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleResetPassword = async (e) => {
    e?.preventDefault();
    if (!validatePassword()) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsapp, otp: otp.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Kode OTP tidak valid");
      }
      setShowPasswordModal(false);
      setPassword("");
      setConfirmPassword("");
      router.replace(ROUTES.login);
    } catch (err) {
      // OTP ditolak server: tutup modal & tampilkan error di kolom OTP
      setShowPasswordModal(false);
      setErrors({ otp: err.message || "Kode OTP tidak valid" });
    } finally {
      setIsSubmitting(false);
    }
  };

  function closePasswordModal() {
    setShowPasswordModal(false);
    setPassword("");
    setConfirmPassword("");
    setErrors({});
  }

  const subtitle = otpSent
    ? "Masukkan 4 digit kode OTP yang dikirim ke WhatsApp Anda."
    : "Jangan khawatir! Masukkan nomor WhatsApp yang terdaftar. Kami akan mengirimkan kode OTP untuk membantu Anda mengatur ulang kata sandi.";

  return (
    <main className="flex min-h-dvh w-full justify-center overflow-x-hidden bg-white text-zinc-900 antialiased">
      <div className="flex w-full min-w-0 max-w-[440px] flex-col px-[clamp(16px,5vw,24px)] pb-10 md:max-w-[480px] md:pb-14">
        {/* HEADER / BACK */}
        <div className="py-4">
          <button
            type="button"
            onClick={() => router.back()}
            className={cx(
              "inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3.5 py-[9px]",
              "text-xs font-semibold text-zinc-600 transition-colors hover:bg-zinc-100",
              focusRing
            )}
          >
            <ArrowLeft size={14} />
            <span>Kembali ke Login</span>
          </button>
        </div>

        {/* INFO */}
        <section className="mb-7 mt-2 flex flex-col items-center">
          <div className="mb-6 flex items-center gap-2">
            <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-zinc-900">
              <Wrench size={16} color="#fff" />
            </div>
            <span className="text-[15px] font-extrabold tracking-[1.5px] text-zinc-900">BENGKELKU</span>
          </div>

          <div className="mb-[22px] flex h-[84px] w-[84px] items-center justify-center rounded-full border border-zinc-200 bg-zinc-100">
            <Lock size={34} color="#18181b" />
          </div>

          <h1 className="mb-2.5 text-center text-[clamp(28px,7vw,34px)] font-black leading-[1.15] text-zinc-700">
            Lupa Kata Sandi?
          </h1>
          <p className="max-w-[340px] break-words text-center text-sm leading-[22px] text-zinc-500">{subtitle}</p>
        </section>

        {/* FORM */}
        <form
          className="my-1 w-full"
          onSubmit={otpSent ? handleVerifyOtpStep : handleRequestOtp}
          noValidate
        >
          {notice ? (
            <div
              role={notice.type === "error" ? "alert" : "status"}
              className={cx(
                "mb-4 break-words rounded-[14px] border px-3.5 py-[11px] text-[13px] leading-[18px]",
                notice.type === "error"
                  ? "border-red-200 bg-red-50 text-red-600"
                  : "border-zinc-200 bg-zinc-100 text-zinc-900"
              )}
            >
              {notice.text}
            </div>
          ) : null}

          <div className="mb-4">
            <label htmlFor="whatsapp" className={labelCls}>
              Nomor WhatsApp
            </label>
            <div className={inputWrap(!!errors.whatsapp, otpSent)}>
              <Phone size={18} className="mr-0.5 shrink-0" />
              <input
                id="whatsapp"
                className={textInput}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="Cth: 081234567890"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                disabled={otpSent}
              />
              {otpSent ? (
                <button
                  type="button"
                  onClick={handleChangeNumber}
                  className={cx("shrink-0 p-1 text-xs font-bold text-zinc-900 underline", focusRing)}
                >
                  Ubah
                </button>
              ) : null}
            </div>
            {errors.whatsapp ? <p className={errorCls}>{errors.whatsapp}</p> : null}
          </div>

          {!otpSent ? (
            <button type="submit" disabled={isSendingOtp} className={primaryBtn}>
              {isSendingOtp ? (
                <span className={btnRow}>
                  <Loader2 size={16} className="animate-spin" />
                  Mengirim OTP...
                </span>
              ) : (
                <span className={btnRow}>
                  Kirim Kode OTP
                  <ArrowRight size={16} />
                </span>
              )}
            </button>
          ) : (
            <>
              <div className="mx-auto mb-[18px] flex w-fit max-w-full items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-100 px-3.5 py-[7px] text-zinc-900">
                <ShieldCheck size={14} className="shrink-0" />
                <span className="min-w-0 truncate text-xs font-semibold">OTP dikirim ke {whatsapp}</span>
              </div>

              <div className="mb-4">
                <span className={cx(labelCls, "text-center")}>Kode OTP</span>
                <OtpBoxInput value={otp} onChange={setOtp} error={!!errors.otp} disabled={isSubmitting} />
                {errors.otp ? <p className={cx(errorCls, "text-center")}>{errors.otp}</p> : null}

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isResending || isSubmitting}
                  className={cx("mt-3.5 flex w-full items-center justify-center p-1 disabled:cursor-default", focusRing)}
                >
                  {isResending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <span className="text-center text-[13px] text-zinc-500">
                      Tidak menerima kode? <span className="font-bold text-zinc-900 underline">Kirim Ulang</span>
                    </span>
                  )}
                </button>
              </div>

              <button type="submit" className={primaryBtn}>
                <span className={btnRow}>
                  Verifikasi
                  <ArrowRight size={16} />
                </span>
              </button>
            </>
          )}

          <div className="my-[22px] h-px bg-zinc-100" />
          <button
            type="button"
            onClick={() => router.replace(ROUTES.login)}
            className={cx("block w-full p-1 text-center text-[13px] text-zinc-500", focusRing)}
          >
            Sudah ingat password? <span className="font-bold text-zinc-900 underline">Login di sini</span>
          </button>
        </form>

        <p className="mt-5 text-center text-[10px] text-zinc-400">
          © {new Date().getFullYear()} BENGKELKU. System Access.
        </p>
      </div>

      {/* MODAL: Buat Password Baru */}
      {showPasswordModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-5"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) closePasswordModal();
          }}
        >
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="pw-title"
            onSubmit={handleResetPassword}
            noValidate
            className="m-auto max-h-full w-full max-w-[420px] overflow-y-auto rounded-[28px] bg-white p-[clamp(20px,5vw,24px)]"
          >
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex w-fit max-w-full items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-100 px-3.5 py-[7px] text-zinc-900">
                <ShieldCheck size={14} className="shrink-0" />
                <span className="min-w-0 truncate text-xs font-semibold">OTP terverifikasi</span>
              </div>
              <button
                type="button"
                onClick={closePasswordModal}
                aria-label="Tutup"
                className={cx("flex shrink-0 p-1 text-zinc-500", focusRing)}
              >
                <X size={20} />
              </button>
            </div>

            <h2 id="pw-title" className="mb-1 text-[22px] font-extrabold text-zinc-900">
              Buat Password Baru
            </h2>
            <p className="mb-5 text-[13px] text-zinc-500">Masukkan password baru Anda.</p>

            <div className="mb-4">
              <label htmlFor="password" className={labelCls}>
                Password baru
              </label>
              <div className={inputWrap(!!errors.password)}>
                <Lock size={18} className="mr-0.5 shrink-0" />
                <input
                  id="password"
                  className={textInput}
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Minimal 8 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  className={cx("flex shrink-0 p-1 text-zinc-500", focusRing)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password ? <p className={errorCls}>{errors.password}</p> : null}
            </div>

            <div className="mb-4">
              <label htmlFor="confirmPassword" className={labelCls}>
                Konfirmasi password
              </label>
              <div className={inputWrap(!!errors.confirmPassword)}>
                <Lock size={18} className="mr-0.5 shrink-0" />
                <input
                  id="confirmPassword"
                  className={textInput}
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Ulangi password baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={showConfirmPassword ? "Sembunyikan password" : "Tampilkan password"}
                  className={cx("flex shrink-0 p-1 text-zinc-500", focusRing)}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword ? <p className={errorCls}>{errors.confirmPassword}</p> : null}
            </div>

            <div className="mt-2 flex gap-2.5">
              <button
                type="button"
                onClick={closePasswordModal}
                disabled={isSubmitting}
                className={cx(
                  "h-[52px] min-w-0 flex-1 rounded-full border border-zinc-300 bg-white text-sm font-semibold",
                  "text-zinc-900 transition-colors hover:bg-zinc-100 disabled:opacity-60",
                  focusRing
                )}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={cx(primaryBtn, "mt-0 h-[52px] min-w-0 flex-1")}
              >
                {isSubmitting ? (
                  <span className={btnRow}>
                    <Loader2 size={16} className="animate-spin" />
                    Menyimpan...
                  </span>
                ) : (
                  <span className={btnRow}>
                    Simpan
                    <ArrowRight size={16} />
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}

// Kotak OTP terpisah per digit: auto-focus, backspace ke kotak sebelumnya,
// panah kiri/kanan, dan paste beberapa digit sekaligus.
function OtpBoxInput({ value, onChange, error, disabled }) {
  const refs = useRef([]);
  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] || "");

  const focusAt = (i) => refs.current[Math.max(0, Math.min(i, OTP_LENGTH - 1))]?.focus();

  const handleChange = (text, index) => {
    const clean = text.replace(/\D/g, "");
    const next = digits.slice();

    if (!clean) {
      next[index] = "";
      onChange(next.join(""));
      return;
    }

    const chunk = clean.slice(0, OTP_LENGTH - index).split("");
    chunk.forEach((d, i) => {
      next[index + i] = d;
    });
    onChange(next.join(""));
    focusAt(index + chunk.length);
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      e.preventDefault();
      const next = digits.slice();
      next[index - 1] = "";
      onChange(next.join(""));
      focusAt(index - 1);
    } else if (e.key === "ArrowLeft") {
      focusAt(index - 1);
    } else if (e.key === "ArrowRight") {
      focusAt(index + 1);
    }
  };

  return (
    <div className="my-1 flex justify-center gap-[clamp(8px,3vw,12px)]">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={digit}
          onChange={(e) => handleChange(e.target.value, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onFocus={(e) => e.target.select()}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`Digit OTP ${i + 1}`}
          disabled={disabled}
          className={cx(
            "h-[60px] w-14 min-w-0 flex-[0_1_56px] rounded-2xl border-[1.5px] p-0 text-center text-[22px] font-bold",
            "text-zinc-900 outline-none transition-colors focus:border-zinc-900 focus:bg-white",
            error
              ? "border-red-600 bg-red-50"
              : cx("bg-zinc-100", digit ? "border-zinc-300" : "border-transparent")
          )}
        />
      ))}
    </div>
  );
}