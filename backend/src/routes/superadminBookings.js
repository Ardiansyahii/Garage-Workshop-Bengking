const express = require("express");
const router = express.Router();
const superadminBookingController = require("../controllers/superadminBookingController");
// Panggil satpam JWT untuk melindungi rute
const { verifyToken } = require("../middlewares/auth");

// ==========================================
// ROUTES UNTUK SUPERADMIN BOOKINGS (DILINDUNGI JWT)
// ==========================================

// GET /api/superadmin-bookings -> Ambil semua booking global
router.get(
  "/",
  verifyToken,
  superadminBookingController.getAllSuperadminBookings,
);

// PUT /api/superadmin-bookings/:id -> Update status pesanan
router.put(
  "/:id",
  verifyToken,
  superadminBookingController.updateSuperadminBookingStatus,
);

// DELETE /api/superadmin-bookings/:id -> Hapus pesanan
router.delete(
  "/:id",
  verifyToken,
  superadminBookingController.deleteSuperadminBooking,
);

module.exports = router;
