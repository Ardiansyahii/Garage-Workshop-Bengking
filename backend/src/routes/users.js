const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
// Panggil satpam JWT untuk melindungi rute
const { verifyToken } = require("../middlewares/auth");

// ==========================================
// ROUTES UNTUK PROFILE USER YANG SEDANG LOGIN
// (harus didaftarkan sebelum "/:id" agar tidak bentrok, walau beda method)
// ==========================================

// GET /api/users/profile -> Ambil data profile user yang sedang login
router.get("/profile", verifyToken, userController.getProfile);

// PUT /api/users/profile -> Update profile user yang sedang login
router.put("/profile", verifyToken, userController.updateProfile);

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