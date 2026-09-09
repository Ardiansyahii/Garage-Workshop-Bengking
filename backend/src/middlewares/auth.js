const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.JWT_SECRET;

if (!SECRET_KEY) {
  console.error(
    "FATAL: JWT_SECRET is not set in environment variables. Server cannot start.",
  );
  process.exit(1);
}

const verifyToken = (req, res, next) => {
  // Coba ambil token dari Authorization header DULU
  const authHeader = req.headers["authorization"];
  let token = authHeader && authHeader.split(" ")[1];

  // Jika tidak ada, coba ambil dari cookie auth_token
  if (!token && req.cookies && req.cookies.auth_token) {
    token = req.cookies.auth_token;
  }

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Akses Ditolak! Token tidak ditemukan." });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Token tidak valid atau sudah kadaluarsa!",
        });
    }

    req.user = decoded;
    next();
  });
};

const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res
        .status(403)
        .json({ success: false, message: "Akses Ditolak! Role tidak ditemukan." });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Akses Ditolak! Anda tidak memiliki izin yang cukup.",
        });
    }

    next();
  };
};

const signToken = (payload) => {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: "24h" });
};

module.exports = { verifyToken, authorizeRole, signToken };
