const db = require("../config/db");

// ==========================================
// 1. GET: Ambil Layanan Berdasarkan Bengkel (dengan Pagination)
// ==========================================
exports.getAllServices = async (req, res, next) => {
  try {
    const { bengkel_id, page = 1, limit = 20, search } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    let countQuery = "SELECT COUNT(*) as total FROM services WHERE 1=1";
    let query =
      "SELECT id, bengkel_id, service_name, price, description, created_at FROM services WHERE 1=1";
    let params = [];
    let countParams = [];

    if (bengkel_id) {
      query += " AND bengkel_id = ?";
      countQuery += " AND bengkel_id = ?";
      params.push(bengkel_id);
      countParams.push(bengkel_id);
    }
    if (search) {
      query += " AND (service_name LIKE ? OR description LIKE ?)";
      countQuery += " AND (service_name LIKE ? OR description LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(limitNum, offset);

    const [services] = await db.query(query, params);
    return res.status(200).json({
      success: true,
      data: services,
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
// 2. POST: Tambah Layanan Baru
// ==========================================
exports.createService = async (req, res, next) => {
  try {
    const { bengkel_id, service_name, price, description } = req.body;

    if (!bengkel_id || !service_name || !price) {
      return res.status(400).json({
        success: false,
        message: "ID Bengkel, Nama Layanan, dan Harga wajib diisi!",
      });
    }

    const [existingBengkel] = await db.query(
      "SELECT id FROM bengkels WHERE id = ?",
      [bengkel_id],
    );
    if (existingBengkel.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Bengkel tidak ditemukan!",
      });
    }

    await db.query(
      "INSERT INTO services (bengkel_id, service_name, price, description) VALUES (?, ?, ?, ?)",
      [bengkel_id, service_name, price, description || ""],
    );

    return res.status(201).json({
      success: true,
      message: "Layanan bengkel berhasil ditambahkan!",
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. DELETE: Hapus Layanan
// ==========================================
exports.deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await db.query(
      "SELECT id FROM services WHERE id = ?",
      [id],
    );
    if (existing.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Layanan tidak ditemukan!" });
    }

    await db.query("DELETE FROM services WHERE id = ?", [id]);

    return res
      .status(200)
      .json({ success: true, message: "Layanan berhasil dihapus!" });
  } catch (error) {
    next(error);
  }
};