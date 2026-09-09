const bcrypt = require("bcryptjs");
const db = require("../config/db");
const {
  sendWhatsAppNotification,
  normalizeWhatsAppNumber,
} = require("../utils/fonnte");
const { signToken } = require("../middlewares/auth");
const {
  hashPassword,
  generateOtp,
  validatePassword,
} = require("../utils/helpers");

const otpStore = new Map();
const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const OTP_LOCKOUT_MS = 15 * 60 * 1000;

const getNormalizedWhatsapp = (value) => {
  if (!value) return null;
  const normalized = normalizeWhatsAppNumber(value);
  return normalized || null;
};

// ==========================================
// 1. FUNGSI REGISTER
// ==========================================
exports.register = async (req, res, next) => {
  try {
    const { name, whatsapp, password } = req.body;
    const normalizedWhatsapp = getNormalizedWhatsapp(whatsapp);

    if (!name || !normalizedWhatsapp || !password) {
      return res.status(400).json({
        success: false,
        message: "Nama, Nomor WhatsApp, dan Password wajib diisi!",
      });
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({
        success: false,
        message: passwordCheck.message,
      });
    }

    const [existingUsers] = await db.query(
      "SELECT id FROM users WHERE whatsapp = ? OR whatsapp = ?",
      [whatsapp, normalizedWhatsapp],
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Nomor WhatsApp sudah terdaftar! Silakan gunakan nomor lain.",
      });
    }

    const otp = generateOtp();
    const hashedPassword = await hashPassword(password);

    otpStore.set(normalizedWhatsapp, {
      name,
      password: hashedPassword,
      otp,
      expiresAt: Date.now() + OTP_TTL_MS,
      attempts: 0,
      lockedUntil: null,
    });

    const sendResult = await sendWhatsAppNotification(
      normalizedWhatsapp,
      `Kode OTP Anda untuk verifikasi akun Apex Garage adalah *${otp}*.\n\nKode ini berlaku selama 5 menit.`,
    );

    if (!sendResult || !sendResult.success) {
      otpStore.delete(normalizedWhatsapp);
      return res.status(500).json({
        success: false,
        message:
          "Gagal mengirim OTP ke WhatsApp. Silakan coba lagi beberapa saat lagi.",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Kode OTP berhasil dikirim ke WhatsApp Anda.",
      whatsapp: normalizedWhatsapp,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. FUNGSI VERIFY OTP
// ==========================================
exports.verifyOtp = async (req, res, next) => {
  try {
    const { whatsapp, otp } = req.body;
    const normalizedWhatsapp = getNormalizedWhatsapp(whatsapp);

    if (!normalizedWhatsapp || !otp) {
      return res.status(400).json({
        success: false,
        message: "Nomor WhatsApp dan kode OTP wajib diisi!",
      });
    }

    const pendingData = otpStore.get(normalizedWhatsapp);

    if (!pendingData) {
      return res.status(400).json({
        success: false,
        message:
          "Kode OTP tidak valid atau sudah kedaluwarsa. Silakan register ulang.",
      });
    }

    if (pendingData.lockedUntil && Date.now() < pendingData.lockedUntil) {
      const remainingSec = Math.ceil(
        (pendingData.lockedUntil - Date.now()) / 1000,
      );
      return res.status(429).json({
        success: false,
        message: `Terlalu banyak percobaan gagal. Coba lagi dalam ${remainingSec} detik.`,
      });
    }

    if (Date.now() > pendingData.expiresAt) {
      otpStore.delete(normalizedWhatsapp);
      return res.status(400).json({
        success: false,
        message: "Kode OTP sudah kedaluwarsa. Silakan register ulang.",
      });
    }

    if (String(pendingData.otp) !== String(otp).trim()) {
      pendingData.attempts = (pendingData.attempts || 0) + 1;

      if (pendingData.attempts >= MAX_OTP_ATTEMPTS) {
        pendingData.lockedUntil = Date.now() + OTP_LOCKOUT_MS;
        pendingData.attempts = 0;
        otpStore.set(normalizedWhatsapp, pendingData);
        return res.status(429).json({
          success: false,
          message:
            "Terlalu banyak percobaan gagal. Akun dikunci selama 15 menit.",
        });
      }

      otpStore.set(normalizedWhatsapp, pendingData);
      return res.status(400).json({
        success: false,
        message: `Kode OTP yang Anda masukkan salah. Sisa percobaan: ${MAX_OTP_ATTEMPTS - pendingData.attempts}`,
      });
    }

    await db.query(
      "INSERT INTO users (name, whatsapp, password, role) VALUES (?, ?, ?, 'pelanggan')",
      [pendingData.name, normalizedWhatsapp, pendingData.password],
    );

    otpStore.delete(normalizedWhatsapp);

    return res.status(200).json({
      success: true,
      message: "Verifikasi berhasil! Akun Anda sudah aktif.",
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. FUNGSI LOGIN
// ==========================================
exports.login = async (req, res, next) => {
  try {
    const { whatsapp, password } = req.body;

    if (!whatsapp || !password) {
      return res.status(400).json({
        success: false,
        message: "Nomor WhatsApp dan password wajib diisi!",
      });
    }

    const [users] = await db.query(
      "SELECT id, name, whatsapp, password, role, bengkel_id FROM users WHERE whatsapp = ?",
      [whatsapp],
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Nomor WhatsApp atau password salah!",
      });
    }

    const user = users[0];

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Nomor WhatsApp atau password salah!",
      });
    }

    const token = signToken({
      id: user.id,
      role: user.role,
      bengkel_id: user.bengkel_id,
    });

    return res.status(200).json({
      success: true,
      message: `Login berhasil sebagai ${user.role}!`,
      role: user.role,
      token: token,
      user: {
        id: user.id,
        name: user.name,
        whatsapp: user.whatsapp,
        role: user.role,
        bengkel_id: user.bengkel_id,
      },
    });
  } catch (error) {
    next(error);
  }
};
