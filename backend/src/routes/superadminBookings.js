const express = require("express");
const router = express.Router();
const db = require("../config/db");

// 1. GET: Ambil Semua Data Booking
router.get("/", async (req, res) => {
  try {
    const [bookings] = await db.query(`
      SELECT bk.id, bk.booking_date, bk.status, 
             u.name AS customer_name, u.whatsapp,
             b.name AS bengkel_name
      FROM bookings bk
      LEFT JOIN users u ON bk.user_id = u.id
      LEFT JOIN bengkels b ON bk.bengkel_id = b.id
      ORDER BY bk.booking_date DESC
    `);
    return res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    console.error("Error GET Bookings:", error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal mengambil data booking." });
  }
});

// 2. PUT: Ubah Status Booking
router.put("/:id", async (req, res) => {
  try {
    const { status } = req.body;
    await db.query("UPDATE bookings SET status = ? WHERE id = ?", [
      status,
      req.params.id,
    ]);
    return res
      .status(200)
      .json({ success: true, message: "Status pesanan berhasil diperbarui!" });
  } catch (error) {
    console.error("Error PUT Booking:", error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal mengubah status." });
  }
});

// 3. DELETE: Hapus Booking
router.delete("/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM bookings WHERE id = ?", [req.params.id]);
    return res
      .status(200)
      .json({ success: true, message: "Data pesanan berhasil dihapus!" });
  } catch (error) {
    console.error("Error DELETE Booking:", error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal menghapus pesanan." });
  }
});

module.exports = router;
