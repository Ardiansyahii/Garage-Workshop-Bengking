export async function sendWhatsAppMessage(target, message) {
  const token = process.env.FONNTE_TOKEN;

  if (!token) {
    console.error("Fonnte Token tidak ditemukan di environment variables!");
    return { success: false, message: "Token Fonnte tidak ada" };
  }

  try {
    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target: target,
        message: message,
        countryCode: "62", // Otomatis menyesuaikan nomor Indonesia
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Gagal mengirim WhatsApp via Fonnte:", error);
    return { success: false, message: error.message };
  }
}
