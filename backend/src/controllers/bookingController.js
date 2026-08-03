const db = require("../config/db");
const { sendWhatsAppNotification } = require("../utils/fonnte");

// ==========================================
// 1. GET: Ambil & Cari Data Booking
// ==========================================
exports.getAllBookings = async (req, res, next) => {
  try {
    const { user_id, bengkel_id, search } = req.query;

    let query = `
      SELECT b.*, 
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

    if (user_id) {
      query += " AND b.user_id = ?";
      params.push(user_id);
    }
    if (bengkel_id) {
      query += " AND b.bengkel_id = ?";
      params.push(bengkel_id);
    }
    if (search) {
      query += " AND (b.booking_code LIKE ? OR u.name LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    query += " ORDER BY b.booking_date ASC, b.booking_time ASC";

    const [bookings] = await db.query(query, params);
    return res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    next(error); // Lempar ke Global Error Handler
  }
};

// ==========================================
// 1. POST: Membuat Booking Baru (+ Notifikasi WA)
// ==========================================
exports.createBooking = async (req, res, next) => {
  try {
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
      return res
        .status(400)
        .json({ success: false, message: "Semua data booking wajib diisi!" });
    }

    let resolvedVehicleId = vehicle_id;

    if (!resolvedVehicleId) {
      if (!vehicle_name || !license_plate) {
        return res.status(400).json({
          success: false,
          message: "Data kendaraan wajib diisi: nama kendaraan dan plat nomor.",
        });
      }

      const normalizedPlate = String(license_plate).trim().toUpperCase();
      const normalizedVehicleName = String(vehicle_name).trim();

      const [existingVehicle] = await db.query(
        "SELECT id FROM vehicles WHERE user_id = ? AND LOWER(TRIM(license_plate)) = LOWER(?) LIMIT 1",
        [user_id, normalizedPlate],
      );

      if (existingVehicle.length > 0) {
        resolvedVehicleId = existingVehicle[0].id;
      } else {
        const [vehicleResult] = await db.query(
          "INSERT INTO vehicles (user_id, vehicle_name, license_plate) VALUES (?, ?, ?)",
          [user_id, normalizedVehicleName, normalizedPlate],
        );
        resolvedVehicleId = vehicleResult.insertId;
      }
    }

    // Generate kode unik booking
    const booking_code = "APEX-" + Math.floor(10000 + Math.random() * 90000);

    await db.query(
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

    // Ambil data nomor WhatsApp pelanggan, nama bengkel, dan admin bengkel untuk dikirimi pesan WA
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

      // Susun isi pesan WhatsApp
      const message = `Halo Kak *${customer.name}*,\n\nTerima kasih telah melakukan booking servis di *${bengkelName}*.\n\nDetail Booking:\n- Kode Booking: *${booking_code}*\n- Tanggal: ${booking_date}\n- Jam: ${booking_time}\n- Status: Menunggu Konfirmasi\n\nSilakan datang tepat waktu ya!`;

      // Kirim pesan otomatis via Fonnte di latar belakang
      await sendWhatsAppNotification(customer.whatsapp, message);
    }

    if (adminData.length > 0) {
      const adminMessage = `📌 Booking baru masuk!\n\nKode Booking: *${booking_code}*\nPelanggan: *${userData[0]?.name || "Pelanggan"}*\nTanggal: ${booking_date}\nJam: ${booking_time}\n\nSegera lakukan konfirmasi dan persiapan servis.`;

      for (const admin of adminData) {
        if (admin.whatsapp) {
          await sendWhatsAppNotification(admin.whatsapp, adminMessage);
        }
      }
    }

    return res.status(201).json({
      success: true,
      message: "Booking berhasil dibuat & pesan WhatsApp telah dikirim!",
      booking_code,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. PATCH: Ubah Status Booking (+ Notifikasi WA)
// ==========================================
exports.updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["Menunggu", "Diproses", "Selesai", "Batal"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status tidak sesuai kriteria ujian!",
      });
    }

    // Update status di database
    await db.query("UPDATE bookings SET status = ? WHERE id = ?", [status, id]);

    // Ambil data booking, user, dan bengkel untuk kirim notifikasi perubahan status
    const [bookingDetails] = await db.query(
      `
      SELECT b.*, u.whatsapp, u.name as customer_name, bk.name as bengkel_name 
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

      // Kirim WhatsApp pemberitahuan status
      await sendWhatsAppNotification(item.whatsapp, message);
    }

    return res.status(200).json({
      success: true,
      message: `Status berhasil diubah menjadi ${status} & notifikasi WA terkirim!`,
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
    await db.query("DELETE FROM bookings WHERE id = ?", [id]);

    return res
      .status(200)
      .json({ success: true, message: "Riwayat booking berhasil dihapus!" });
  } catch (error) {
    next(error);
  }
};
