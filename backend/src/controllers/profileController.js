const bcrypt = require("bcryptjs");
const db = require("../config/db");

// ==========================================
// 1. GET: Ambil Data Profil Admin & Bengkelnya
// ==========================================
exports.getMyProfile = async (req, res, next) => {
  try {
    // Ambil ID Admin dan ID Bengkel dari Token JWT yang sedang login
    const adminId = req.user.id;
    const bengkelId = req.user.bengkel_id;

    // Ambil data admin
    const [adminData] = await db.query(
      "SELECT id, name, whatsapp, role FROM users WHERE id = ?",
      [adminId]
    );

    // Ambil data bengkel
    const [bengkelData] = await db.query(
      "SELECT * FROM bengkels WHERE id = ?",
      [bengkelId]
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
// 2. PUT: Update Profil Admin
// ==========================================
exports.updateAdminProfile = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const { name, whatsapp, password } = req.body;

    if (!name || !whatsapp) {
      return res.status(400).json({ success: false, message: "Nama dan WhatsApp wajib diisi!" });
    }

    // Jika user ingin ganti password
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      await db.query(
        "UPDATE users SET name = ?, whatsapp = ?, password = ? WHERE id = ?",
        [name, whatsapp, hashedPassword, adminId]
      );
    } else {
      // Jika password dikosongkan (tidak ingin diganti)
      await db.query(
        "UPDATE users SET name = ?, whatsapp = ? WHERE id = ?",
        [name, whatsapp, adminId]
      );
    }

    return res.status(200).json({ success: true, message: "Profil Admin berhasil diperbarui!" });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. PUT: Update Informasi Bengkel
// ==========================================
exports.updateBengkelInfo = async (req, res, next) => {
  try {
    const bengkelId = req.user.bengkel_id;
    
    // Kita tambahkan 'description' atau 'open_hours' jika di databasemu ada.
    // Sementara kita sesuaikan dengan struktur tabel bengkels yang sudah ada.
    const { name, address, phone } = req.body;

    if (!name || !address || !phone) {
      return res.status(400).json({ success: false, message: "Nama bengkel, alamat, dan telepon wajib diisi!" });
    }

    await db.query(
      "UPDATE bengkels SET name = ?, address = ?, phone = ? WHERE id = ?",
      [name, address, phone, bengkelId]
    );

    return res.status(200).json({ success: true, message: "Informasi Bengkel berhasil diperbarui!" });
  } catch (error) {
    next(error);
  }
};