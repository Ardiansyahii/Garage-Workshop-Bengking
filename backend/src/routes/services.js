const express = require("express");
const router = express.Router();
const serviceController = require("../controllers/serviceController");
// Panggil satpam JWT untuk melindungi rute ini
const { verifyToken } = require("../middlewares/auth");

// ==========================================
// ROUTES UNTUK LAYANAN BENGKEL (DILINDUNGI JWT)
// ==========================================

// GET /api/services -> Ambil daftar layanan (Bisa difilter per bengkel_id)
router.get("/", verifyToken, serviceController.getAllServices);

// POST /api/services -> Tambah layanan baru
router.post("/", verifyToken, serviceController.createService);

// DELETE /api/services/:id -> Hapus layanan
router.delete("/:id", verifyToken, serviceController.deleteService);

module.exports = router;
