const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// ==========================================
// ROUTES UNTUK AUTENTIKASI
// ==========================================

// POST /api/auth/register
router.post("/register", authController.register);

// POST /api/auth/login
router.post("/login", authController.login);

// POST /api/auth/verify-otp
router.post("/verify-otp", authController.verifyOtp);

module.exports = router;
