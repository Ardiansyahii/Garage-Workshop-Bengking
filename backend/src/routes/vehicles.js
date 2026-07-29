const express = require("express");
const router = express.Router();
const db = require("../config/db");

// ==========================================
// 1. GET: Ambil Kendaraan Milik Pelanggan
// Menggunakan query user_id (Contoh: /api/vehicles?user_id=3)
// ==========================================
router.get("/", async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res
        .status(400)
        .json({
          success: false,
          message: "ID Pelanggan (user_id) wajib disertakan!",
        });
    }

    const [vehicles] = await db.query(
      "SELECT * FROM vehicles WHERE user_id = ? ORDER BY created_at DESC",
      [user_id],
    );

    return res.status(200).json({ success: true, data: vehicles });
  } catch (error) {
    console.error("Error GET Vehicles:", error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal mengambil data kendaraan." });
  }
});

// ==========================================
// 2. POST: Tambah Kendaraan Baru
// ==========================================
router.post("/", async (req, res) => {
  try {
    const { user_id, vehicle_name, license_plate } = req.body;

    // Validasi input wajib sesuai syarat ujian
    if (!user_id || !vehicle_name || !license_plate) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Data pelanggan, nama kendaraan, dan plat nomor wajib diisi!",
        });
    }

    await db.query(
      "INSERT INTO vehicles (user_id, vehicle_name, license_plate) VALUES (?, ?, ?)",
      [user_id, vehicle_name, license_plate],
    );

    return res
      .status(201)
      .json({ success: true, message: "Kendaraan berhasil ditambahkan!" });
  } catch (error) {
    console.error("Error POST Vehicles:", error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal mendaftarkan kendaraan." });
  }
});

// ==========================================
// 3. DELETE: Hapus Kendaraan
// ==========================================
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "ID Kendaraan tidak valid!" });
    }

    // Berkat ON DELETE CASCADE di database, ini aman dilakukan
    await db.query("DELETE FROM vehicles WHERE id = ?", [id]);

    return res
      .status(200)
      .json({ success: true, message: "Kendaraan berhasil dihapus!" });
  } catch (error) {
    console.error("Error DELETE Vehicles:", error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal menghapus kendaraan." });
  }
});

module.exports = router;
