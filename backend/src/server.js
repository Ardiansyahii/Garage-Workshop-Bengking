const express = require("express");
const cors = require("cors"); // <--- 1. TAMBAHKAN BARIS INI

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// 🚀 IMPORT ROUTES DI SINI
const authRoutes = require("./routes/auth");
const servicesRoutes = require("./routes/services");
const bookingsRoutes = require("./routes/bookings");
const bengkelsRoutes = require("./routes/bengkels");
const vehiclesRoutes = require("./routes/vehicles");
const usersRoutes = require("./routes/users"); // <--- 1. TAMBAHKAN BARIS INI
const adminBengkelRoutes = require("./routes/adminBengkel");
const superadminBookingRoutes = require("./routes/superadminBookings");
const scheduleRoutes = require("./routes/schedules");
const registerMitraRoutes = require("./routes/registerMitra");


// 🚀 GUNAKAN ROUTES TERSEBUT
app.use("/api/auth", authRoutes);
app.use("/api/services", servicesRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/bengkels", bengkelsRoutes);
app.use("/api/vehicles", vehiclesRoutes);
app.use("/api/users", usersRoutes); // <--- 2. TAMBAHKAN BARIS INI
app.use("/api/admin-bengkel", adminBengkelRoutes);
app.use("/api/superadmin-bookings", superadminBookingRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/register-mitra", registerMitraRoutes);


app.get("/", (req, res) => {
  res.json({ success: true, message: "Welcome to Apex Garage API!" });
});

const PORT = process.env.PORT || 5000 || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan dengan lancar di port ${PORT}`);
});