const express = require("express");
const router = express.Router();
const db = require("../config/db");

// ==========================================
// 1. POST: Kirim Pengajuan Kemitraan
// ==========================================
router.post("/", async (req, res) => {
  try {
    const { owner_name, whatsapp, password, bengkel_name, address, phone } =
      req.body;

    if (
      !owner_name ||
      !whatsapp ||
      !password ||
      !bengkel_name ||
      !address ||
      !phone
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Semua kolom wajib diisi!" });
    }

    // Cek apakah nomor WA sudah dipakai di user utama atau sedang menunggu persetujuan
    const [existingUser] = await db.query(
      "SELECT id FROM users WHERE whatsapp = ?",
      [whatsapp],
    );
    const [pendingRequest] = await db.query(
      "SELECT id FROM mitra_requests WHERE whatsapp = ? AND status = 'pending'",
      [whatsapp],
    );

    if (existingUser.length > 0 || pendingRequest.length > 0) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Nomor WhatsApp sudah terdaftar atau sedang dalam proses verifikasi!",
        });
    }

    // Masukkan ke Ruang Tunggu (mitra_requests)
    await db.query(
      "INSERT INTO mitra_requests (owner_name, whatsapp, password, bengkel_name, address, phone, status) VALUES (?, ?, ?, ?, ?, ?, 'pending')",
      [owner_name, whatsapp, password, bengkel_name, address, phone],
    );

    return res
      .status(201)
      .json({
        success: true,
        message:
          "Pengajuan berhasil dikirim! Tim kami akan memverifikasi data Anda.",
      });
  } catch (error) {
    console.error("Error Register Mitra:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Terjadi kesalahan pada server saat mengirim pengajuan.",
      });
  }
});

// ==========================================
// 2. GET: Ambil Daftar Pengajuan (Untuk Superadmin)
// ==========================================
router.get("/requests", async (req, res) => {
  try {
    const [requests] = await db.query(
      "SELECT * FROM mitra_requests WHERE status = 'pending' ORDER BY created_at DESC",
    );
    return res.status(200).json({ success: true, data: requests });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Gagal mengambil data pengajuan." });
  }
});

// ==========================================
// 3. POST: Setujui (Approve) Pengajuan
// ==========================================
router.post("/approve/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Ambil data dari ruang tunggu
    const [requestData] = await db.query(
      "SELECT * FROM mitra_requests WHERE id = ?",
      [id],
    );
    if (requestData.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "Data tidak ditemukan." });

    const data = requestData[0];

    // Eksekusi 1: Masukkan ke tabel bengkels
    const [bengkelResult] = await db.query(
      "INSERT INTO bengkels (name, address, phone) VALUES (?, ?, ?)",
      [data.bengkel_name, data.address, data.phone],
    );
    const newBengkelId = bengkelResult.insertId;

    // Eksekusi 2: Buat akun Admin Bengkel
    await db.query(
      "INSERT INTO users (name, whatsapp, password, role, bengkel_id) VALUES (?, ?, ?, 'admin_bengkel', ?)",
      [data.owner_name, data.whatsapp, data.password, newBengkelId],
    );

    // Eksekusi 3: Ubah status menjadi approved
    await db.query(
      "UPDATE mitra_requests SET status = 'approved' WHERE id = ?",
      [id],
    );

    return res
      .status(200)
      .json({
        success: true,
        message: "Mitra berhasil disetujui & akun telah dibuat!",
      });
  } catch (error) {
    console.error("Error Approve Mitra:", error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal menyetujui mitra." });
  }
});

// ==========================================
// 4. POST: Tolak (Reject) Pengajuan
// ==========================================
router.post("/reject/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(
      "UPDATE mitra_requests SET status = 'rejected' WHERE id = ?",
      [id],
    );
    return res
      .status(200)
      .json({ success: true, message: "Pengajuan mitra ditolak." });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Gagal menolak mitra." });
  }
});

module.exports = router;
