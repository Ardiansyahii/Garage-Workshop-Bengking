const bcrypt = require("bcryptjs");
const db = require("../config/db");
const { sendWhatsAppNotification } = require("../utils/fonnte"); // Pastikan diimport di atas

// ==========================================
// 1. POST: Kirim Pengajuan Kemitraan (Public)
// ==========================================
exports.createMitraRequest = async (req, res, next) => {
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

    const [existingUser] = await db.query(
      "SELECT id FROM users WHERE whatsapp = ?",
      [whatsapp],
    );
    const [pendingRequest] = await db.query(
      "SELECT id FROM mitra_requests WHERE whatsapp = ? AND status = 'pending'",
      [whatsapp],
    );

    if (existingUser.length > 0 || pendingRequest.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Nomor WhatsApp sudah terdaftar atau sedang dalam proses verifikasi!",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await db.query(
      "INSERT INTO mitra_requests (owner_name, whatsapp, password, bengkel_name, address, phone, status) VALUES (?, ?, ?, ?, ?, ?, 'pending')",
      [owner_name, whatsapp, hashedPassword, bengkel_name, address, phone],
    );

    const superadminNumber = process.env.SUPERADMIN_WHATSAPP;
    if (superadminNumber) {
      const superadminMessage = `👋 Ada pengajuan mitra baru!\n\nNama Pemilik: *${owner_name}*\nNama Bengkel: *${bengkel_name}*\nNomor WA: *${whatsapp}*\nAlamat: ${address}\n\nSilakan cek halaman verifikasi mitra.`;

      await sendWhatsAppNotification(superadminNumber, superadminMessage);
    }

    return res.status(201).json({
      success: true,
      message:
        "Pengajuan berhasil dikirim! Tim kami akan memverifikasi data Anda.",
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. GET: Ambil Daftar Pengajuan (Khusus Superadmin)
// ==========================================
exports.getMitraRequests = async (req, res, next) => {
  try {
    const [requests] = await db.query(
      "SELECT * FROM mitra_requests WHERE status = 'pending' ORDER BY created_at DESC",
    );
    return res.status(200).json({ success: true, data: requests });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. POST: Setujui (Approve) Pengajuan
// ==========================================
exports.approveMitraRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [requestData] = await db.query(
      "SELECT * FROM mitra_requests WHERE id = ?",
      [id],
    );
    if (requestData.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Data tidak ditemukan." });
    }

    const data = requestData[0];

    const [bengkelResult] = await db.query(
      "INSERT INTO bengkels (name, address, phone) VALUES (?, ?, ?)",
      [data.bengkel_name, data.address, data.phone],
    );
    const newBengkelId = bengkelResult.insertId;

    await db.query(
      "INSERT INTO users (name, whatsapp, password, role, bengkel_id) VALUES (?, ?, ?, 'admin_bengkel', ?)",
      [data.owner_name, data.whatsapp, data.password, newBengkelId],
    );

    await db.query(
      "UPDATE mitra_requests SET status = 'approved' WHERE id = ?",
      [id],
    );

    const approvalMessage = `Selamat! Pengajuan mitra Anda untuk bengkel *${data.bengkel_name}* telah *disetujui*.\n\nAkun admin bengkel Anda sudah aktif. Silakan login untuk mengelola bengkel.`;
    await sendWhatsAppNotification(data.whatsapp, approvalMessage);

    return res.status(200).json({
      success: true,
      message: "Mitra berhasil disetujui & akun telah dibuat!",
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 4. POST: Tolak (Reject) Pengajuan
// ==========================================
exports.rejectMitraRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [requestData] = await db.query(
      "SELECT * FROM mitra_requests WHERE id = ?",
      [id],
    );

    if (requestData.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Data tidak ditemukan." });
    }

    const data = requestData[0];

    await db.query(
      "UPDATE mitra_requests SET status = 'rejected' WHERE id = ?",
      [id],
    );

    const rejectedMessage = `Mohon maaf, pengajuan mitra untuk bengkel *${data.bengkel_name}* belum dapat disetujui saat ini.\n\nSilakan cek kembali data dan kirim ulang pengajuan dengan informasi yang valid.`;
    await sendWhatsAppNotification(data.whatsapp, rejectedMessage);

    return res
      .status(200)
      .json({ success: true, message: "Pengajuan mitra ditolak." });
  } catch (error) {
    next(error);
  }
};
