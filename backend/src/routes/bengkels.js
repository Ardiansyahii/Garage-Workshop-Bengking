const express = require("express");
const router = express.Router();
const bengkelController = require("../controllers/bengkelController");
const { verifyToken, authorizeRole } = require("../middlewares/auth");

// GET /api/bengkels -> Ambil daftar bengkel (Semua role yang login)
router.get("/", verifyToken, bengkelController.getAllBengkels);

// POST /api/bengkels -> Tambah bengkel baru (Hanya Superadmin)
router.post(
  "/",
  verifyToken,
  authorizeRole("superadmin"),
  bengkelController.createBengkel,
);

// DELETE /api/bengkels/:id -> Hapus bengkel permanen (Hanya Superadmin)
router.delete(
  "/:id",
  verifyToken,
  authorizeRole("superadmin"),
  bengkelController.deleteBengkel,
);

module.exports = router;
