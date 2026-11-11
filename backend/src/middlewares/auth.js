const jwt = require("jsonwebtoken");

// Kunci rahasia untuk membuat dan membuka gembok token (bebas, tapi jangan sampai bocor)
const SECRET_KEY = process.env.JWT_SECRET || "rahasia_apex_garage_2026";

const verifyToken = (req, res, next) => {
  // 1. Ambil token dari header 'Authorization' yang dikirim oleh Frontend
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Formatnya: "Bearer <token>"

  // 2. Jika tidak bawa token, tolak mentah-mentah!
  if (!token) {
    return res
      .status(401)
      .json({
        success: false,
        message: "Akses Ditolak! Token tidak ditemukan.",
      });
  }

  // 3. Jika bawa token, cek apakah tokennya asli buatan kita atau palsu/kadaluarsa
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Token tidak valid atau sudah kadaluarsa!",
        });
    }

    // 4. Jika asli, simpan data user ke dalam request agar bisa dipakai oleh controller
    req.user = decoded;
    next(); // Silakan masuk!
  });
};

module.exports = { verifyToken, SECRET_KEY };
