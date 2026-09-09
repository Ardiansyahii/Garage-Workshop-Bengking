const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// POST /api/auth/register
router.post("/register", authController.register);

// POST /api/auth/login
router.post("/login", authController.login);

// POST /api/auth/verify-otp
router.post("/verify-otp", authController.verifyOtp);

// POST /api/auth/logout — clear httpOnly cookies
router.post("/logout", (req, res) => {
  res.clearCookie("auth_token", { path: "/" });
  res.clearCookie("user_role", { path: "/" });
  return res.status(200).json({
    success: true,
    message: "Logout berhasil.",
  });
});

module.exports = router;
