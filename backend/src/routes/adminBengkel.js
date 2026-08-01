const express = require("express");
const router = express.Router();
const adminBengkelController = require("../controllers/adminBengkelController");
// Panggil satpam JWT untuk melindungi rute
const { verifyToken } = require("../middlewares/auth");

// ==========================================
// ROUTES UNTUK ADMIN BENGKEL (DILINDUNGI JWT)
// ==========================================

// GET /api/admin-bengkel -> Ambil semua admin bengkel
router.get("/", verifyToken, adminBengkelController.getAllAdminBengkels);

// POST /api/admin-bengkel -> Tambah akun admin bengkel baru
router.post("/", verifyToken, adminBengkelController.createAdminBengkel);

// PUT /api/admin-bengkel/:id -> Edit akun admin bengkel
router.put("/:id", verifyToken, adminBengkelController.updateAdminBengkel);

// DELETE /api/admin-bengkel/:id -> Hapus akun admin bengkel
router.delete("/:id", verifyToken, adminBengkelController.deleteAdminBengkel);

module.exports = router;
