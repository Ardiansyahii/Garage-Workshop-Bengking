const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const { verifyToken } = require("../middlewares/auth");

// GET /api/profile -> Ambil profil berdasarkan role login (Admin/Bengkel atau User/Pelanggan)
router.get("/", verifyToken, profileController.getMyProfile);

// PUT /api/profile/user -> Update profil user / pelanggan
router.put("/user", verifyToken, profileController.updateUserProfile);

// PUT /api/profile/admin -> Update profil si admin
router.put("/admin", verifyToken, profileController.updateAdminProfile);

// PUT /api/profile/bengkel -> Update info bengkel
router.put("/bengkel", verifyToken, profileController.updateBengkelInfo);

module.exports = router;