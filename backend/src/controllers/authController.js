const bcrypt = require("bcryptjs");
const db = require("../config/db");
const jwt = require("jsonwebtoken");
const {
  sendWhatsAppNotification,
  normalizeWhatsAppNumber,
} = require("../utils/fonnte");
// Perhatikan: Folder middleware sekarang sudah pakai 's' (middlewares)
const { SECRET_KEY } = require("../middlewares/auth.js");

const otpStore = new Map();
const passwordResetStore = new Map();
const OTP_TTL_MS = 5 * 60 * 1000;

const generateOtp = () => String(Math.floor(1000 + Math.random() * 9000));

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

    const [existingUsers] = await db.query(
      "SELECT * FROM users WHERE whatsapp = ? OR whatsapp = ?",
      [whatsapp, normalizedWhatsapp],
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Nomor WhatsApp sudah terdaftar! Silakan gunakan nomor lain.",
      });
    }

    const otp = generateOtp();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    otpStore.set(normalizedWhatsapp, {
      name,
      password: hashedPassword,
      otp,
      expiresAt: Date.now() + OTP_TTL_MS,
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

    if (Date.now() > pendingData.expiresAt) {
      otpStore.delete(normalizedWhatsapp);
      return res.status(400).json({
        success: false,
        message: "Kode OTP sudah kedaluwarsa. Silakan register ulang.",
      });
    }

    if (String(pendingData.otp) !== String(otp).trim()) {
      return res.status(400).json({
        success: false,
        message: "Kode OTP yang Anda masukkan salah.",
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
// 2. FUNGSI LUPA PASSWORD
// ==========================================
exports.requestPasswordResetOtp = async (req, res, next) => {
  try {
    const normalizedWhatsapp = getNormalizedWhatsapp(req.body.whatsapp);

    if (!normalizedWhatsapp) {
      return res.status(400).json({
        success: false,
        message: "Nomor WhatsApp wajib diisi dengan benar.",
      });
    }

    const [users] = await db.query(
      "SELECT id FROM users WHERE whatsapp = ? OR whatsapp = ?",
      [req.body.whatsapp, normalizedWhatsapp],
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Nomor WhatsApp tidak terdaftar.",
      });
    }

    const otp = generateOtp();
    passwordResetStore.set(normalizedWhatsapp, {
      otp,
      expiresAt: Date.now() + OTP_TTL_MS,
    });

    const sendResult = await sendWhatsAppNotification(
      normalizedWhatsapp,
      `Kode OTP untuk reset password Apex Garage adalah *${otp}*.\n\nKode ini berlaku selama 5 menit.`,
    );

    if (!sendResult?.success) {
      passwordResetStore.delete(normalizedWhatsapp);
      return res.status(500).json({
        success: false,
        message: "Gagal mengirim OTP ke WhatsApp. Silakan coba lagi.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Kode OTP reset password berhasil dikirim ke WhatsApp Anda.",
    });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const normalizedWhatsapp = getNormalizedWhatsapp(req.body.whatsapp);
    const { otp, password } = req.body;
    const pendingReset = passwordResetStore.get(normalizedWhatsapp);

    if (!normalizedWhatsapp || !otp || !password) {
      return res.status(400).json({
        success: false,
        message: "WhatsApp, OTP, dan password baru wajib diisi.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password baru minimal 8 karakter.",
      });
    }

    if (!pendingReset || Date.now() > pendingReset.expiresAt) {
      passwordResetStore.delete(normalizedWhatsapp);
      return res.status(400).json({
        success: false,
        message: "Kode OTP sudah kedaluwarsa. Silakan minta kode baru.",
      });
    }

    if (String(pendingReset.otp) !== String(otp).trim()) {
      return res.status(400).json({
        success: false,
        message: "Kode OTP yang Anda masukkan salah.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));
    await db.query(
      "UPDATE users SET password = ? WHERE whatsapp = ? OR whatsapp = ?",
      [hashedPassword, req.body.whatsapp, normalizedWhatsapp],
    );

    passwordResetStore.delete(normalizedWhatsapp);
    return res.status(200).json({
      success: true,
      message: "Password berhasil diubah. Silakan login kembali.",
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

    // Validasi input wajib
    if (!whatsapp || !password) {
      return res.status(400).json({
        success: false,
        message: "Nomor WhatsApp dan password wajib diisi!",
      });
    }

    // Cari user di database
    const [users] = await db.query("SELECT * FROM users WHERE whatsapp = ?", [
      whatsapp,
    ]);
    if (users.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Nomor WhatsApp tidak terdaftar!" });
    }

    const user = users[0];

    // Cek kecocokan password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(400)
        .json({ success: false, message: "Password salah!" });
    }

    // Generate Token JWT
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        bengkel_id: user.bengkel_id,
      },
      SECRET_KEY,
      { expiresIn: "24h" },
    );

    // Response sukses
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
    // Serahkan error ke Global Error Handler di app.js
    next(error);
  }
};
