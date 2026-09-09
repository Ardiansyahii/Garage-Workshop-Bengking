const express = require("express");
const router = express.Router();
const serviceController = require("../controllers/serviceController");
const { verifyToken, authorizeRole } = require("../middlewares/auth");

// GET /api/services -> Ambil daftar layanan (Semua role yang login)
router.get("/", verifyToken, serviceController.getAllServices);

// POST /api/services -> Tambah layanan baru (Admin bengkel & Superadmin)
router.post(
  "/",
  verifyToken,
  authorizeRole("admin_bengkel", "superadmin"),
  serviceController.createService,
);

// DELETE /api/services/:id -> Hapus layanan (Admin bengkel & Superadmin)
router.delete(
  "/:id",
  verifyToken,
  authorizeRole("admin_bengkel", "superadmin"),
  serviceController.deleteService,
);

module.exports = router;
