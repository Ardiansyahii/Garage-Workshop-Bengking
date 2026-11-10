const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const { verifyToken } = require("../middlewares/auth");

// ==========================================
// ROUTES UNTUK PROFIL BENGKEL & ADMIN (DILINDUNGI JWT)
// ==========================================

// GET /api/profile -> Ambil data admin dan bengkel miliknya
router.get("/", verifyToken, profileController.getMyProfile);

// PUT /api/profile/admin -> Update profil si admin
router.put("/admin", verifyToken, profileController.updateAdminProfile);

// PUT /api/profile/bengkel -> Update info bengkel
router.put("/bengkel", verifyToken, profileController.updateBengkelInfo);

module.exports = router;
