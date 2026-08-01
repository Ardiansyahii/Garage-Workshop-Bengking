const db = require("../config/db");

// ==========================================
// 1. GET: Ambil Kendaraan (Global untuk Superadmin / Filter per User)
// ==========================================
exports.getAllVehicles = async (req, res, next) => {
  try {
    const { user_id } = req.query;

    let query = `
      SELECT v.*, u.name as customer_name, u.whatsapp as customer_whatsapp 
      FROM vehicles v 
      LEFT JOIN users u ON v.user_id = u.id 
      ORDER BY v.created_at DESC
    `;
    let params = [];

    // Jika user_id dikirim, filter khusus kendaraan user tersebut
    if (user_id) {
      query = `
        SELECT * FROM vehicles 
        WHERE user_id = ? 
        ORDER BY created_at DESC
      `;
      params = [user_id];
    }

    const [vehicles] = await db.query(query, params);
    return res.status(200).json({ success: true, data: vehicles });
  } catch (error) {
    next(error); // Lempar ke Global Error Handler
  }
};

// ==========================================
// 2. POST: Tambah Kendaraan Baru
// ==========================================
exports.createVehicle = async (req, res, next) => {
  try {
    const { user_id, vehicle_name, license_plate } = req.body;

    if (!user_id || !vehicle_name || !license_plate) {
      return res.status(400).json({
        success: false,
        message: "Data pelanggan, nama kendaraan, dan plat nomor wajib diisi!",
      });
    }

    await db.query(
      "INSERT INTO vehicles (user_id, vehicle_name, license_plate) VALUES (?, ?, ?)",
      [user_id, vehicle_name, license_plate],
    );

    return res.status(201).json({
      success: true,
      message: "Kendaraan berhasil ditambahkan!",
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. DELETE: Hapus Kendaraan
// ==========================================
exports.deleteVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID Kendaraan tidak valid!",
      });
    }

    await db.query("DELETE FROM vehicles WHERE id = ?", [id]);

    return res.status(200).json({
      success: true,
      message: "Kendaraan berhasil dihapus!",
    });
  } catch (error) {
    next(error);
  }
};
