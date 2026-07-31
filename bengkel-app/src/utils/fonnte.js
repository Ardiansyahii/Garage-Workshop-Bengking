// File: src/utils/fonnte.js

const sendWhatsApp = async (target, message) => {
  try {
    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        // GANTI TEKS DI BAWAH DENGAN TOKEN DARI AKUN FONNTE KAMU
        Authorization: "TOKEN_FONNTE_KAMU_DISINI",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target: target,
        message: message,
        countryCode: "62", // Format otomatis untuk nomor Indonesia
      }),
    });

    const data = await response.json();
    console.log("Status Fonnte:", data.detail || data.reason || "Terkirim");
    return data;
  } catch (error) {
    console.error("Gagal terhubung ke Fonnte:", error);
    return null;
  }
};

module.exports = { sendWhatsApp };
