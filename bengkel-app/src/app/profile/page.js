'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import CustomerNavbar from '../../components/CustomerNavbar';
import { LogOut, User, Phone, Lock, Edit3, X, Eye, EyeOff, Check, ShieldCheck } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const OTP_LENGTH = 4;

const getToken = () => localStorage.getItem('auth_token') || localStorage.getItem('token');

const getInitials = (name) => {
  if (!name) return '?';
  const p = name.trim().split(' ');
  return (p.length > 1 ? p[0][0] + p[1][0] : p[0].slice(0, 2)).toUpperCase();
};

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// Class yang dipakai berulang
const cx = {
  badge: 'inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-100 px-3.5 py-[7px] text-xs font-semibold',
  label: 'mb-2 block text-[13px] font-semibold text-zinc-700',
  inputBase: 'flex min-h-[54px] items-center gap-2 rounded-2xl border-[1.5px] px-4',
  inputOk: 'border-transparent bg-zinc-100 text-zinc-400 focus-within:border-zinc-900 focus-within:bg-white focus-within:text-zinc-900',
  inputErr: 'border-red-600 bg-red-50 text-zinc-400',
  btn: 'flex h-[52px] items-center justify-center gap-2 rounded-full text-sm font-semibold transition disabled:cursor-not-allowed',
  spinner: 'h-[18px] w-[18px] animate-spin rounded-full border-2 border-white/40 border-t-white',
};

