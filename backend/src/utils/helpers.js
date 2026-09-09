const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

const BCRYPT_SALT_ROUNDS = 10;
const OTP_LENGTH = 6;
const OTP_MIN = Math.pow(10, OTP_LENGTH - 1);
const OTP_MAX = Math.pow(10, OTP_LENGTH) - 1;

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
  return bcrypt.hash(password, salt);
};

const generateOtp = () => {
  return String(crypto.randomInt(OTP_MIN, OTP_MAX + 1));
};

const generateBookingCode = () => {
  const uuid = uuidv4().replace(/-/g, "").substring(0, 8).toUpperCase();
  return `APEX-${uuid}`;
};

const validatePassword = (password) => {
  if (!password || typeof password !== "string") {
    return { valid: false, message: "Password wajib diisi!" };
  }
  if (password.length < 8) {
    return {
      valid: false,
      message: "Password minimal 8 karakter!",
    };
  }
  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      message: "Password harus mengandung minimal 1 huruf besar!",
    };
  }
  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      message: "Password harus mengandung minimal 1 huruf kecil!",
    };
  }
  if (!/[0-9]/.test(password)) {
    return {
      valid: false,
      message: "Password harus mengandung minimal 1 angka!",
    };
  }
  return { valid: true };
};

const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
};

module.exports = {
  hashPassword,
  generateOtp,
  generateBookingCode,
  validatePassword,
  sanitizeInput,
  BCRYPT_SALT_ROUNDS,
  OTP_LENGTH,
};
