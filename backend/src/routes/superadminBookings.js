const express = require("express");
const router = express.Router();
const superadminBookingController = require("../controllers/superadminBookingController");
const { verifyToken, authorizeRole } = require("../middlewares/auth");

// Semua routes di sini khusus Superadmin

// GET /api/superadmin-bookings -> Ambil semua booking global
router.get(
  "/",
  verifyToken,
  authorizeRole("superadmin"),
  superadminBookingController.getAllSuperadminBookings,
);

// PUT /api/superadmin-bookings/:id -> Update status pesanan
router.put(
  "/:id",
  verifyToken,
  authorizeRole("superadmin"),
  superadminBookingController.updateSuperadminBookingStatus,
);

// DELETE /api/superadmin-bookings/:id -> Hapus pesanan
router.delete(
  "/:id",
  verifyToken,
  authorizeRole("superadmin"),
  superadminBookingController.deleteSuperadminBooking,
);

module.exports = router;
