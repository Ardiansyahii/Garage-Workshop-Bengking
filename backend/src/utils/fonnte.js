/**
 * Helper untuk mengirim pesan WhatsApp melalui Fonnte API
 * @param {string} target - Nomor WhatsApp tujuan (Contoh: 08123456789 atau 628...)
 * @param {string} message - Isi pesan yang ingin dikirim
 * @param {object} options - Opsi tambahan payload Fonnte (opsional)
 */
const normalizeWhatsAppNumber = (target) => {
  if (!target || typeof target !== "string") {
    return null;
  }

  const cleaned = target.trim().replace(/\D/g, "");

  if (!cleaned) {
    return null;
  }

  if (cleaned.startsWith("0")) {
    return `62${cleaned.slice(1)}`;
  }

  return cleaned.startsWith("62") ? cleaned : `62${cleaned}`;
};

const sendWhatsAppNotification = async (target, message, options = {}) => {
  try {
    const token = process.env.FONNTE_TOKEN;
    const normalizedTarget = normalizeWhatsAppNumber(target);

    if (!token) {
      console.warn("⚠️ Fonnte Token belum diatur di file .env");
      return { success: false, message: "Token Fonnte belum diatur." };
    }

    if (!normalizedTarget) {
      console.warn(
        "⚠️ Nomor WhatsApp tujuan tidak valid, pengiriman Fonnte dilewati.",
      );
      return { success: false, message: "Nomor WhatsApp tujuan tidak valid." };
    }

    const payload = {
      target: normalizedTarget,
      message,
      ...options,
    };

    let lastError = null;

    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        const response = await fetch("https://api.fonnte.com/send", {
          method: "POST",
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json().catch(() => ({}));

        // TAMBAHAN: log respons ASLI dari Fonnte, baik sukses maupun gagal.
        // Ini kunci debugging-nya: lihat isi 'data' persis apa yang dibalas
        // Fonnte (status, reason, detail, device, dll).
        console.log(
          `📩 [Fonnte] target=${normalizedTarget} httpStatus=${response.status} response=`,
          JSON.stringify(data),
        );

        if (!response.ok || data?.status === false || data?.error) {
          lastError =
            data?.message || data?.reason || `HTTP ${response.status}`;
          if (attempt < 2) {
            continue;
          }

          return {
            success: false,
            message: lastError,
            data,
          };
        }

        return {
          success: true,
          data,
        };
      } catch (error) {
        lastError = error.message;
        if (attempt < 2) {
          continue;
        }

        return {
          success: false,
          message: error.message,
        };
      }
    }

    return {
      success: false,
      message: lastError || "Gagal mengirim WhatsApp via Fonnte.",
    };
  } catch (error) {
    console.error("🔥 Gagal mengirim pesan WhatsApp via Fonnte:", error);
    return {
      success: false,
      message: error.message,
    };
  }
};

module.exports = { sendWhatsAppNotification, normalizeWhatsAppNumber };