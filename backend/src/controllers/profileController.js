const bcrypt = require("bcryptjs");
const db = require("../config/db");

// ==========================================
// 1. GET: Ambil Data Profil (Admin / User)
// ==========================================
exports.getMyProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role; // Mengambil role dari payload JWT (misal: 'user', 'admin', dll)

    // Jika yang login adalah Pelanggan / User
    if (userRole === "user" || userRole === "pelanggan") {
      const [userData] = await db.query(
        "SELECT id, name, whatsapp, role FROM users WHERE id = ?",
        [userId],
      );

      return res.status(200).json({
        success: true,
        data: userData[0] || null,
      });
    }

    // Jika yang login adalah Admin / Owner Bengkel
    const bengkelId = req.user.bengkel_id;

    const [adminData] = await db.query(
      "SELECT id, name, whatsapp, role FROM users WHERE id = ?",
      [userId],
    );

    const [bengkelData] = await db.query(
      "SELECT * FROM bengkels WHERE id = ?",
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
// 2. PUT: Update Profil User / Pelanggan
// ==========================================
exports.updateUserProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, whatsapp, password } = req.body;

    if (!name || !whatsapp) {
      return res.status(400).json({
        success: false,
        message: "Nama dan WhatsApp wajib diisi!",
      });
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

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
      message: "Profil pelanggan berhasil diperbarui!",
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. PUT: Update Profil Admin
// ==========================================
exports.updateAdminProfile = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const { name, whatsapp, password } = req.body;

    if (!name || !whatsapp) {
      return res
        .status(400)
        .json({ success: false, message: "Nama dan WhatsApp wajib diisi!" });
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      await db.query(
        "UPDATE users SET name = ?, whatsapp = ?, password = ? WHERE id = ?",
        [name, whatsapp, hashedPassword, adminId],
      );
    } else {
      await db.query("UPDATE users SET name = ?, whatsapp = ? WHERE id = ?", [
        name,
        whatsapp,
        adminId,
      ]);
    }

    return res
      .status(200)
      .json({ success: true, message: "Profil Admin berhasil diperbarui!" });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 4. PUT: Update Informasi Bengkel
// ==========================================
exports.updateBengkelInfo = async (req, res, next) => {
  try {
    const bengkelId = req.user.bengkel_id;
    const { name, address, phone } = req.body;

    if (!name || !address || !phone) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Nama bengkel, alamat, dan telepon wajib diisi!",
        });
    }

    await db.query(
      "UPDATE bengkels SET name = ?, address = ?, phone = ? WHERE id = ?",
      [name, address, phone, bengkelId],
    );

    return res
      .status(200)
      .json({
        success: true,
        message: "Informasi Bengkel berhasil diperbarui!",
      });
  } catch (error) {
    next(error);
  }
};
