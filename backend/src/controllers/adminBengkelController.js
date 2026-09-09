const bcrypt = require("bcryptjs");
const db = require("../config/db");
const { hashPassword, validatePassword } = require("../utils/helpers");

// ==========================================
// 1. GET: Ambil Semua Admin Bengkel (dengan Pagination)
// ==========================================
exports.getAllAdminBengkels = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    let countQuery = `
      SELECT COUNT(*) as total
      FROM users u 
      LEFT JOIN bengkels b ON u.bengkel_id = b.id 
      WHERE u.role = 'admin_bengkel' AND 1=1
    `;
    let query = `
      SELECT u.id, u.name, u.whatsapp, u.bengkel_id, b.name AS bengkel_name 
      FROM users u 
      LEFT JOIN bengkels b ON u.bengkel_id = b.id 
      WHERE u.role = 'admin_bengkel' AND 1=1
    `;
    let params = [];
    let countParams = [];

    if (search) {
      query += " AND (u.name LIKE ? OR u.whatsapp LIKE ? OR b.name LIKE ?)";
      countQuery += " AND (u.name LIKE ? OR u.whatsapp LIKE ? OR b.name LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    query += " ORDER BY u.created_at DESC LIMIT ? OFFSET ?";
    params.push(limitNum, offset);

    const [admins] = await db.query(query, params);
    return res.status(200).json({
      success: true,
      data: admins,
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
// 2. POST: Tambah Admin Bengkel Baru
// ==========================================
exports.createAdminBengkel = async (req, res, next) => {
  try {
    const { name, whatsapp, password, bengkel_id } = req.body;

    if (!name || !whatsapp || !password || !bengkel_id) {
      return res
        .status(400)
        .json({ success: false, message: "Semua data wajib diisi!" });
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
      return res
        .status(400)
        .json({ success: false, message: "Nomor WhatsApp sudah terdaftar!" });
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

    const hashedPassword = await hashPassword(password);

    await db.query(
      "INSERT INTO users (name, whatsapp, password, role, bengkel_id) VALUES (?, ?, ?, 'admin_bengkel', ?)",
      [name, whatsapp, hashedPassword, bengkel_id],
    );

    return res
      .status(201)
      .json({ success: true, message: "Akun Admin Bengkel berhasil dibuat!" });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. PUT: Edit Admin Bengkel
// ==========================================
exports.updateAdminBengkel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, whatsapp, password, bengkel_id } = req.body;

    const [existing] = await db.query(
      "SELECT id FROM users WHERE id = ? AND role = 'admin_bengkel'",
      [id],
    );
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Admin Bengkel tidak ditemukan!",
      });
    }

    if (whatsapp) {
      const [whatsappCheck] = await db.query(
        "SELECT id FROM users WHERE whatsapp = ? AND id != ?",
        [whatsapp, id],
      );
      if (whatsappCheck.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Nomor WhatsApp sudah digunakan user lain!",
        });
      }
    }

    if (bengkel_id) {
      const [bengkelCheck] = await db.query(
        "SELECT id FROM bengkels WHERE id = ?",
        [bengkel_id],
      );
      if (bengkelCheck.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Bengkel tidak ditemukan!",
        });
      }
    }

    if (password) {
      const passwordCheck = validatePassword(password);
      if (!passwordCheck.valid) {
        return res.status(400).json({
          success: false,
          message: passwordCheck.message,
        });
      }

      const hashedPassword = await hashPassword(password);
      await db.query(
        "UPDATE users SET name = ?, whatsapp = ?, password = ?, bengkel_id = ? WHERE id = ? AND role = 'admin_bengkel'",
        [name, whatsapp, hashedPassword, bengkel_id, id],
      );
    } else {
      await db.query(
        "UPDATE users SET name = ?, whatsapp = ?, bengkel_id = ? WHERE id = ? AND role = 'admin_bengkel'",
        [name, whatsapp, bengkel_id, id],
      );
    }

    return res.status(200).json({
      success: true,
      message: "Data Admin Bengkel berhasil diupdate!",
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 4. DELETE: Hapus Admin Bengkel
// ==========================================
exports.deleteAdminBengkel = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await db.query(
      "SELECT id FROM users WHERE id = ? AND role = 'admin_bengkel'",
      [id],
    );
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Admin Bengkel tidak ditemukan!",
      });
    }

    await db.query(
      "DELETE FROM users WHERE id = ? AND role = 'admin_bengkel'",
      [id],
    );

    return res
      .status(200)
      .json({ success: true, message: "Akun Admin Bengkel berhasil dihapus!" });
  } catch (error) {
    next(error);
  }
};