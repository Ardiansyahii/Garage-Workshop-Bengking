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

// POST /api/auth/request-reset-otp
router.post("/request-reset-otp", authController.requestPasswordResetOtp);

// POST /api/auth/reset-password
router.post("/reset-password", authController.resetPassword);

module.exports = router;
