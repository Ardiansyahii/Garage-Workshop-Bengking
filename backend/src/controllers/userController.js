const bcrypt = require("bcryptjs");
const db = require("../config/db");
const {
  normalizeWhatsAppNumber,
  sendWhatsAppNotification,
} = require("../utils/fonnte");

const profileOtpStore = new Map();
const PROFILE_OTP_TTL_MS = 5 * 60 * 1000;
const generateOtp = () => String(Math.floor(1000 + Math.random() * 9000));

// ==========================================
// 1. GET: Ambil Semua Data Pelanggan
// ==========================================
exports.getAllUsers = async (req, res, next) => {
  try {
    // Kita hanya mengambil user yang role-nya 'pelanggan'
    const [users] = await db.query(
      "SELECT id, name, whatsapp, created_at FROM users WHERE role = 'pelanggan' ORDER BY created_at DESC",
    );

    return res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error); // Lempar ke Global Error Handler
  }
};

// ==========================================
// 2. POST: Tambah Pelanggan Baru (Dari Web)
// ==========================================
exports.createUser = async (req, res, next) => {
  try {
    const { name, whatsapp, password } = req.body;

    if (!name || !whatsapp || !password) {
      return res.status(400).json({
        success: false,
        message: "Nama, WhatsApp, dan Password wajib diisi!",
      });
    }

    // Cek apakah WhatsApp sudah terdaftar
    const [existing] = await db.query(
      "SELECT * FROM users WHERE whatsapp = ?",
      [whatsapp],
    );
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Nomor WhatsApp sudah terdaftar!",
      });
    }

    // Hash Password sebelum disimpan
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await db.query(
      "INSERT INTO users (name, whatsapp, password, role) VALUES (?, ?, ?, 'pelanggan')",
      [name, whatsapp, hashedPassword],
    );

    return res.status(201).json({
      success: true,
      message: "Pelanggan berhasil ditambahkan!",
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. DELETE: Hapus Pelanggan
// ==========================================
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID Pelanggan tidak valid!",
      });
    }

    await db.query("DELETE FROM users WHERE id = ?", [id]);

    return res.status(200).json({
      success: true,
      message: "Pelanggan berhasil dihapus!",
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 4. GET /api/users/profile
// Ambil data user yang SEDANG LOGIN (dari req.user.id hasil verifyToken)
// ==========================================
exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [users] = await db.query(
      "SELECT id, name, whatsapp, role, bengkel_id FROM users WHERE id = ?",
      [userId],
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "User tidak ditemukan" });
    }

    return res.status(200).json({ success: true, user: users[0] });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 5. POST /api/users/profile/request-update-otp
// ==========================================
exports.requestProfileUpdateOtp = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, password } = req.body;

    if ((!name || !name.trim()) && !password) {
      return res.status(400).json({
        success: false,
        message: "Username atau password baru wajib diisi",
      });
    }

    if (password && password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password baru minimal 8 karakter",
      });
    }

    const [users] = await db.query(
      "SELECT whatsapp FROM users WHERE id = ?",
      [userId],
    );
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "User tidak ditemukan" });
    }

    const otp = generateOtp();
    profileOtpStore.set(userId, {
      name: name?.trim() || null,
      password: password || null,
      otp,
      expiresAt: Date.now() + PROFILE_OTP_TTL_MS,
    });

    const sendResult = await sendWhatsAppNotification(
      normalizeWhatsAppNumber(users[0].whatsapp),
      `Kode OTP perubahan profil Apex Garage adalah *${otp}*.\n\nKode ini berlaku selama 5 menit.`,
    );

    if (!sendResult?.success) {
      profileOtpStore.delete(userId);
      return res.status(500).json({
        success: false,
        message: "Gagal mengirim OTP ke WhatsApp. Silakan coba lagi.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Kode OTP berhasil dikirim ke WhatsApp Anda.",
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 6. PUT /api/users/profile
// Simpan username dan/atau password setelah OTP benar.
// ==========================================
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { otp } = req.body;
    const pendingUpdate = profileOtpStore.get(userId);

    if (!pendingUpdate || !otp) {
      return res.status(400).json({
        success: false,
        message: "Kode OTP wajib diisi. Silakan minta kode OTP terlebih dahulu.",
      });
    }

    if (Date.now() > pendingUpdate.expiresAt) {
      profileOtpStore.delete(userId);
      return res.status(400).json({
        success: false,
        message: "Kode OTP sudah kedaluwarsa. Silakan minta kode baru.",
      });
    }

    if (String(pendingUpdate.otp) !== String(otp).trim()) {
      return res.status(400).json({
        success: false,
        message: "Kode OTP yang Anda masukkan salah.",
      });
    }

    const fields = [];
    const values = [];
    if (pendingUpdate.name) {
      fields.push("name = ?");
      values.push(pendingUpdate.name);
    }

    if (pendingUpdate.password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(pendingUpdate.password, salt);
      fields.push("password = ?");
      values.push(hashedPassword);
    }

    values.push(userId);

    await db.query(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, values);
    profileOtpStore.delete(userId);

    const [updatedUsers] = await db.query(
      "SELECT id, name, whatsapp, role, bengkel_id FROM users WHERE id = ?",
      [userId],
    );

    return res.status(200).json({
      success: true,
      message: "Profile berhasil diperbarui",
      user: updatedUsers[0],
    });
  } catch (error) {
    next(error);
  }
};