const db = require("../config/db");

// ==========================================
// 1. GET: Ambil Semua Daftar Bengkel
// ==========================================
exports.getAllBengkels = async (req, res, next) => {
  try {
    const [bengkels] = await db.query(
      "SELECT * FROM bengkels ORDER BY created_at DESC",
    );

    return res.status(200).json({
      success: true,
      data: bengkels,
    });
  } catch (error) {
    next(error); // Lempar ke Global Error Handler
  }
};

// ==========================================
// 2. POST: Tambah Bengkel Baru
// ==========================================
exports.createBengkel = async (req, res, next) => {
  try {
    const { name, address, phone } = req.body;

    // Validasi input wajib
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

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID Bengkel tidak valid!",
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
