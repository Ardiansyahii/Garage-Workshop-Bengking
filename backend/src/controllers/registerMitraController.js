const db = require("../config/db");
const { sendWhatsAppNotification } = require("../utils/fonnte");
const { hashPassword, validatePassword } = require("../utils/helpers");

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

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({
        success: false,
        message: passwordCheck.message,
      });
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

    const hashedPassword = await hashPassword(password);

    await db.query(
      "INSERT INTO mitra_requests (owner_name, whatsapp, password, bengkel_name, address, phone, status) VALUES (?, ?, ?, ?, ?, ?, 'pending')",
      [owner_name, whatsapp, hashedPassword, bengkel_name, address, phone],
    );

    const superadminNumber = process.env.SUPERADMIN_WHATSAPP;
    if (superadminNumber) {
      const superadminMessage = `👋 Ada pengajuan mitra baru!\n\nNama Pemilik: *${owner_name}*\nNama Bengkel: *${bengkel_name}*\nNomor WA: *${whatsapp}*\nAlamat: ${address}\n\nSilakan cek halaman verifikasi mitra.`;

      sendWhatsAppNotification(superadminNumber, superadminMessage).catch(
        () => {},
      );
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
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const [countResult] = await db.query(
      "SELECT COUNT(*) as total FROM mitra_requests WHERE status = 'pending'",
    );
    const total = countResult[0].total;

    const [requests] = await db.query(
      "SELECT id, owner_name, whatsapp, bengkel_name, address, phone, status, created_at FROM mitra_requests WHERE status = 'pending' ORDER BY created_at DESC LIMIT ? OFFSET ?",
      [limitNum, offset],
    );

    return res.status(200).json({
      success: true,
      data: requests,
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
// 3. POST: Setujui (Approve) Pengajuan
// ==========================================
exports.approveMitraRequest = async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;

    const [requestData] = await connection.query(
      "SELECT * FROM mitra_requests WHERE id = ?",
      [id],
    );
    if (requestData.length === 0) {
      await connection.rollback();
      connection.release();
      return res
        .status(404)
        .json({ success: false, message: "Data tidak ditemukan." });
    }

    const data = requestData[0];

    if (data.status !== "pending") {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        success: false,
        message: "Pengajuan ini sudah diproses sebelumnya.",
      });
    }

    const [bengkelResult] = await connection.query(
      "INSERT INTO bengkels (name, address, phone) VALUES (?, ?, ?)",
      [data.bengkel_name, data.address, data.phone],
    );
    const newBengkelId = bengkelResult.insertId;

    await connection.query(
      "INSERT INTO users (name, whatsapp, password, role, bengkel_id) VALUES (?, ?, ?, 'admin_bengkel', ?)",
      [data.owner_name, data.whatsapp, data.password, newBengkelId],
    );

    await connection.query(
      "UPDATE mitra_requests SET status = 'approved' WHERE id = ?",
      [id],
    );

    await connection.commit();
    connection.release();

    const approvalMessage = `Selamat! Pengajuan mitra Anda untuk bengkel *${data.bengkel_name}* telah *disetujui*.\n\nAkun admin bengkel Anda sudah aktif. Silakan login untuk mengelola bengkel.`;
    sendWhatsAppNotification(data.whatsapp, approvalMessage).catch(() => {});

    return res.status(200).json({
      success: true,
      message: "Mitra berhasil disetujui & akun telah dibuat!",
    });
  } catch (error) {
    await connection.rollback();
    connection.release();
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
      "SELECT id, whatsapp, bengkel_name, status FROM mitra_requests WHERE id = ?",
      [id],
    );

    if (requestData.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Data tidak ditemukan." });
    }

    const data = requestData[0];

    if (data.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Pengajuan ini sudah diproses sebelumnya.",
      });
    }

    await db.query(
      "UPDATE mitra_requests SET status = 'rejected' WHERE id = ?",
      [id],
    );

    const rejectedMessage = `Mohon maaf, pengajuan mitra untuk bengkel *${data.bengkel_name}* belum dapat disetujui saat ini.\n\nSilakan cek kembali data dan kirim ulang pengajuan dengan informasi yang valid.`;
    sendWhatsAppNotification(data.whatsapp, rejectedMessage).catch(() => {});

    return res
      .status(200)
      .json({ success: true, message: "Pengajuan mitra ditolak." });
  } catch (error) {
    next(error);
  }
};
