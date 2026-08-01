const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
// Panggil satpam JWT untuk melindungi rute
const { verifyToken } = require("../middlewares/auth");

// ==========================================
// ROUTES UNTUK MANAJEMEN PELANGGAN (DILINDUNGI JWT)
// ==========================================

// GET /api/users -> Ambil daftar pelanggan
router.get("/", verifyToken, userController.getAllUsers);

// POST /api/users -> Tambah pelanggan baru dari Web Admin
router.post("/", verifyToken, userController.createUser);

// DELETE /api/users/:id -> Hapus data pelanggan
router.delete("/:id", verifyToken, userController.deleteUser);

module.exports = router;
