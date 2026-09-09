const express = require("express");
const router = express.Router();
const scheduleController = require("../controllers/scheduleController");
const { verifyToken, authorizeRole } = require("../middlewares/auth");

// GET /api/schedules/:bengkel_id -> Ambil jadwal operasional per bengkel
router.get(
  "/:bengkel_id",
  verifyToken,
  scheduleController.getSchedulesByBengkel,
);

// POST /api/schedules -> Tambah jadwal operasional baru (Admin bengkel & Superadmin)
router.post(
  "/",
  verifyToken,
  authorizeRole("admin_bengkel", "superadmin"),
  scheduleController.createSchedule,
);

// PUT /api/schedules/:id -> Edit jadwal operasional (Admin bengkel & Superadmin)
router.put(
  "/:id",
  verifyToken,
  authorizeRole("admin_bengkel", "superadmin"),
  scheduleController.updateSchedule,
);

// DELETE /api/schedules/:id -> Hapus jadwal operasional (Admin bengkel & Superadmin)
router.delete(
  "/:id",
  verifyToken,
  authorizeRole("admin_bengkel", "superadmin"),
  scheduleController.deleteSchedule,
);

module.exports = router;
