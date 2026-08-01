const bcrypt = require("bcryptjs");
const db = require("../config/db");

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
