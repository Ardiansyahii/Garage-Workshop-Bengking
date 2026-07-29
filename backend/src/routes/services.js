const express = require("express");
const router = express.Router();
const db = require("../config/db");

// ==========================================
// 1. GET: Ambil Layanan Berdasarkan Bengkel
// (Endpoint: /api/services?bengkel_id=1)
// ==========================================
router.get("/", async (req, res) => {
  try {
    const { bengkel_id } = req.query;

    let query = "SELECT * FROM services ORDER BY created_at DESC";
    let params = [];

    // Jika frontend mengirim bengkel_id, filter layanannya!
    if (bengkel_id) {
      query =
        "SELECT * FROM services WHERE bengkel_id = ? ORDER BY created_at DESC";
      params = [bengkel_id];
    }

    const [services] = await db.query(query, params);

    return res.status(200).json({ success: true, data: services });
  } catch (error) {
    console.error("Error GET Services:", error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal mengambil data layanan." });
  }
});

// ==========================================
// 2. POST: Tambah Layanan Baru
// (Memerlukan bengkel_id di body request)
// ==========================================
router.post("/", async (req, res) => {
  try {
    // Menambahkan bengkel_id agar sistem tahu layanan ini milik siapa
    const { bengkel_id, service_name, price, description } = req.body;

    // Validasi input wajib sesuai syarat ujian
    if (!bengkel_id || !service_name || !price) {
      return res
        .status(400)
        .json({
          success: false,
          message: "ID Bengkel, Nama Layanan, dan Harga wajib diisi!",
        });
    }

    await db.query(
      "INSERT INTO services (bengkel_id, service_name, price, description) VALUES (?, ?, ?, ?)",
      [bengkel_id, service_name, price, description || ""],
    );

    return res
      .status(201)
      .json({
        success: true,
        message: "Layanan bengkel berhasil ditambahkan!",
      });
  } catch (error) {
    console.error("Error POST Services:", error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal menambah layanan." });
  }
});

// ==========================================
// 3. DELETE: Hapus Layanan
// ==========================================
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "ID Layanan tidak valid!" });
    }

    await db.query("DELETE FROM services WHERE id = ?", [id]);

    return res
      .status(200)
      .json({ success: true, message: "Layanan berhasil dihapus!" });
  } catch (error) {
    console.error("Error DELETE Services:", error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal menghapus layanan." });
  }
});

module.exports = router;
