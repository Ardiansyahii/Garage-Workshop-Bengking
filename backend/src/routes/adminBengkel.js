const express = require("express");
const router = express.Router();
const db = require("../config/db");

// ==========================================
// 1. GET: Ambil Semua Admin Bengkel
// ==========================================
router.get("/", async (req, res) => {
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
    console.error("Error GET Admin Bengkel:", error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal mengambil data admin bengkel." });
  }
});

// ==========================================
// 2. POST: Tambah Admin Bengkel Baru
// ==========================================
router.post("/", async (req, res) => {
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

    await db.query(
      "INSERT INTO users (name, whatsapp, password, role, bengkel_id) VALUES (?, ?, ?, 'admin_bengkel', ?)",
      [name, whatsapp, password, bengkel_id],
    );

    return res
      .status(201)
      .json({ success: true, message: "Akun Admin Bengkel berhasil dibuat!" });
  } catch (error) {
    console.error("Error POST Admin Bengkel:", error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal membuat akun." });
  }
});

// ==========================================
// 3. PUT: Edit Admin Bengkel
// ==========================================
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, whatsapp, password, bengkel_id } = req.body;

    // Jika password diisi, ikut di-update. Jika kosong, biarkan password lama.
    if (password) {
      await db.query(
        "UPDATE users SET name = ?, whatsapp = ?, password = ?, bengkel_id = ? WHERE id = ? AND role = 'admin_bengkel'",
        [name, whatsapp, password, bengkel_id, id],
      );
    } else {
      await db.query(
        "UPDATE users SET name = ?, whatsapp = ?, bengkel_id = ? WHERE id = ? AND role = 'admin_bengkel'",
        [name, whatsapp, bengkel_id, id],
      );
    }

    return res
      .status(200)
      .json({
        success: true,
        message: "Data Admin Bengkel berhasil diupdate!",
      });
  } catch (error) {
    console.error("Error PUT Admin Bengkel:", error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal mengupdate data." });
  }
});

// ==========================================
// 4. DELETE: Hapus Admin Bengkel
// ==========================================
router.delete("/:id", async (req, res) => {
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
    console.error("Error DELETE Admin Bengkel:", error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal menghapus akun." });
  }
});

module.exports = router;
