const express = require("express");
const router = express.Router();
const vehicleController = require("../controllers/vehicleController");
const { verifyToken, authorizeRole } = require("../middlewares/auth");

// GET /api/vehicles -> Ambil daftar kendaraan (Semua role yang login)
router.get("/", verifyToken, vehicleController.getAllVehicles);

// POST /api/vehicles -> Tambah kendaraan baru (Admin bengkel & Superadmin)
router.post(
  "/",
  verifyToken,
  authorizeRole("admin_bengkel", "superadmin"),
  vehicleController.createVehicle,
);

// DELETE /api/vehicles/:id -> Hapus kendaraan (Admin bengkel & Superadmin)
router.delete(
  "/:id",
  verifyToken,
  authorizeRole("admin_bengkel", "superadmin"),
  vehicleController.deleteVehicle,
);

module.exports = router;
