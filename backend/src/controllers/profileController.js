const db = require("../config/db");
const { hashPassword, validatePassword } = require("../utils/helpers");

// ==========================================
// 1. GET: Ambil Data Profil
// ==========================================
exports.getMyProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole === "pelanggan") {
      const [userData] = await db.query(
        "SELECT id, name, whatsapp, role FROM users WHERE id = ?",
        [userId],
      );

      return res.status(200).json({
        success: true,
        data: userData[0] || null,
      });
    }

    const bengkelId = req.user.bengkel_id;

    const [adminData] = await db.query(
      "SELECT id, name, whatsapp, role FROM users WHERE id = ?",
      [userId],
    );

    const [bengkelData] = await db.query(
      "SELECT id, name, address, phone FROM bengkels WHERE id = ?",
      [bengkelId],
    );

    return res.status(200).json({
      success: true,
      data: {
        admin: adminData[0],
        bengkel: bengkelData[0] || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. PUT: Update Profil (User / Admin — unified)
// ==========================================
const updateProfile = async (req, res, next, successMessage) => {
  try {
    const userId = req.user.id;
    const { name, whatsapp, password } = req.body;

    if (!name || !whatsapp) {
      return res.status(400).json({
        success: false,
        message: "Nama dan WhatsApp wajib diisi!",
      });
    }

    const [existing] = await db.query(
      "SELECT id FROM users WHERE whatsapp = ? AND id != ?",
      [whatsapp, userId],
    );
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Nomor WhatsApp sudah digunakan user lain!",
      });
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
        "UPDATE users SET name = ?, whatsapp = ?, password = ? WHERE id = ?",
        [name, whatsapp, hashedPassword, userId],
      );
    } else {
      await db.query("UPDATE users SET name = ?, whatsapp = ? WHERE id = ?", [
        name,
        whatsapp,
        userId,
      ]);
    }

    return res.status(200).json({
      success: true,
      message: successMessage,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateUserProfile = (req, res, next) =>
  updateProfile(req, res, next, "Profil pelanggan berhasil diperbarui!");

exports.updateAdminProfile = (req, res, next) =>
  updateProfile(req, res, next, "Profil Admin berhasil diperbarui!");

// ==========================================
// 3. PUT: Update Informasi Bengkel
// ==========================================
exports.updateBengkelInfo = async (req, res, next) => {
  try {
    const bengkelId = req.user.bengkel_id;
    const { name, address, phone } = req.body;

    if (!name || !address || !phone) {
      return res.status(400).json({
        success: false,
        message: "Nama bengkel, alamat, dan telepon wajib diisi!",
      });
    }

    const [existing] = await db.query(
      "SELECT id FROM bengkels WHERE id = ?",
      [bengkelId],
    );
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Bengkel tidak ditemukan!",
      });
    }

    await db.query(
      "UPDATE bengkels SET name = ?, address = ?, phone = ? WHERE id = ?",
      [name, address, phone, bengkelId],
    );

    return res.status(200).json({
      success: true,
      message: "Informasi Bengkel berhasil diperbarui!",
    });
  } catch (error) {
    next(error);
  }
};
