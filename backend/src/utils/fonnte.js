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
      console.warn("Fonnte Token belum diatur di file .env");
      return { success: false, message: "Token Fonnte belum diatur." };
    }

    if (!normalizedTarget) {
      console.warn("Nomor WhatsApp tujuan tidak valid.");
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

        if (!response.ok || data?.status === false || data?.error) {
          lastError =
            data?.message || data?.reason || `HTTP ${response.status}`;
          if (attempt < 2) {
            continue;
          }

          return {
            success: false,
            message: lastError,
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
    console.error("Gagal mengirim pesan WhatsApp via Fonnte:", error.message);
    return {
      success: false,
      message: "Gagal mengirim pesan WhatsApp.",
    };
  }
};

module.exports = { sendWhatsAppNotification, normalizeWhatsAppNumber };
