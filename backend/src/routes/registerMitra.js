const express = require("express");
const router = express.Router();
const registerMitraController = require("../controllers/registerMitraController");
// Panggil satpam JWT untuk melindungi rute sensitif
const { verifyToken } = require("../middlewares/auth");

// ==========================================
// ROUTES UNTUK PENDAFTARAN MITRA
// ==========================================

// POST /api/register-mitra -> Publik (Calon mitra mengisi formulir pengajuan)
router.post("/", registerMitraController.createMitraRequest);

// GET /api/register-mitra/requests -> Hanya Superadmin yang bisa melihat daftar antrean
router.get("/requests", verifyToken, registerMitraController.getMitraRequests);

// POST /api/register-mitra/approve/:id -> Hanya Superadmin yang bisa menyetujui
router.post(
  "/approve/:id",
  verifyToken,
  registerMitraController.approveMitraRequest,
);

// POST /api/register-mitra/reject/:id -> Hanya Superadmin yang bisa menolak
router.post(
  "/reject/:id",
  verifyToken,
  registerMitraController.rejectMitraRequest,
);

module.exports = router;
