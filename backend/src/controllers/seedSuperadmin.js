
const db = require("../config/db.js");
const bcrypt = require("bcrypt");

async function createSuperadmin() {
  try {
    const name = "Superadmin1";
    const whatsapp = "6281234567890"; // Ganti dengan nomor WhatsApp kamu
    const password = "SuperAdmin123!";
    const role = "superadmin";

    console.log("Memeriksa akun Superadmin...");

    // Cek apakah nomor WhatsApp sudah terdaftar
    const [existing] = await db.query(
      "SELECT * FROM users WHERE whatsapp = ?",
      [whatsapp]
    );

    if (existing.length > 0) {
      console.log("Nomor WhatsApp sudah terdaftar!");
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert akun Superadmin
    await db.query(
      `INSERT INTO users (name, whatsapp, password, role)
       VALUES (?, ?, ?, ?)`,
      [name, whatsapp, hashedPassword, role]
    );

    console.log("================================");
    console.log("SUPERADMIN BERHASIL DIBUAT");
    console.log("================================");
    console.log("Nama     :", name);
    console.log("WhatsApp :", whatsapp);
    console.log("Password :", password);
    console.log("Role     :", role);
    console.log("================================");

  } catch (error) {
    console.error("Gagal membuat Superadmin:", error.message);
  } finally {
    if (typeof db.end === "function") {
      await db.end();
    }
  }
}

createSuperadmin();
