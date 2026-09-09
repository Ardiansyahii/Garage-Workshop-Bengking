const db = require("../config/db");

// ==========================================
// 1. GET: Ambil Semua Daftar Bengkel (dengan Pagination)
// ==========================================
exports.getAllBengkels = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    let countQuery = "SELECT COUNT(*) as total FROM bengkels WHERE 1=1";
    let query =
      "SELECT id, name, address, phone, created_at FROM bengkels WHERE 1=1";
    let params = [];
    let countParams = [];

    if (search) {
      query += " AND (name LIKE ? OR address LIKE ?)";
      countQuery += " AND (name LIKE ? OR address LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(limitNum, offset);

    const [bengkels] = await db.query(query, params);

    return res.status(200).json({
      success: true,
      data: bengkels,
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
// 2. POST: Tambah Bengkel Baru
// ==========================================
exports.createBengkel = async (req, res, next) => {
  try {
    const { name, address, phone } = req.body;

    if (!name || !address || !phone) {
      return res.status(400).json({
        success: false,
        message: "Nama, alamat, dan nomor telepon bengkel wajib diisi!",
      });
    }

    await db.query(
      "INSERT INTO bengkels (name, address, phone) VALUES (?, ?, ?)",
      [name, address, phone],
    );

    return res.status(201).json({
      success: true,
      message: "Bengkel baru berhasil didaftarkan!",
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. DELETE: Hapus Bengkel
// ==========================================
exports.deleteBengkel = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await db.query("SELECT id FROM bengkels WHERE id = ?", [
      id,
    ]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Bengkel tidak ditemukan!",
      });
    }

    await db.query("DELETE FROM bengkels WHERE id = ?", [id]);

    return res.status(200).json({
      success: true,
      message: "Bengkel berhasil dihapus permanen!",
    });
  } catch (error) {
    next(error);
  }
};
