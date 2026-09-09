const express = require("express");
const router = express.Router();
const registerMitraController = require("../controllers/registerMitraController");
const { verifyToken, authorizeRole } = require("../middlewares/auth");

// POST /api/register-mitra -> Publik (Calon mitra mengisi formulir pengajuan)
router.post("/", registerMitraController.createMitraRequest);

// GET /api/register-mitra/requests -> Hanya Superadmin
router.get(
  "/requests",
  verifyToken,
  authorizeRole("superadmin"),
  registerMitraController.getMitraRequests,
);

// POST /api/register-mitra/approve/:id -> Hanya Superadmin
router.post(
  "/approve/:id",
  verifyToken,
  authorizeRole("superadmin"),
  registerMitraController.approveMitraRequest,
);

// POST /api/register-mitra/reject/:id -> Hanya Superadmin
router.post(
  "/reject/:id",
  verifyToken,
  authorizeRole("superadmin"),
  registerMitraController.rejectMitraRequest,
);

module.exports = router;
