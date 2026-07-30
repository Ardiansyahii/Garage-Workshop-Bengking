const express = require("express");
const router = express.Router();
const db = require("../config/db");

// ==========================================
// POST: Pendaftaran Mitra Bengkel Baru
// ==========================================
router.post("/", async (req, res) => {
  try {
    const { owner_name, whatsapp, password, bengkel_name, address, phone } =
      req.body;

    // 1. Validasi Input (Pastikan tidak ada yang kosong)
    if (
      !owner_name ||
      !whatsapp ||
      !password ||
      !bengkel_name ||
      !address ||
      !phone
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Semua kolom wajib diisi!" });
    }

    // 2. Cek apakah nomor WA sudah dipakai oleh akun lain
    const [existingUser] = await db.query(
      "SELECT id FROM users WHERE whatsapp = ?",
      [whatsapp],
    );
    if (existingUser.length > 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Nomor WhatsApp sudah terdaftar! Gunakan nomor lain.",
        });
    }

    // 3. Eksekusi 1: Masukkan data bengkel baru ke database
    const [bengkelResult] = await db.query(
      "INSERT INTO bengkels (name, address, phone) VALUES (?, ?, ?)",
      [bengkel_name, address, phone],
    );

    // Ambil ID bengkel yang baru saja dibuat oleh database
    const newBengkelId = bengkelResult.insertId;

    // 4. Eksekusi 2: Buat akun Admin Bengkel dan kaitkan dengan ID bengkel di atas
    await db.query(
      "INSERT INTO users (name, whatsapp, password, role, bengkel_id) VALUES (?, ?, ?, 'admin_bengkel', ?)",
      [owner_name, whatsapp, password, newBengkelId],
    );

    return res
      .status(201)
      .json({
        success: true,
        message: "Pendaftaran Mitra Berhasil! Silakan login.",
      });
  } catch (error) {
    console.error("Error Register Mitra:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Terjadi kesalahan pada server saat mendaftar.",
      });
  }
});

module.exports = router;
