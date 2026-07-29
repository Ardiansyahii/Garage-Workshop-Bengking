const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const db = require("../config/db");

// ==========================================
// 1. GET: Ambil Semua Data Pelanggan
// ==========================================
router.get("/", async (req, res) => {
  try {
    // Kita hanya mengambil user yang role-nya 'pelanggan'
    const [users] = await db.query(
      "SELECT id, name, whatsapp, created_at FROM users WHERE role = 'pelanggan' ORDER BY created_at DESC",
    );

    return res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error("Error GET Users:", error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal mengambil data pelanggan." });
  }
});

// ==========================================
// 2. POST: Tambah Pelanggan Baru (Dari Web)
// ==========================================
router.post("/", async (req, res) => {
  try {
    const { name, whatsapp, password } = req.body;

    if (!name || !whatsapp || !password) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Nama, WhatsApp, dan Password wajib diisi!",
        });
    }

    const [existing] = await db.query(
      "SELECT * FROM users WHERE whatsapp = ?",
      [whatsapp],
    );
    if (existing.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Nomor WhatsApp sudah terdaftar!" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await db.query(
      "INSERT INTO users (name, whatsapp, password, role) VALUES (?, ?, ?, 'pelanggan')",
      [name, whatsapp, hashedPassword],
    );

    return res
      .status(201)
      .json({ success: true, message: "Pelanggan berhasil ditambahkan!" });
  } catch (error) {
    console.error("Error POST Users:", error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal menambah pelanggan." });
  }
});

// ==========================================
// 3. DELETE: Hapus Pelanggan
// ==========================================
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "ID Pelanggan tidak valid!" });
    }

    await db.query("DELETE FROM users WHERE id = ?", [id]);

    return res
      .status(200)
      .json({ success: true, message: "Pelanggan berhasil dihapus!" });
  } catch (error) {
    console.error("Error DELETE Users:", error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal menghapus pelanggan." });
  }
});

module.exports = router;
