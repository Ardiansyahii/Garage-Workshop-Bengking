const express = require("express");
const router = express.Router();
const scheduleController = require("../controllers/scheduleController");
// Panggil satpam JWT untuk melindungi rute
const { verifyToken } = require("../middlewares/auth");

// ==========================================
// ROUTES UNTUK JADWAL OPERASIONAL (DILINDUNGI JWT)
// ==========================================

// GET /api/schedules/:bengkel_id -> Ambil jadwal operasional per bengkel
router.get(
  "/:bengkel_id",
  verifyToken,
  scheduleController.getSchedulesByBengkel,
);

// POST /api/schedules -> Tambah jadwal operasional baru
router.post("/", verifyToken, scheduleController.createSchedule);

// PUT /api/schedules/:id -> Edit jadwal operasional
router.put("/:id", verifyToken, scheduleController.updateSchedule);

// DELETE /api/schedules/:id -> Hapus jadwal operasional
router.delete("/:id", verifyToken, scheduleController.deleteSchedule);

module.exports = router;
