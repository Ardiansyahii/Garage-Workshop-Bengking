const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
// Panggil middleware JWT yang sudah kamu buat sebelumnya
const { verifyToken } = require("../middlewares/auth");

// ==========================================
// ROUTES UNTUK BOOKING (DILINDUNGI JWT)
// ==========================================

// GET /api/bookings -> Hanya yang bawa token bisa melihat data
router.get("/", verifyToken, bookingController.getAllBookings);

// POST /api/bookings -> Hanya pelanggan login yang bisa membuat pesanan
router.post("/", verifyToken, bookingController.createBooking);

// PATCH /api/bookings/:id/status -> Admin mengupdate status pesanan
router.patch("/:id/status", verifyToken, bookingController.updateStatus);

// DELETE /api/bookings/:id -> Admin/Pelanggan menghapus riwayat
router.delete("/:id", verifyToken, bookingController.deleteBooking);

module.exports = router;