const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();

// ==========================================
// 1. GLOBAL MIDDLEWARES
// ==========================================
app.use(helmet());

const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:3000";
app.use(
  cors({
    origin: corsOrigin.split(","),
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json({ limit: "1mb" }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Terlalu banyak percobaan, silakan coba lagi setelah 15 menit.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Terlalu banyak request, silakan coba lagi nanti.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth", authLimiter);
app.use("/api/", generalLimiter);

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
const superadminBookingRoutes = require("./routes/superadminBookings");
const scheduleRoutes = require("./routes/schedules");
const registerMitraRoutes = require("./routes/registerMitra");
const profileRoutes = require("./routes/profile");

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
app.use("/api/profile", profileRoutes);

// Root Endpoint API
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to Apex Garage API!",
  });
});

// ==========================================
// 4. GLOBAL 404 HANDLER
// ==========================================
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Endpoint tidak ditemukan.",
  });
});

// ==========================================
// 5. GLOBAL ERROR HANDLER
// ==========================================
app.use((err, req, res, next) => {
  console.error("[Global Error]:", err.message || err);

  const isDev = process.env.NODE_ENV === "development";

  res.status(err.status || 500).json({
    success: false,
    message: isDev
      ? err.message || "Terjadi kesalahan internal pada server."
      : "Terjadi kesalahan internal pada server.",
    error: isDev ? err.stack : undefined,
  });
});

module.exports = app;
