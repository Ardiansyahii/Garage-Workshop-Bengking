const bcrypt = require("bcryptjs");
const db = require("../config/db");
const { normalizeWhatsAppNumber } = require("../utils/fonnte");

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
// 4. Helper: cek apakah kolom `email` ada di tabel users
// (agar tidak error jika database belum punya kolom email)
// ==========================================
let emailColumnCache = null;
const hasEmailColumn = async () => {
  if (emailColumnCache !== null) return emailColumnCache;
  try {
    const [rows] = await db.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email'`,
    );
    emailColumnCache = rows.length > 0;
  } catch (err) {
    emailColumnCache = false;
  }
  return emailColumnCache;
};

// ==========================================
// 5. GET /api/users/profile
// Ambil data user yang SEDANG LOGIN (dari req.user.id hasil verifyToken)
// ==========================================
exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const emailExists = await hasEmailColumn();

    const columns = emailExists
      ? "id, name, whatsapp, email, role, bengkel_id"
      : "id, name, whatsapp, role, bengkel_id";

    const [users] = await db.query(
      `SELECT ${columns} FROM users WHERE id = ?`,
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
// 6. PUT /api/users/profile
// Update profile milik sendiri saja (name, whatsapp, email opsional, password opsional).
// Password baru di-hash dengan bcrypt sebelum disimpan.
// ==========================================
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, whatsapp, email, password } = req.body;

    // ---- Validasi nama ----
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Nama wajib diisi" });
    }

    // ---- Validasi & normalisasi whatsapp ----
    const normalizedWhatsapp = normalizeWhatsAppNumber(whatsapp);
    if (!normalizedWhatsapp) {
      return res.status(400).json({ success: false, message: "Nomor WhatsApp tidak valid" });
    }

    const [existing] = await db.query(
      "SELECT id FROM users WHERE whatsapp = ? AND id != ?",
      [normalizedWhatsapp, userId],
    );
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Nomor WhatsApp sudah digunakan oleh user lain",
      });
    }

    // ---- Validasi email (opsional, hanya jika kolom tersedia di DB) ----
    const emailExists = await hasEmailColumn();
    if (email && emailExists) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: "Format email tidak valid" });
      }
    }

    // ---- Validasi password baru (opsional) ----
    if (password && password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password baru minimal 8 karakter",
      });
    }

    // ---- Bangun query UPDATE secara dinamis, hanya field yang diizinkan ----
    const fields = ["name = ?", "whatsapp = ?"];
    const values = [name.trim(), normalizedWhatsapp];

    if (email && emailExists) {
      fields.push("email = ?");
      values.push(email.trim());
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      fields.push("password = ?");
      values.push(hashedPassword);
    }

    values.push(userId);

    await db.query(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, values);

    const columns = emailExists
      ? "id, name, whatsapp, email, role, bengkel_id"
      : "id, name, whatsapp, role, bengkel_id";
    const [updatedUsers] = await db.query(
      `SELECT ${columns} FROM users WHERE id = ?`,
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