const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const { verifyToken, authorizeRole } = require("../middlewares/auth");

// GET /api/bookings -> Semua yang login bisa melihat
router.get("/", verifyToken, bookingController.getAllBookings);

// POST /api/bookings -> Pelanggan bisa membuat pesanan
router.post(
  "/",
  verifyToken,
  authorizeRole("pelanggan"),
  bookingController.createBooking,
);

// PATCH /api/bookings/:id/status -> Admin bengkel update status
router.patch(
  "/:id/status",
  verifyToken,
  authorizeRole("admin_bengkel", "superadmin"),
  bookingController.updateStatus,
);

// DELETE /api/bookings/:id -> Admin bengkel atau superadmin hapus
router.delete(
  "/:id",
  verifyToken,
  authorizeRole("admin_bengkel", "superadmin"),
  bookingController.deleteBooking,
);

module.exports = router;
