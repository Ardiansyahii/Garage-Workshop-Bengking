const express = require("express");
const router = express.Router();
const db = require("../config/db");

// ==========================================
// 1. GET: Ambil & Cari Data Booking
// Memenuhi syarat: Pencarian booking
// ==========================================
router.get("/", async (req, res) => {
  try {
    const { user_id, bengkel_id, search } = req.query;

    // Relasi JOIN 5 Tabel sekaligus!
    // Menggabungkan Data Transaksi, Pelanggan, Kendaraan, Layanan, dan Bengkel
    let query = `
      SELECT b.*, 
             u.name as customer_name, u.whatsapp as whatsapp_number,
             v.vehicle_name, v.license_plate,
             s.service_name, s.price,
             bk.name as bengkel_name
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN vehicles v ON b.vehicle_id = v.id
      JOIN services s ON b.service_id = s.id
      JOIN bengkels bk ON b.bengkel_id = bk.id
      WHERE 1=1
    `;
    let params = [];

    // Filter jika diakses oleh Pelanggan di Mobile[cite: 1]
    if (user_id) {
      query += " AND b.user_id = ?";
      params.push(user_id);
    }

    // Filter jika diakses oleh Admin Bengkel tertentu di Web[cite: 1]
    if (bengkel_id) {
      query += " AND b.bengkel_id = ?";
      params.push(bengkel_id);
    }

    // Fitur Pencarian Booking (berdasarkan kode atau nama pelanggan)[cite: 1]
    if (search) {
      query += " AND (b.booking_code LIKE ? OR u.name LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    query += " ORDER BY b.booking_date ASC, b.booking_time ASC";

    const [bookings] = await db.query(query, params);
    return res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    console.error("Error GET Bookings:", error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal mengambil data reservasi." });
  }
});

// ==========================================
// 2. POST: Membuat Booking Baru
// Memenuhi syarat: Melakukan booking[cite: 1]
// ==========================================
router.post("/", async (req, res) => {
  try {
    const {
      user_id,
      bengkel_id,
      vehicle_id,
      service_id,
      booking_date,
      booking_time,
    } = req.body;

    // Validasi input wajib
    if (
      !user_id ||
      !bengkel_id ||
      !vehicle_id ||
      !service_id ||
      !booking_date ||
      !booking_time
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Semua data booking wajib diisi!" });
    }

    // Generate kode unik
    const booking_code = "APEX-" + Math.floor(10000 + Math.random() * 90000);

    // Status default otomatis: Menunggu[cite: 1]
    await db.query(
      "INSERT INTO bookings (user_id, bengkel_id, vehicle_id, service_id, booking_date, booking_time, booking_code, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'Menunggu')",
      [
        user_id,
        bengkel_id,
        vehicle_id,
        service_id,
        booking_date,
        booking_time,
        booking_code,
      ],
    );

    return res
      .status(201)
      .json({
        success: true,
        message: "Booking berhasil dibuat!",
        booking_code,
      });
  } catch (error) {
    console.error("Error POST Booking:", error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal membuat reservasi." });
  }
});

// ==========================================
// 3. PATCH: Ubah Status Booking
// Memenuhi syarat: Ubah status booking (Menunggu, Diproses, Selesai)[cite: 1]
// ==========================================
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validasi agar status tidak diisi sembarangan di luar ketentuan ujian[cite: 1]
    const validStatuses = ["Menunggu", "Diproses", "Selesai"];
    if (!validStatuses.includes(status)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Status tidak sesuai kriteria ujian!",
        });
    }

    await db.query("UPDATE bookings SET status = ? WHERE id = ?", [status, id]);

    return res
      .status(200)
      .json({
        success: true,
        message: `Status berhasil diubah menjadi ${status}!`,
      });
  } catch (error) {
    console.error("Error PATCH Status:", error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal mengubah status." });
  }
});

// ==========================================
// 4. DELETE: Hapus Booking
// ==========================================
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM bookings WHERE id = ?", [id]);
    return res
      .status(200)
      .json({ success: true, message: "Riwayat booking berhasil dihapus!" });
  } catch (error) {
    console.error("Error DELETE Booking:", error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal menghapus booking." });
  }
});

module.exports = router;
