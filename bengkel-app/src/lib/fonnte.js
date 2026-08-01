export async function sendWhatsAppMessage() {
  console.warn(
    "Fonnte hanya boleh dipakai dari backend. Token tidak boleh dikirim dari frontend.",
  );
  return {
    success: false,
    message:
      "Fonnte harus dikirim melalui API backend untuk keamanan dan validasi yang benar.",
  };
}
