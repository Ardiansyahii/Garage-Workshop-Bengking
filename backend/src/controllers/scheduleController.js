const db = require("../config/db");

// ==========================================
// 1. GET: Ambil Jadwal berdasarkan Bengkel ID
// ==========================================
exports.getSchedulesByBengkel = async (req, res, next) => {
  try {
    const { bengkel_id } = req.params;
    const [schedules] = await db.query(
      "SELECT * FROM schedules WHERE bengkel_id = ? ORDER BY id ASC",
      [bengkel_id],
    );
    return res.status(200).json({ success: true, data: schedules });
  } catch (error) {
    next(error); // Lempar ke Global Error Handler
  }
};

// ==========================================
// 2. POST: Tambah Jadwal Operasional
// ==========================================
exports.createSchedule = async (req, res, next) => {
  try {
    const { bengkel_id, day_name, open_time, close_time, is_closed } = req.body;

    if (!bengkel_id || !day_name) {
      return res
        .status(400)
        .json({ success: false, message: "Bengkel dan Hari wajib diisi!" });
    }

    await db.query(
      "INSERT INTO schedules (bengkel_id, day_name, open_time, close_time, is_closed) VALUES (?, ?, ?, ?, ?)",
      [
        bengkel_id,
        day_name,
        open_time || "08:00:00",
        close_time || "17:00:00",
        is_closed ? 1 : 0,
      ],
    );

    return res.status(201).json({
      success: true,
      message: "Jadwal operasional berhasil ditambahkan!",
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. PUT: Update/Edit Jadwal
// ==========================================
exports.updateSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { day_name, open_time, close_time, is_closed } = req.body;

    await db.query(
      "UPDATE schedules SET day_name = ?, open_time = ?, close_time = ?, is_closed = ? WHERE id = ?",
      [day_name, open_time, close_time, is_closed ? 1 : 0, id],
    );

    return res
      .status(200)
      .json({ success: true, message: "Jadwal berhasil diperbarui!" });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 4. DELETE: Hapus Jadwal
// ==========================================
exports.deleteSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM schedules WHERE id = ?", [id]);

    return res
      .status(200)
      .json({ success: true, message: "Jadwal berhasil dihapus!" });
  } catch (error) {
    next(error);
  }
};
