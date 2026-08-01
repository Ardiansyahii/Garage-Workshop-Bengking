const db = require("../config/db");

// ==========================================
// 1. GET: Ambil Semua Data Booking (Superadmin)
// ==========================================
exports.getAllSuperadminBookings = async (req, res, next) => {
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
    next(error); // Lempar ke Global Error Handler
  }
};

// ==========================================
// 2. PUT: Ubah Status Booking (Superadmin)
// ==========================================
exports.updateSuperadminBookingStatus = async (req, res, next) => {
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
    next(error);
  }
};

// ==========================================
// 3. DELETE: Hapus Booking (Superadmin)
// ==========================================
exports.deleteSuperadminBooking = async (req, res, next) => {
  try {
    await db.query("DELETE FROM bookings WHERE id = ?", [req.params.id]);
    return res
      .status(200)
      .json({ success: true, message: "Data pesanan berhasil dihapus!" });
  } catch (error) {
    next(error);
  }
};
