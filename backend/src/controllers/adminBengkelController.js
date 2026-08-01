const bcrypt = require("bcryptjs");
const db = require("../config/db");

// ==========================================
// 1. GET: Ambil Semua Admin Bengkel
// ==========================================
exports.getAllAdminBengkels = async (req, res, next) => {
  try {
    const [admins] = await db.query(`
      SELECT u.id, u.name, u.whatsapp, u.bengkel_id, b.name AS bengkel_name 
      FROM users u 
      LEFT JOIN bengkels b ON u.bengkel_id = b.id 
      WHERE u.role = 'admin_bengkel'
      ORDER BY u.created_at DESC
    `);
    return res.status(200).json({ success: true, data: admins });
  } catch (error) {
    next(error); // Lempar ke Global Error Handler
  }
};

// ==========================================
// 2. POST: Tambah Admin Bengkel Baru
// ==========================================
exports.createAdminBengkel = async (req, res, next) => {
  try {
    const { name, whatsapp, password, bengkel_id } = req.body;

    if (!name || !whatsapp || !password || !bengkel_id) {
      return res
        .status(400)
        .json({ success: false, message: "Semua data wajib diisi!" });
    }

    // Cek apakah nomor WA sudah dipakai
    const [existing] = await db.query(
      "SELECT id FROM users WHERE whatsapp = ?",
      [whatsapp],
    );
    if (existing.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Nomor WhatsApp sudah terdaftar!" });
    }

    // Best Practice: Hash password sebelum disimpan ke database
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await db.query(
      "INSERT INTO users (name, whatsapp, password, role, bengkel_id) VALUES (?, ?, ?, 'admin_bengkel', ?)",
      [name, whatsapp, hashedPassword, bengkel_id],
    );

    return res
      .status(201)
      .json({ success: true, message: "Akun Admin Bengkel berhasil dibuat!" });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. PUT: Edit Admin Bengkel
// ==========================================
exports.updateAdminBengkel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, whatsapp, password, bengkel_id } = req.body;

    // Jika password diisi, hash password baru. Jika kosong, biarkan password lama.
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      await db.query(
        "UPDATE users SET name = ?, whatsapp = ?, password = ?, bengkel_id = ? WHERE id = ? AND role = 'admin_bengkel'",
        [name, whatsapp, hashedPassword, bengkel_id, id],
      );
    } else {
      await db.query(
        "UPDATE users SET name = ?, whatsapp = ?, bengkel_id = ? WHERE id = ? AND role = 'admin_bengkel'",
        [name, whatsapp, bengkel_id, id],
      );
    }

    return res.status(200).json({
      success: true,
      message: "Data Admin Bengkel berhasil diupdate!",
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 4. DELETE: Hapus Admin Bengkel
// ==========================================
exports.deleteAdminBengkel = async (req, res, next) => {
  try {
    const { id } = req.params;
    await db.query(
      "DELETE FROM users WHERE id = ? AND role = 'admin_bengkel'",
      [id],
    );
    return res
      .status(200)
      .json({ success: true, message: "Akun Admin Bengkel berhasil dihapus!" });
  } catch (error) {
    next(error);
  }
};
