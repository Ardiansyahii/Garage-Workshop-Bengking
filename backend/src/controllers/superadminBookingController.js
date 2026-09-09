const db = require("../config/db");

// ==========================================
// 1. GET: Ambil Semua Data Booking (Superadmin) dengan Pagination
// ==========================================
exports.getAllSuperadminBookings = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    let countQuery = `
      SELECT COUNT(*) as total
      FROM bookings bk
      LEFT JOIN users u ON bk.user_id = u.id
      LEFT JOIN bengkels b ON bk.bengkel_id = b.id
      WHERE 1=1
    `;
    let query = `
      SELECT bk.id, bk.booking_date, bk.booking_time, bk.booking_code, bk.status,
             u.name AS customer_name, u.whatsapp,
             b.name AS bengkel_name
      FROM bookings bk
      LEFT JOIN users u ON bk.user_id = u.id
      LEFT JOIN bengkels b ON bk.bengkel_id = b.id
      WHERE 1=1
    `;
    let params = [];
    let countParams = [];

    if (search) {
      query += " AND (bk.booking_code LIKE ? OR u.name LIKE ?)";
      countQuery += " AND (bk.booking_code LIKE ? OR u.name LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
      countParams.push(`%${search}%`, `%${search}%`);
    }
    if (status) {
      query += " AND bk.status = ?";
      countQuery += " AND bk.status = ?";
      params.push(status);
      countParams.push(status);
    }

    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    query += " ORDER BY bk.booking_date DESC LIMIT ? OFFSET ?";
    params.push(limitNum, offset);

    const [bookings] = await db.query(query, params);
    return res.status(200).json({
      success: true,
      data: bookings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. PUT: Ubah Status Booking (Superadmin)
// ==========================================
exports.updateSuperadminBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["Menunggu", "Diproses", "Selesai", "Batal"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status tidak valid! Status harus salah satu dari: Menunggu, Diproses, Selesai, Batal.",
      });
    }

    const [existing] = await db.query(
      "SELECT id FROM bookings WHERE id = ?",
      [id],
    );
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking tidak ditemukan!",
      });
    }

    await db.query("UPDATE bookings SET status = ? WHERE id = ?", [
      status,
      id,
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
    const { id } = req.params;

    const [existing] = await db.query(
      "SELECT id FROM bookings WHERE id = ?",
      [id],
    );
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking tidak ditemukan!",
      });
    }

    await db.query("DELETE FROM bookings WHERE id = ?", [id]);

    return res
      .status(200)
      .json({ success: true, message: "Data pesanan berhasil dihapus!" });
  } catch (error) {
    next(error);
  }
};