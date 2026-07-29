const express = require("express");
const router = express.Router();
const db = require("../config/db");

// ==========================================
// 1. GET: Ambil Semua Daftar Bengkel
// (Bisa dipakai Superadmin di Web & Pelanggan di Mobile)
// ==========================================
router.get("/", async (req, res) => {
  try {
    const [bengkels] = await db.query(
      "SELECT * FROM bengkels ORDER BY created_at DESC",
    );

    return res.status(200).json({
      success: true,
      data: bengkels,
    });
  } catch (error) {
    console.error("Error GET Bengkels:", error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal mengambil data bengkel." });
  }
});

// ==========================================
// 2. POST: Tambah Bengkel Baru
// (Hanya diakses oleh Superadmin)
// ==========================================
router.post("/", async (req, res) => {
  try {
    const { name, address, phone } = req.body;

    // Validasi input wajib
    if (!name || !address || !phone) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Nama, alamat, dan nomor telepon bengkel wajib diisi!",
        });
    }

    await db.query(
      "INSERT INTO bengkels (name, address, phone) VALUES (?, ?, ?)",
      [name, address, phone],
    );

    return res
      .status(201)
      .json({ success: true, message: "Bengkel baru berhasil didaftarkan!" });
  } catch (error) {
    console.error("Error POST Bengkels:", error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal mendaftarkan bengkel." });
  }
});

// ==========================================
// 3. DELETE: Hapus Bengkel
// (Hanya diakses oleh Superadmin)
// ==========================================
router.delete("/:id", async (req, res) => {
  try {
    // Menangkap ID dari URL (Contoh: /api/bengkels/5)
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "ID Bengkel tidak valid!" });
    }

    await db.query("DELETE FROM bengkels WHERE id = ?", [id]);

    return res
      .status(200)
      .json({ success: true, message: "Bengkel berhasil dihapus permanen!" });
  } catch (error) {
    console.error("Error DELETE Bengkels:", error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal menghapus bengkel." });
  }
});

module.exports = router;
