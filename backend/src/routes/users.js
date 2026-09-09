const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { verifyToken, authorizeRole } = require("../middlewares/auth");

// GET /api/users -> Ambil daftar pelanggan (Admin bengkel & Superadmin)
router.get(
  "/",
  verifyToken,
  authorizeRole("admin_bengkel", "superadmin"),
  userController.getAllUsers,
);

// POST /api/users -> Tambah pelanggan baru dari Web Admin (Admin bengkel & Superadmin)
router.post(
  "/",
  verifyToken,
  authorizeRole("admin_bengkel", "superadmin"),
  userController.createUser,
);

// DELETE /api/users/:id -> Hapus data pelanggan (Superadmin only)
router.delete(
  "/:id",
  verifyToken,
  authorizeRole("superadmin"),
  userController.deleteUser,
);

module.exports = router;
