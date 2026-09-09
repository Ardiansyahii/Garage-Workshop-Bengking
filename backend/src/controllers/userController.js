const bcrypt = require("bcryptjs");
const db = require("../config/db");
const { hashPassword, validatePassword } = require("../utils/helpers");

// ==========================================
// 1. GET: Ambil Semua Data Pelanggan (dengan Pagination)
// ==========================================
exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    let countQuery =
      "SELECT COUNT(*) as total FROM users WHERE role = 'pelanggan' AND 1=1";
    let query =
      "SELECT id, name, whatsapp, created_at FROM users WHERE role = 'pelanggan' AND 1=1";
    let params = [];
    let countParams = [];

    if (search) {
      query += " AND (name LIKE ? OR whatsapp LIKE ?)";
      countQuery += " AND (name LIKE ? OR whatsapp LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(limitNum, offset);

    const [users] = await db.query(query, params);

    return res.status(200).json({
      success: true,
      data: users,
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
// 2. POST: Tambah Pelanggan Baru (Dari Web)
// ==========================================
exports.createUser = async (req, res, next) => {
  try {
    const { name, whatsapp, password } = req.body;

    if (!name || !whatsapp || !password) {
      return res.status(400).json({
        success: false,
        message: "Nama, WhatsApp, dan Password wajib diisi!",
      });
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({
        success: false,
        message: passwordCheck.message,
      });
    }

    const [existing] = await db.query(
      "SELECT id FROM users WHERE whatsapp = ?",
      [whatsapp],
    );
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Nomor WhatsApp sudah terdaftar!",
      });
    }

    const hashedPassword = await hashPassword(password);

    await db.query(
      "INSERT INTO users (name, whatsapp, password, role) VALUES (?, ?, ?, 'pelanggan')",
      [name, whatsapp, hashedPassword],
    );

    return res.status(201).json({
      success: true,
      message: "Pelanggan berhasil ditambahkan!",
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. DELETE: Hapus Pelanggan
// ==========================================
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await db.query(
      "SELECT id FROM users WHERE id = ? AND role = 'pelanggan'",
      [id],
    );
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pelanggan tidak ditemukan!",
      });
    }

    await db.query("DELETE FROM users WHERE id = ? AND role = 'pelanggan'", [
      id,
    ]);

    return res.status(200).json({
      success: true,
      message: "Pelanggan berhasil dihapus!",
    });
  } catch (error) {
    next(error);
  }
};