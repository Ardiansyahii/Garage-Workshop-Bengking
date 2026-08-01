const express = require("express");
const router = express.Router();
const bengkelController = require("../controllers/bengkelController");
// Panggil satpam JWT untuk melindungi rute ini
const { verifyToken } = require("../middlewares/auth");

// ==========================================
// ROUTES UNTUK MANAJEMEN BENGKEL (DILINDUNGI JWT)
// ==========================================

// GET /api/bengkels -> Ambil daftar bengkel (Bisa dipakai Superadmin & Pelanggan)
router.get("/", verifyToken, bengkelController.getAllBengkels);

// POST /api/bengkels -> Tambah bengkel baru (Hanya Superadmin)
router.post("/", verifyToken, bengkelController.createBengkel);

// DELETE /api/bengkels/:id -> Hapus bengkel permanen (Hanya Superadmin)
router.delete("/:id", verifyToken, bengkelController.deleteBengkel);

module.exports = router;
