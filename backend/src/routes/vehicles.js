const express = require("express");
const router = express.Router();
const vehicleController = require("../controllers/vehicleController");
// Panggil satpam JWT untuk melindungi rute ini
const { verifyToken } = require("../middlewares/auth");

// ==========================================
// ROUTES UNTUK MANAJEMEN KENDARAAN (DILINDUNGI JWT)
// ==========================================

// GET /api/vehicles -> Ambil daftar kendaraan berdasarkan user_id
router.get("/", verifyToken, vehicleController.getAllVehicles);

// POST /api/vehicles -> Tambah kendaraan baru
router.post("/", verifyToken, vehicleController.createVehicle);

// DELETE /api/vehicles/:id -> Hapus kendaraan
router.delete("/:id", verifyToken, vehicleController.deleteVehicle);

module.exports = router;
