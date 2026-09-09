const db = require("../config/db");

// ==========================================
// 1. GET: Ambil Kendaraan (dengan Pagination)
// ==========================================
exports.getAllVehicles = async (req, res, next) => {
  try {
    const { user_id, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    let countQuery = `
      SELECT COUNT(*) as total
      FROM vehicles v 
      LEFT JOIN users u ON v.user_id = u.id 
      WHERE 1=1
    `;
    let query = `
      SELECT v.id, v.user_id, v.vehicle_name, v.license_plate, v.created_at,
             u.name as customer_name, u.whatsapp as customer_whatsapp 
      FROM vehicles v 
      LEFT JOIN users u ON v.user_id = u.id 
      WHERE 1=1
    `;
    let params = [];
    let countParams = [];

    if (user_id) {
      query += " AND v.user_id = ?";
      countQuery += " AND v.user_id = ?";
      params.push(user_id);
      countParams.push(user_id);
    }

    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    query += " ORDER BY v.created_at DESC LIMIT ? OFFSET ?";
    params.push(limitNum, offset);

    const [vehicles] = await db.query(query, params);
    return res.status(200).json({
      success: true,
      data: vehicles,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
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

    const [existingUser] = await db.query(
      "SELECT id FROM users WHERE id = ?",
      [user_id],
    );
    if (existingUser.length === 0) {
      return res.status(400).json({
        success: false,
        message: "User tidak ditemukan!",
      });
    }

    const normalizedPlate = String(license_plate).trim().toUpperCase();
    const normalizedVehicleName = String(vehicle_name).trim();

    const [existingVehicle] = await db.query(
      "SELECT id FROM vehicles WHERE user_id = ? AND license_plate = ? LIMIT 1",
      [user_id, normalizedPlate],
    );
    if (existingVehicle.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Kendaraan dengan plat nomor ini sudah terdaftar!",
      });
    }

    await db.query(
      "INSERT INTO vehicles (user_id, vehicle_name, license_plate) VALUES (?, ?, ?)",
      [user_id, normalizedVehicleName, normalizedPlate],
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

    const [existing] = await db.query(
      "SELECT id FROM vehicles WHERE id = ?",
      [id],
    );
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Kendaraan tidak ditemukan!",
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