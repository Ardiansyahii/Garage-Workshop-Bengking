const db = require("../config/db");

// ==========================================
// 1. GET: Ambil Layanan Berdasarkan Bengkel
// ==========================================
exports.getAllServices = async (req, res, next) => {
  try {
    const { bengkel_id } = req.query;

    let query = "SELECT * FROM services ORDER BY created_at DESC";
    let params = [];

    // Jika frontend mengirim bengkel_id, filter layanannya!
    if (bengkel_id) {
      query =
        "SELECT * FROM services WHERE bengkel_id = ? ORDER BY created_at DESC";
      params = [bengkel_id];
    }

    const [services] = await db.query(query, params);
    return res.status(200).json({ success: true, data: services });
  } catch (error) {
    next(error); // Lempar ke Global Error Handler
  }
};

// ==========================================
// 2. POST: Tambah Layanan Baru
// ==========================================
exports.createService = async (req, res, next) => {
  try {
    const { bengkel_id, service_name, price, description } = req.body;

    // Validasi input wajib sesuai syarat ujian
    if (!bengkel_id || !service_name || !price) {
      return res.status(400).json({
        success: false,
        message: "ID Bengkel, Nama Layanan, dan Harga wajib diisi!",
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

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "ID Layanan tidak valid!" });
    }

    await db.query("DELETE FROM services WHERE id = ?", [id]);

    return res
      .status(200)
      .json({ success: true, message: "Layanan berhasil dihapus!" });
  } catch (error) {
    next(error);
  }
};
