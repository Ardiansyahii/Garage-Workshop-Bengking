const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const db = require("../config/db");

// ==========================================
// 1. API REGISTER (Khusus Pelanggan via Mobile)
// ==========================================
router.post("/register", async (req, res) => {
  try {
    const { name, whatsapp, password } = req.body;

    // Validasi input wajib (Syarat Ujian)
    if (!name || !whatsapp || !password) {
      return res.status(400).json({
        success: false,
        message: "Nama, Nomor WhatsApp, dan Password wajib diisi!"
      });
    }

    // Cek apakah nomor WhatsApp sudah dipakai
    const [existingUsers] = await db.query("SELECT * FROM users WHERE whatsapp = ?", [whatsapp]);
    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Nomor WhatsApp sudah terdaftar! Silakan gunakan nomor lain."
      });
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Simpan ke Database (Otomatis role: 'pelanggan', bengkel_id: NULL)
    await db.query(
      "INSERT INTO users (name, whatsapp, password, role) VALUES (?, ?, ?, 'pelanggan')",
      [name, whatsapp, hashedPassword]
    );

    return res.status(201).json({
      success: true,
      message: "Registrasi berhasil! Silakan masuk melalui aplikasi mobile."
    });

  } catch (error) {
    console.error("Error Register API:", error);
    return res.status(500).json({ success: false, message: "Terjadi kesalahan server saat registrasi." });
  }
});

// ==========================================
// 2. API LOGIN (Superadmin, Admin Bengkel, Pelanggan)
// ==========================================
router.post("/login", async (req, res) => {
  try {
    const { whatsapp, password } = req.body;

    // Validasi input wajib
    if (!whatsapp || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Nomor WhatsApp dan password wajib diisi!" 
      });
    }

    // Cari user di database
    const [users] = await db.query("SELECT * FROM users WHERE whatsapp = ?", [whatsapp]);
    if (users.length === 0) {
      return res.status(400).json({ success: false, message: "Nomor WhatsApp tidak terdaftar!" });
    }

    const user = users[0];

    // Cek kecocokan password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ success: false, message: "Password salah!" });
    }

    // Response sukses, kirimkan role dan bengkel_id agar frontend tahu harus diarahkan ke mana
    return res.status(200).json({
      success: true,
      message: `Login berhasil sebagai ${user.role}!`,
      role: user.role, 
      user: {
        id: user.id,
        name: user.name,
        whatsapp: user.whatsapp,
        role: user.role,
        bengkel_id: user.bengkel_id // Sangat penting untuk memfilter data Admin Bengkel nantinya
      },
    });

  } catch (error) {
    console.error("Error Login API:", error);
    return res.status(500).json({ success: false, message: "Terjadi kesalahan server." });
  }
});

module.exports = router;