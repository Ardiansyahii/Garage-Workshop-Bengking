const express = require("express");
const router = express.Router();
const adminBengkelController = require("../controllers/adminBengkelController");
const { verifyToken, authorizeRole } = require("../middlewares/auth");

// GET /api/admin-bengkel -> Ambil semua admin bengkel (Superadmin only)
router.get(
  "/",
  verifyToken,
  authorizeRole("superadmin"),
  adminBengkelController.getAllAdminBengkels,
);

// POST /api/admin-bengkel -> Tambah akun admin bengkel baru (Superadmin only)
router.post(
  "/",
  verifyToken,
  authorizeRole("superadmin"),
  adminBengkelController.createAdminBengkel,
);

// PUT /api/admin-bengkel/:id -> Edit akun admin bengkel (Superadmin only)
router.put(
  "/:id",
  verifyToken,
  authorizeRole("superadmin"),
  adminBengkelController.updateAdminBengkel,
);

// DELETE /api/admin-bengkel/:id -> Hapus akun admin bengkel (Superadmin only)
router.delete(
  "/:id",
  verifyToken,
  authorizeRole("superadmin"),
  adminBengkelController.deleteAdminBengkel,
);

module.exports = router;