// ---------------------------------------------------------------
// Sub components
// ---------------------------------------------------------------
function Field({ label, icon, error, right, ...inputProps }) {
  return (
    <div className="mb-4">
      <label className={cx.label}>{label}</label>
      <div className={`${cx.inputBase} ${error ? cx.inputErr : cx.inputOk}`}>
        {icon}
        <input className="min-w-0 flex-1 bg-transparent py-3.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400" {...inputProps} />
        {right}
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function InfoField({ label, icon, value }) {
  return (
    <div className="mb-4">
      <span className={cx.label}>{label}</span>
      <div className={`${cx.inputBase} ${cx.inputOk} border-transparent`}>
        {icon}
        <span className="flex-1 text-sm font-semibold text-zinc-900">{value}</span>
      </div>
    </div>
  );
}

function EyeButton({ visible, onClick }) {
  return (
    <button type="button" onClick={onClick} aria-label="Tampilkan password" className="text-zinc-500">
      {visible ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  );
}

function Modal({ title, onClose, disabled, children }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-5" onClick={() => !disabled && onClose()}>
      <div className="max-h-[90vh] w-full max-w-[420px] overflow-y-auto rounded-[28px] bg-white p-7" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[22px] font-extrabold">{title}</h2>
          <button onClick={onClose} disabled={disabled} aria-label="Tutup" className="text-zinc-500">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function OtpInput({ value, onChange, error, disabled }) {
  const refs = useRef([]);
  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] || '');

  const handleChange = (i, text) => {
    const clean = text.replace(/\D/g, '');
    const next = [...digits];
    if (!clean) {
      next[i] = '';
      onChange(next.join(''));
      return;
    }
    clean.slice(0, OTP_LENGTH - i).split('').forEach((d, k) => (next[i + k] = d)); // juga menangani paste
    onChange(next.join(''));
    refs.current[Math.min(i + clean.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleKeyDown = (e, i) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  };

  return (
    <div className="flex justify-center gap-3">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          value={d}
          inputMode="numeric"
          autoFocus={i === 0}
          disabled={disabled}
          onFocus={(e) => e.target.select()}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          className={`h-[60px] w-14 rounded-2xl border-[1.5px] text-center text-[22px] font-bold text-zinc-900 outline-none ${
            error ? 'border-red-600 bg-red-50' : 'border-transparent bg-zinc-100 focus:border-zinc-900 focus:bg-white'
          }`}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------
// Page
// ---------------------------------------------------------------
export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [editOpen, setEditOpen] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  const [pending, setPending] = useState({ name: false, password: false });
  const [form, setForm] = useState({ name: '', password: '', confirm: '', otp: '' });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  };

  // Load user: localStorage dulu, lalu refresh dari API
  useEffect(() => {
    (async () => {
      try {
        const stored = localStorage.getItem('user');
        if (stored) setUser(JSON.parse(stored));

        const token = getToken();
        if (token) {
          const res = await fetch(`${API_BASE_URL}/users/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (res.ok && data?.success && data?.user) {
            setUser(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
          }
        }
      } catch (err) {
        console.warn('Gagal memuat profile dari API, menggunakan data lokal:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ---------- Edit profile ----------
  const openEdit = () => {
    setForm({ name: user?.name || '', password: '', confirm: '', otp: '' });
    setErrors({});
    setEditOpen(true);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Username wajib diisi';
    if (form.name.trim() === user?.name && !form.password) e.name = 'Masukkan username atau password baru';
    if (form.password) {
      if (form.password.length < 8) e.password = 'Password minimal 8 karakter';
      if (form.password !== form.confirm) e.confirm = 'Konfirmasi password tidak sama';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const requestOtp = async () => {
    const res = await fetch(`${API_BASE_URL}/users/profile/request-update-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({
        name: form.name.trim() !== user?.name ? form.name.trim() : undefined,
        password: form.password || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data?.success) throw new Error(data?.message || 'Gagal mengirim OTP');
  };

  const handleSubmitEdit = async () => {
    if (!validate()) return;
    try {
      setSaving(true);
      setPending({ name: form.name.trim() !== user.name, password: !!form.password });
      await requestOtp();
      setForm((f) => ({ ...f, otp: '' }));
      setErrors({});
      setEditOpen(false);
      setOtpOpen(true);
      showToast('OTP sudah dikirim ke WhatsApp Anda');
    } catch (err) {
      showToast(err.message || 'Terjadi kesalahan, silakan coba lagi', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ---------- Verifikasi OTP ----------
  const closeOtp = () => {
    setOtpOpen(false);
    setForm((f) => ({ ...f, otp: '' }));
    setErrors({});
  };

  const handleResend = async () => {
    try {
      setResending(true);
      await requestOtp();
      setForm((f) => ({ ...f, otp: '' }));
      showToast('OTP baru sudah dikirim');
    } catch (err) {
      showToast(err.message || 'Gagal mengirim ulang OTP', 'error');
    } finally {
      setResending(false);
    }
  };

  const handleVerify = async () => {
    if (!/^[0-9]{4}$/.test(form.otp.trim())) {
      setErrors({ otp: 'OTP harus terdiri dari 4 angka' });
      return;
    }
    try {
      setVerifying(true);
      const res = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ otp: form.otp.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Kode OTP tidak valid');

      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      closeOtp();
      showToast('Profile berhasil diperbarui');
    } catch (err) {
      setErrors({ otp: err.message || 'Kode OTP tidak valid' });
      showToast(err.message || 'Terjadi kesalahan, silakan coba lagi', 'error');
    } finally {
      setVerifying(false);
    }
  };

  // Auto-verify begitu 4 digit terisi
  useEffect(() => {
    if (otpOpen && form.otp.length === OTP_LENGTH && !verifying && !resending) handleVerify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.otp, otpOpen]);

  // ---------- Logout ----------
  const handleLogout = () => {
    if (!window.confirm('Apakah Anda yakin ingin keluar dari akun?')) return;
    ['token', 'auth_token', 'user', 'user_session'].forEach((k) => localStorage.removeItem(k));
    document.cookie = 'user_role=; path=/; max-age=0';
    router.replace('/');
  };

  const pendingLabel =
    pending.name && pending.password ? 'Username & Password' : pending.name ? 'Username' : pending.password ? 'Password' : null;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-zinc-200 border-t-zinc-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <CustomerNavbar user={user} activePage="profile" />

      <main className="mx-auto max-w-4xl px-6 pb-6 pt-10">
        <h1 className="mb-6 text-[28px] font-black">Profil</h1>

        <div className="grid items-start gap-6 md:grid-cols-[300px_1fr]">
          {/* Kartu kiri: avatar */}
          <section className="flex flex-col items-center rounded-3xl border border-zinc-200 bg-white p-6 text-center md:p-8">
            <div className="mb-4 grid h-24 w-24 place-items-center rounded-full border border-zinc-200 bg-zinc-100 text-3xl font-extrabold">
              {getInitials(user?.name)}
            </div>
            <h2 className="mb-2.5 break-words text-[22px] font-black text-zinc-700">{user?.name || '-'}</h2>
            <span className={cx.badge}>
              <ShieldCheck size={14} />
              {user?.role ? capitalize(user.role) : '-'} · Apex Garage
            </span>
            <button onClick={handleLogout} className={`${cx.btn} mt-6 w-full border border-zinc-300 bg-white text-red-600 hover:bg-red-50`}>
              <LogOut size={16} /> Keluar
            </button>
          </section>

          {/* Kartu kanan: informasi akun */}
          <section className="rounded-3xl border border-zinc-200 bg-white p-6 md:p-8">
            <h3 className="mb-5 text-lg font-extrabold">Informasi Akun</h3>
            <InfoField label="Nomor WhatsApp" icon={<Phone size={18} />} value={user?.whatsapp || '-'} />
            <InfoField label="Password" icon={<Lock size={18} />} value="••••••••" />
            <button onClick={openEdit} className={`${cx.btn} mt-2 w-full bg-zinc-900 text-white hover:bg-zinc-700`}>
              <Edit3 size={16} /> Edit Profil
            </button>
          </section>
        </div>

        <p className="mt-8 text-center text-[11px] text-zinc-400">© {new Date().getFullYear()} APEX GARAGE. System Access.</p>
      </main>

      {/* Modal 1: edit profil */}
      {editOpen && (
        <Modal title="Edit Profil" onClose={() => setEditOpen(false)} disabled={saving}>
          <Field
            label="Username"
            icon={<User size={18} />}
            value={form.name}
            onChange={setField('name')}
            placeholder="Nama lengkap"
            error={errors.name}
          />
          <Field
            label="Password Baru (opsional)"
            icon={<Lock size={18} />}
            type={showPw ? 'text' : 'password'}
            value={form.password}
            onChange={setField('password')}
            placeholder="Kosongkan jika tidak diubah"
            error={errors.password}
            right={<EyeButton visible={showPw} onClick={() => setShowPw((v) => !v)} />}
          />
          {form.password && (
            <Field
              label="Konfirmasi Password"
              icon={<Lock size={18} />}
              type={showConfirm ? 'text' : 'password'}
              value={form.confirm}
              onChange={setField('confirm')}
              placeholder="Ulangi password baru"
              error={errors.confirm}
              right={<EyeButton visible={showConfirm} onClick={() => setShowConfirm((v) => !v)} />}
            />
          )}
          <div className="mt-2 flex gap-2.5">
            <button onClick={() => setEditOpen(false)} disabled={saving} className={`${cx.btn} flex-1 border border-zinc-300 bg-white`}>
              Batal
            </button>
            <button onClick={handleSubmitEdit} disabled={saving} className={`${cx.btn} flex-1 bg-zinc-900 text-white enabled:hover:bg-zinc-700 disabled:bg-zinc-400`}>
              {saving ? <span className={cx.spinner} /> : <><Check size={16} /> Kirim OTP</>}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal 2: verifikasi OTP */}
      {otpOpen && (
        <Modal title="Verifikasi OTP" onClose={closeOtp} disabled={verifying || resending}>
          {pendingLabel && (
            <span className={`${cx.badge} mb-3`}>
              <Edit3 size={13} /> Sedang mengganti {pendingLabel}
            </span>
          )}
          <p className="mb-[18px] text-[13px] leading-relaxed text-zinc-500">
            Masukkan 4 digit kode OTP yang sudah dikirim ke WhatsApp {user?.whatsapp || 'Anda'}.
          </p>
          <OtpInput value={form.otp} onChange={(v) => setForm((f) => ({ ...f, otp: v }))} error={!!errors.otp} disabled={verifying} />
          {errors.otp && <p className="mt-1.5 text-center text-xs text-red-600">{errors.otp}</p>}

          <button onClick={handleResend} disabled={resending || verifying} className="mx-auto mb-2 mt-3.5 flex items-center text-[13px] text-zinc-500">
            {resending ? (
              <span className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
            ) : (
              <>Tidak menerima kode?&nbsp;<b className="text-zinc-900 underline">Kirim Ulang</b></>
            )}
          </button>

          <div className="mt-2 flex gap-2.5">
            <button onClick={closeOtp} disabled={verifying || resending} className={`${cx.btn} flex-1 border border-zinc-300 bg-white`}>
              Batal
            </button>
            <button onClick={handleVerify} disabled={verifying || resending} className={`${cx.btn} flex-1 bg-zinc-900 text-white enabled:hover:bg-zinc-700 disabled:bg-zinc-400`}>
              {verifying ? <span className={cx.spinner} /> : <><Check size={16} /> Verifikasi</>}
            </button>
          </div>
        </Modal>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-8 left-1/2 z-[60] -translate-x-1/2 rounded-2xl border px-5 py-3.5 text-[13.5px] font-semibold shadow-lg ${
            toast.type === 'error' ? 'border-red-600 bg-red-50 text-red-600' : 'border-zinc-300 bg-white'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
