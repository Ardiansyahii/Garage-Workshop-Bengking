const express = require("express");
const cors = require("cors");

const app = express();

// ==========================================
// 1. GLOBAL MIDDLEWARES
// ==========================================
app.use(cors());
app.use(express.json());

// ==========================================
// 2. IMPORT ROUTES
// ==========================================
const authRoutes = require("./routes/auth");
const servicesRoutes = require("./routes/services");
const bookingsRoutes = require("./routes/bookings");
const bengkelsRoutes = require("./routes/bengkels");
const vehiclesRoutes = require("./routes/vehicles");
const usersRoutes = require("./routes/users");
const adminBengkelRoutes = require("./routes/adminBengkel");
// Pastikan penulisan nama file sesuai dengan yang ada di foldermu (perhatikan huruf besar/kecilnya)
const superadminBookingRoutes = require("./routes/superadminBookings");
const scheduleRoutes = require("./routes/schedules");
const registerMitraRoutes = require("./routes/registerMitra");

// ==========================================
// 3. GUNAKAN ROUTES
// ==========================================
app.use("/api/auth", authRoutes);
app.use("/api/services", servicesRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/bengkels", bengkelsRoutes);
app.use("/api/vehicles", vehiclesRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/admin-bengkel", adminBengkelRoutes);
app.use("/api/superadmin-bookings", superadminBookingRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/register-mitra", registerMitraRoutes);

// Root Endpoint API
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to Apex Garage API (Enterprise Version)!",
  });
});

// ==========================================
// 4. GLOBAL 404 HANDLER (Endpoint Tidak Ditemukan)
// ==========================================
// Jika ada yang sembarangan nembak URL yang tidak ada (misal /api/hacker), dia akan masuk ke sini
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Oops! Endpoint yang kamu tuju (${req.method} ${req.originalUrl}) tidak ditemukan.`,
  });
});

// ==========================================
// 5. GLOBAL ERROR HANDLER
// ==========================================
// Jika ada aplikasi yang crash atau error di database, server tidak akan mati, melainkan ditangkap di sini
app.use((err, req, res, next) => {
  console.error("🔥 [Global Error]:", err.message || err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Terjadi kesalahan internal pada server.",
    // Tampilkan detail error HANYA jika sedang masa pengembangan (development)
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// Export app agar bisa dipanggil oleh server.js
module.exports = app;
