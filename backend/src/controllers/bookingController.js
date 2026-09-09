const db = require("../config/db");
const { sendWhatsAppNotification } = require("../utils/fonnte");
const { generateBookingCode } = require("../utils/helpers");

// ==========================================
// 1. GET: Ambil & Cari Data Booking (dengan Pagination)
// ==========================================
exports.getAllBookings = async (req, res, next) => {
  try {
    const { user_id, bengkel_id, search, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    let countQuery = `
      SELECT COUNT(*) as total
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      WHERE 1=1
    `;
    let query = `
      SELECT b.id, b.booking_date, b.booking_time, b.booking_code, b.status, b.created_at,
             u.name as customer_name, u.whatsapp as whatsapp_number,
             v.vehicle_name, v.license_plate,
             s.service_name, s.price,
             bk.name as bengkel_name
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN vehicles v ON b.vehicle_id = v.id
      JOIN services s ON b.service_id = s.id
      JOIN bengkels bk ON b.bengkel_id = bk.id
      WHERE 1=1
    `;
    let params = [];
    let countParams = [];

    if (user_id) {
      query += " AND b.user_id = ?";
      countQuery += " AND b.user_id = ?";
      params.push(user_id);
      countParams.push(user_id);
    }
    if (bengkel_id) {
      query += " AND b.bengkel_id = ?";
      countQuery += " AND b.bengkel_id = ?";
      params.push(bengkel_id);
      countParams.push(bengkel_id);
    }
    if (search) {
      query += " AND (b.booking_code LIKE ? OR u.name LIKE ?)";
      countQuery += " AND (b.booking_code LIKE ? OR u.name LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    query += " ORDER BY b.booking_date ASC, b.booking_time ASC LIMIT ? OFFSET ?";
    params.push(limitNum, offset);

    const [bookings] = await db.query(query, params);
    return res.status(200).json({
      success: true,
      data: bookings,
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
// 2. POST: Membuat Booking Baru (+ Notifikasi WA)
// ==========================================
exports.createBooking = async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const {
      user_id,
      bengkel_id,
      vehicle_id,
      service_id,
      booking_date,
      booking_time,
      vehicle_name,
      license_plate,
    } = req.body;

    if (!user_id || !bengkel_id || !service_id || !booking_date || !booking_time) {
      await connection.rollback();
      connection.release();
      return res
        .status(400)
        .json({ success: false, message: "Semua data booking wajib diisi!" });
    }

    let resolvedVehicleId = vehicle_id;

    if (!resolvedVehicleId) {
      if (!vehicle_name || !license_plate) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          message: "Data kendaraan wajib diisi: nama kendaraan dan plat nomor.",
        });
      }

      const normalizedPlate = String(license_plate).trim().toUpperCase();
      const normalizedVehicleName = String(vehicle_name).trim();

      const [existingVehicle] = await connection.query(
        "SELECT id FROM vehicles WHERE user_id = ? AND license_plate = ? LIMIT 1",
        [user_id, normalizedPlate],
      );

      if (existingVehicle.length > 0) {
        resolvedVehicleId = existingVehicle[0].id;
      } else {
        const [vehicleResult] = await connection.query(
          "INSERT INTO vehicles (user_id, vehicle_name, license_plate) VALUES (?, ?, ?)",
          [user_id, normalizedVehicleName, normalizedPlate],
        );
        resolvedVehicleId = vehicleResult.insertId;
      }
    }

    const booking_code = generateBookingCode();

    await connection.query(
      "INSERT INTO bookings (user_id, bengkel_id, vehicle_id, service_id, booking_date, booking_time, booking_code, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'Menunggu')",
      [
        user_id,
        bengkel_id,
        resolvedVehicleId,
        service_id,
        booking_date,
        booking_time,
        booking_code,
      ],
    );

    await connection.commit();
    connection.release();

    const [userData] = await db.query(
      "SELECT whatsapp, name FROM users WHERE id = ?",
      [user_id],
    );
    const [bengkelData] = await db.query(
      "SELECT name FROM bengkels WHERE id = ?",
      [bengkel_id],
    );
    const [adminData] = await db.query(
      "SELECT whatsapp, name FROM users WHERE role = 'admin_bengkel' AND bengkel_id = ?",
      [bengkel_id],
    );

    if (userData.length > 0) {
      const customer = userData[0];
      const bengkelName =
        bengkelData.length > 0 ? bengkelData[0].name : "Apex Garage";

      const message = `Halo Kak *${customer.name}*,\n\nTerima kasih telah melakukan booking servis di *${bengkelName}*.\n\nDetail Booking:\n- Kode Booking: *${booking_code}*\n- Tanggal: ${booking_date}\n- Jam: ${booking_time}\n- Status: Menunggu Konfirmasi\n\nSilakan datang tepat waktu ya!`;

      sendWhatsAppNotification(customer.whatsapp, message).catch(() => {});
    }

    if (adminData.length > 0) {
      const adminMessage = `📌 Booking baru masuk!\n\nKode Booking: *${booking_code}*\nPelanggan: *${userData[0]?.name || "Pelanggan"}*\nTanggal: ${booking_date}\nJam: ${booking_time}\n\nSegera lakukan konfirmasi dan persiapan servis.`;

      for (const admin of adminData) {
        if (admin.whatsapp) {
          sendWhatsAppNotification(admin.whatsapp, adminMessage).catch(() => {});
        }
      }
    }

    return res.status(201).json({
      success: true,
      message: "Booking berhasil dibuat!",
      booking_code,
    });
  } catch (error) {
    await connection.rollback();
    connection.release();
    next(error);
  }
};

// ==========================================
// 3. PATCH: Ubah Status Booking (+ Notifikasi WA)
// ==========================================
exports.updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["Menunggu", "Diproses", "Selesai", "Batal"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status tidak valid! Status harus salah satu dari: Menunggu, Diproses, Selesai, Batal.",
      });
    }

    const [existing] = await db.query(
      "SELECT id FROM bookings WHERE id = ?",
      [id],
    );
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking tidak ditemukan!",
      });
    }

    await db.query("UPDATE bookings SET status = ? WHERE id = ?", [status, id]);

    const [bookingDetails] = await db.query(
      `
      SELECT b.booking_code, b.status, u.whatsapp, u.name as customer_name, bk.name as bengkel_name 
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN bengkels bk ON b.bengkel_id = bk.id
      WHERE b.id = ?
    `,
      [id],
    );

    if (bookingDetails.length > 0) {
      const item = bookingDetails[0];

      let statusMessage = `Status booking servis Anda dengan kode *${item.booking_code}* di *${item.bengkel_name}* kini telah berubah menjadi: *${status}*.`;

      if (status === "Diproses") {
        statusMessage = `Kendaraan Anda sedang dalam proses pengerjaan oleh mekanik di *${item.bengkel_name}*. Mohon ditunggu ya!`;
      } else if (status === "Selesai") {
        statusMessage = `Yay! Servis kendaraan Anda dengan kode *${item.booking_code}* telah *SELESAI*. Silakan ambil kendaraan di *${item.bengkel_name}*. Terima kasih!`;
      }

      const message = `Halo *${item.customer_name}*,\n\n${statusMessage}`;

      sendWhatsAppNotification(item.whatsapp, message).catch(() => {});
    }

    return res.status(200).json({
      success: true,
      message: `Status berhasil diubah menjadi ${status}!`,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 4. DELETE: Hapus Booking
// ==========================================
exports.deleteBooking = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await db.query(
      "SELECT id FROM bookings WHERE id = ?",
      [id],
    );
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking tidak ditemukan!",
      });
    }

    await db.query("DELETE FROM bookings WHERE id = ?", [id]);

    return res
      .status(200)
      .json({ success: true, message: "Riwayat booking berhasil dihapus!" });
  } catch (error) {
    next(error);
  }
};
