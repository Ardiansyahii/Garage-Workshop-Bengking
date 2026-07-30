const express = require("express");
const router = express.Router();
const db = require("../config/db");

// ==========================================
// 1. GET: Ambil Jadwal berdasarkan Bengkel ID
// ==========================================
router.get("/:bengkel_id", async (req, res) => {
  try {
    const { bengkel_id } = req.params;
    const [schedules] = await db.query(
      "SELECT * FROM schedules WHERE bengkel_id = ? ORDER BY id ASC",
      [bengkel_id],
    );
    return res.status(200).json({ success: true, data: schedules });
  } catch (error) {
    console.error("Error GET Schedules:", error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal mengambil data jadwal." });
  }
});

// ==========================================
// 2. POST: Tambah Jadwal Operasional
// ==========================================
router.post("/", async (req, res) => {
  try {
    const { bengkel_id, day_name, open_time, close_time, is_closed } = req.body;

    if (!bengkel_id || !day_name) {
      return res
        .status(400)
        .json({ success: false, message: "Bengkel dan Hari wajib diisi!" });
    }

    await db.query(
      "INSERT INTO schedules (bengkel_id, day_name, open_time, close_time, is_closed) VALUES (?, ?, ?, ?, ?)",
      [
        bengkel_id,
        day_name,
        open_time || "08:00:00",
        close_time || "17:00:00",
        is_closed ? 1 : 0,
      ],
    );

    return res
      .status(201)
      .json({
        success: true,
        message: "Jadwal operasional berhasil ditambahkan!",
      });
  } catch (error) {
    console.error("Error POST Schedule:", error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal menambahkan jadwal." });
  }
});

// ==========================================
// 3. PUT: Update/Edit Jadwal
// ==========================================
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { day_name, open_time, close_time, is_closed } = req.body;

    await db.query(
      "UPDATE schedules SET day_name = ?, open_time = ?, close_time = ?, is_closed = ? WHERE id = ?",
      [day_name, open_time, close_time, is_closed ? 1 : 0, id],
    );

    return res
      .status(200)
      .json({ success: true, message: "Jadwal berhasil diperbarui!" });
  } catch (error) {
    console.error("Error PUT Schedule:", error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal mengupdate jadwal." });
  }
});

// ==========================================
// 4. DELETE: Hapus Jadwal
// ==========================================
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM schedules WHERE id = ?", [id]);
    return res
      .status(200)
      .json({ success: true, message: "Jadwal berhasil dihapus!" });
  } catch (error) {
    console.error("Error DELETE Schedule:", error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal menghapus jadwal." });
  }
});

module.exports = router;
