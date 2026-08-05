import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Modal,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Wrench,
  ArrowLeft,
  Car,
  Calendar,
  Clock,
  MapPin,
  Store,
  ChevronRight,
  Briefcase,
  CheckCircle2,
  X,
  Tag,
} from "lucide-react-native";

// Samakan dengan API_URL di Login/Register/Verify/Dashboard screen kamu
const API_URL = Platform.select({
  web: "http://localhost:5000",
  android: "http://10.0.2.2:5000", // khusus Emulator Android
  default: "http://192.168.1.16:5000", // Ganti dengan IP Wi-Fi laptop kamu jika pakai HP Fisik (Expo Go)
});

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

// Helper format harga ke Rupiah
const formatRupiah = (value) => {
  const number = Number(value) || 0;
  return `Rp${number.toLocaleString("id-ID")}`;
};

// API Helper (sama pola dengan dashboard.jsx)
const fetchWithAuth = async (url, options = {}) => {
  const token = await AsyncStorage.getItem("auth_token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const response = await fetch(`${API_URL}${url}`, { ...options, headers });
  return await response.json();
};

export default function BookingScreen() {
  const router = useRouter();
  // Params dikirim dari Dashboard saat user sudah pilih bengkel + layanan lewat modal
  const params = useLocalSearchParams();

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State Data Master
  const [bengkels, setBengkels] = useState([]);
  const [services, setServices] = useState([]);
  const [schedules, setSchedules] = useState([]);

  // State Pemilihan
  const [selectedBengkel, setSelectedBengkel] = useState(null);

  // Flag: apakah booking ini datang langsung dari Dashboard (bengkel+layanan sudah fix)
  const [isPrefilled, setIsPrefilled] = useState(false);

  // State Konfirmasi Layanan (muncul sebelum lanjut ke form, HANYA untuk alur pilih manual)
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingService, setPendingService] = useState(null);

  // State Form
  const [formData, setFormData] = useState({
    vehicle_name: "",
    license_plate: "",
    service_id: "",
    service_name: "",
    booking_date: "",
    booking_time: "",
  });

  // Helper: ambil layanan & jadwal milik sebuah bengkel
  const loadServicesAndSchedules = async (bengkelId) => {
    try {
      const [serviceData, scheduleData] = await Promise.all([
        fetchWithAuth(`/api/services?bengkel_id=${bengkelId}`),
        fetchWithAuth(`/api/schedules/${bengkelId}`),
      ]);
      const serviceList = serviceData?.success ? serviceData.data : [];
      setServices(serviceList);
      setSchedules(scheduleData?.success ? scheduleData.data : []);
      return serviceList;
    } catch (err) {
      setServices([]);
      setSchedules([]);
      return [];
    }
  };

  // 1. Cek Sesi & Ambil Daftar Bengkel (+ auto-prefill jika datang dari Dashboard)
  useEffect(() => {
    const init = async () => {
      const session =
        (await AsyncStorage.getItem("user_session")) ||
        (await AsyncStorage.getItem("user"));

      if (!session) {
        Alert.alert(
          "Akses Dibatasi",
          "Silakan masuk atau daftar terlebih dahulu untuk melakukan booking.",
          [{ text: "OK", onPress: () => router.replace("/Login") }]
        );
        return;
      }

      setUser(JSON.parse(session));

      try {
        const data = await fetchWithAuth(`/api/bengkels`);
        const bengkelList = data?.success ? data.data || [] : [];
        setBengkels(bengkelList);

        // ===== AUTO-PREFILL: datang dari card bengkel/layanan di Dashboard =====
        if (params?.bengkel_id) {
          const matchedBengkel =
            bengkelList.find(
              (b) => String(b.id) === String(params.bengkel_id)
            ) || {
              id: params.bengkel_id,
              name: params.bengkel_name || "Bengkel Terpilih",
              address: "",
              phone: "",
            };

          setSelectedBengkel(matchedBengkel);

          const serviceList = await loadServicesAndSchedules(matchedBengkel.id);

          if (params?.service_id) {
            const matchedService = serviceList.find(
              (s) => String(s.id) === String(params.service_id)
            );

            setFormData((prev) => ({
              ...prev,
              service_id: matchedService ? matchedService.id : params.service_id,
              service_name: matchedService
                ? matchedService.service_name
                : params.service_name || "",
            }));

            setIsPrefilled(true);
          }
        }
      } catch (err) {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  // 2. Handler Saat Bengkel Dipilih (alur manual, tanpa params)
  const handleSelectBengkel = async (bengkel) => {
    setSelectedBengkel(bengkel);
    setIsPrefilled(false);
    setFormData((prev) => ({
      ...prev,
      service_id: "",
      service_name: "",
      booking_date: "",
      booking_time: "",
    }));

    await loadServicesAndSchedules(bengkel.id);
  };

  // 3. Kembali ke Daftar Bengkel
  const handleBackToBengkels = () => {
    setSelectedBengkel(null);
    setIsPrefilled(false);
    setServices([]);
    setSchedules([]);
    setFormData({
      vehicle_name: "",
      license_plate: "",
      service_id: "",
      service_name: "",
      booking_date: "",
      booking_time: "",
    });
  };

  // 3b. Saat kartu layanan ditekan -> buka modal konfirmasi dulu (bukan langsung pilih)
  const handlePressService = (service) => {
    setPendingService(service);
    setConfirmVisible(true);
  };

  const handleCancelConfirm = () => {
    setConfirmVisible(false);
    setPendingService(null);
  };

  // Setelah user menekan "Lanjutkan" di modal konfirmasi -> baru layanan resmi terpilih
  const handleConfirmService = () => {
    if (!pendingService) return;
    setFormData((prev) => ({
      ...prev,
      service_id: pendingService.id,
      service_name: pendingService.service_name,
    }));
    setConfirmVisible(false);
    setPendingService(null);
  };

  // Ganti layanan meski sudah datang dari Dashboard (opsional, kalau user berubah pikiran)
  const handleChangeService = (service) => {
    setIsPrefilled(false);
    handlePressService(service);
  };

  // 4. Validasi Tanggal (Cek Hari Libur) — dipanggil saat format tanggal sudah lengkap (YYYY-MM-DD)
  const validateDate = (dateStr) => {
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return;

    const dayName = DAYS[dateObj.getDay()];
    const schedule = schedules.find((s) => s.day_name === dayName);

    if (!schedule || schedule.is_closed) {
      Alert.alert(
        "Bengkel Tutup",
        `Maaf, ${selectedBengkel?.name} tutup/libur pada hari ${dayName}. Silakan pilih tanggal lain.`
      );
      setFormData((prev) => ({ ...prev, booking_date: "", booking_time: "" }));
      return;
    }

    setFormData((prev) => ({ ...prev, booking_date: dateStr, booking_time: "" }));
  };

  const handleDateChange = (text) => {
    setFormData((prev) => ({ ...prev, booking_date: text }));
    if (text.length === 10) {
      validateDate(text);
    }
  };

  // 5. Validasi Jam (Cek Jam Operasional) — dipanggil saat format jam sudah lengkap (HH:MM)
  const validateTime = (timeStr) => {
    if (!formData.booking_date) {
      Alert.alert("Pilih Tanggal Dulu", "Silakan tentukan tanggal servis terlebih dahulu.");
      setFormData((prev) => ({ ...prev, booking_time: "" }));
      return;
    }

    const dateObj = new Date(formData.booking_date);
    const schedule = schedules.find((s) => s.day_name === DAYS[dateObj.getDay()]);

    if (!schedule) {
      setFormData((prev) => ({ ...prev, booking_time: "" }));
      return;
    }

    const openTime = schedule.open_time.substring(0, 5);
    const closeTime = schedule.close_time.substring(0, 5);

    if (timeStr < openTime || timeStr > closeTime) {
      Alert.alert(
        "Di Luar Jam Operasional",
        `Pada hari tersebut, bengkel buka dari jam ${openTime} sampai ${closeTime}.`
      );
      setFormData((prev) => ({ ...prev, booking_time: "" }));
      return;
    }

    setFormData((prev) => ({ ...prev, booking_time: timeStr }));
  };

  const handleTimeChange = (text) => {
    setFormData((prev) => ({ ...prev, booking_time: text }));
    if (text.length === 5) {
      validateTime(text);
    }
  };

  // 6. Submit Data ke Backend
  const handleSubmit = async () => {
    if (!selectedBengkel || !formData.service_id) {
      Alert.alert("Data Belum Lengkap", "Pastikan kamu sudah memilih bengkel dan layanan.");
      return;
    }
    if (!formData.vehicle_name || !formData.license_plate) {
      Alert.alert("Data Belum Lengkap", "Nama kendaraan dan plat nomor wajib diisi.");
      return;
    }
    if (!formData.booking_date || !formData.booking_time) {
      Alert.alert("Data Belum Lengkap", "Tanggal dan jam servis wajib diisi.");
      return;
    }

    const payload = {
      bengkel_id: selectedBengkel.id,
      user_id: user.id,
      service_id: formData.service_id,
      vehicle_name: formData.vehicle_name,
      license_plate: formData.license_plate,
      booking_date: formData.booking_date,
      booking_time: formData.booking_time,
    };

    setIsSubmitting(true);
    try {
      const data = await fetchWithAuth(`/api/bookings`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (data?.success) {
        Alert.alert("Booking Berhasil!", "Pesanan kamu sudah masuk antrean bengkel.");
        router.replace("/dashboard");
      } else {
        Alert.alert("Gagal Booking", data.message || "Terjadi kesalahan.");
      }
    } catch (error) {
      Alert.alert("Error Jaringan", "Gagal terhubung ke server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !user) {
    return (
      <View style={styles.loadingContainer}>
        <Wrench size={32} color="#dc2626" />
        <Text style={styles.loadingText}>Menyiapkan Ruang Reservasi...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HEADER / BACK */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (selectedBengkel ? handleBackToBengkels() : router.back())}
        >
          <ArrowLeft size={14} color="#a1a1aa" />
          <Text style={styles.backBtnText}>
            {selectedBengkel ? "Ganti Bengkel" : "Kembali"}
          </Text>
        </TouchableOpacity>

        {!selectedBengkel ? (
          /* ============ STEP 1: PILIH BENGKEL ============ */
          <View>
            <Text style={styles.title}>Pilih Bengkel.</Text>
            <Text style={styles.subtitle}>
              Pilih lokasi bengkel mitra terdekat untuk perawatan kendaraan Anda.
            </Text>

            <View style={{ gap: 14, marginTop: 20 }}>
              {bengkels.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyBoxText}>
                    Belum ada bengkel mitra yang tersedia.
                  </Text>
                </View>
              ) : (
                bengkels.map((bengkel) => (
                  <TouchableOpacity
                    key={bengkel.id}
                    style={styles.bengkelCard}
                    onPress={() => handleSelectBengkel(bengkel)}
                  >
                    <Text style={styles.bengkelName}>{bengkel.name}</Text>
                    <View style={styles.bengkelAddressRow}>
                      <MapPin size={13} color="#71717a" />
                      <Text style={styles.bengkelAddress}>{bengkel.address}</Text>
                    </View>
                    <View style={styles.bengkelCardFooter}>
                      <View style={styles.badgeMitra}>
                        <Text style={styles.badgeMitraText}>Mitra Aktif</Text>
                      </View>
                      <ChevronRight size={16} color="#71717a" />
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>
        ) : (
          /* ============ STEP 2: LAYANAN + FORM ============ */
          <View>
            <Text style={[styles.title, { color: "#ef4444" }]}>
              {selectedBengkel.name}
            </Text>
            {!!selectedBengkel.address && (
              <View style={styles.bengkelAddressRow}>
                <MapPin size={14} color="#71717a" />
                <Text style={styles.subtitle}>{selectedBengkel.address}</Text>
              </View>
            )}

            {isPrefilled ? (
              /* ===== Layanan sudah dipilih dari Dashboard: tampilkan ringkas, tidak perlu pilih ulang ===== */
              <View style={styles.prefilledServiceBox}>
                <View style={styles.prefilledServiceRow}>
                  <View style={styles.prefilledIconWrap}>
                    <CheckCircle2 size={16} color="#34d399" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.prefilledLabel}>Layanan Terpilih</Text>
                    <Text style={styles.prefilledServiceName}>
                      {formData.service_name}
                    </Text>
                  </View>
                </View>

                {services.length > 0 && (
                  <TouchableOpacity
                    style={styles.prefilledChangeBtn}
                    onPress={() => setIsPrefilled(false)}
                  >
                    <Text style={styles.prefilledChangeBtnText}>Ganti Layanan</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <>
                <Text style={styles.sectionLabel}>Pilih Layanan Servis</Text>

                {services.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyBoxText}>
                      Bengkel ini belum mendaftarkan layanannya.
                    </Text>
                  </View>
                ) : (
                  <View style={{ gap: 10, marginBottom: 24 }}>
                    {services.map((service) => {
                      const isActive = formData.service_id === service.id;
                      return (
                        <TouchableOpacity
                          key={service.id}
                          style={[styles.serviceCard, isActive && styles.serviceCardActive]}
                          onPress={() => handleChangeService(service)}
                        >
                          <View style={{ flex: 1 }}>
                            <View style={styles.serviceNameRow}>
                              {isActive && <CheckCircle2 size={14} color="#ef4444" />}
                              <Text style={styles.serviceName}>{service.service_name}</Text>
                            </View>
                            <Text style={styles.serviceDesc}>
                              {service.description || "Perawatan standar"}
                            </Text>
                          </View>
                          <Text style={styles.servicePrice}>{service.price}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </>
            )}

            {/* FORM CARD - tampil setelah layanan tersedia (dari prefill atau konfirmasi manual) */}
            {!!formData.service_id && (
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>Form Reservasi</Text>
                <Text style={styles.formSubtitle}>Atur kendaraan dan jadwal pengerjaan.</Text>

                {/* Indikator Bengkel & Layanan Terpilih */}
                <View style={styles.summaryBox}>
                  <View style={styles.summaryRow}>
                    <View style={styles.summaryLabelRow}>
                      <Store size={13} color="#71717a" />
                      <Text style={styles.summaryLabel}>Bengkel</Text>
                    </View>
                    <Text style={styles.summaryValue}>{selectedBengkel.name}</Text>
                  </View>
                  <View style={[styles.summaryRow, styles.summaryRowBorder]}>
                    <View style={styles.summaryLabelRow}>
                      <Briefcase size={13} color="#71717a" />
                      <Text style={styles.summaryLabel}>Layanan</Text>
                    </View>
                    <Text
                      style={[
                        styles.summaryValue,
                        !formData.service_name && styles.summaryValuePending,
                      ]}
                    >
                      {formData.service_name || "Pilih di atas..."}
                    </Text>
                  </View>
                </View>

                {/* NAMA KENDARAAN */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>NAMA KENDARAAN</Text>
                  <View style={styles.inputWrapper}>
                    <Car size={16} color="#71717a" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Cth: Honda NMAX"
                      placeholderTextColor="#52525b"
                      value={formData.vehicle_name}
                      onChangeText={(v) =>
                        setFormData((prev) => ({ ...prev, vehicle_name: v }))
                      }
                    />
                  </View>
                </View>

                {/* PLAT NOMOR */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>PLAT NOMOR</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={[styles.textInput, { paddingLeft: 12 }]}
                      placeholder="B 1234 XYZ"
                      placeholderTextColor="#52525b"
                      autoCapitalize="characters"
                      value={formData.license_plate}
                      onChangeText={(v) =>
                        setFormData((prev) => ({ ...prev, license_plate: v }))
                      }
                    />
                  </View>
                </View>

                {/* TANGGAL SERVIS */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>TANGGAL SERVIS (YYYY-MM-DD)</Text>
                  <View style={styles.inputWrapper}>
                    <Calendar size={16} color="#71717a" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="2026-03-25"
                      placeholderTextColor="#52525b"
                      value={formData.booking_date}
                      maxLength={10}
                      onChangeText={handleDateChange}
                    />
                  </View>
                </View>

                {/* JAM SERVIS */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>JAM SERVIS (HH:MM)</Text>
                  <View style={styles.inputWrapper}>
                    <Clock size={16} color="#71717a" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="10:00"
                      placeholderTextColor="#52525b"
                      value={formData.booking_time}
                      editable={!!formData.booking_date}
                      maxLength={5}
                      onChangeText={handleTimeChange}
                    />
                  </View>
                </View>

                {/* SUBMIT */}
                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    (!selectedBengkel ||
                      !formData.service_id ||
                      !formData.booking_time ||
                      isSubmitting) &&
                      styles.submitBtnDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={
                    !selectedBengkel ||
                    !formData.service_id ||
                    !formData.booking_time ||
                    isSubmitting
                  }
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <CheckCircle2 size={16} color="#FFFFFF" />
                      <Text style={styles.submitBtnText}>Konfirmasi Reservasi</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* ================= MODAL: KONFIRMASI LAYANAN (harga & estimasi waktu) — hanya alur pilih manual ================= */}
      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancelConfirm}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalContent}>
            <View style={styles.confirmModalHeader}>
              <View style={styles.confirmModalIconWrap}>
                <Tag size={18} color="#dc2626" />
              </View>
              <Text style={styles.confirmModalTitle} numberOfLines={2}>
                {pendingService?.service_name}
              </Text>
              <TouchableOpacity onPress={handleCancelConfirm} style={styles.confirmModalCloseBtn}>
                <X size={16} color="#a1a1aa" />
              </TouchableOpacity>
            </View>

            {!!pendingService?.description && (
              <Text style={styles.confirmModalDesc}>{pendingService.description}</Text>
            )}

            <View style={styles.confirmDetailBox}>
              <View style={styles.confirmDetailRow}>
                <View style={styles.confirmDetailLabelRow}>
                  <Tag size={13} color="#71717a" />
                  <Text style={styles.confirmDetailLabel}>Harga</Text>
                </View>
                <Text style={styles.confirmDetailValuePrice}>
                  {formatRupiah(pendingService?.price)}
                </Text>
              </View>
              <View style={[styles.confirmDetailRow, styles.confirmDetailRowBorder]}>
                <View style={styles.confirmDetailLabelRow}>
                  <Clock size={13} color="#71717a" />
                  <Text style={styles.confirmDetailLabel}>Estimasi Waktu</Text>
                </View>
                <Text style={styles.confirmDetailValue}>
                  {pendingService?.duration || "± 30–60 menit (tergantung kondisi kendaraan)"}
                </Text>
              </View>
            </View>

            <View style={styles.confirmModalActions}>
              <TouchableOpacity style={styles.confirmModalCancelBtn} onPress={handleCancelConfirm}>
                <Text style={styles.confirmModalCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmModalOkBtn} onPress={handleConfirmService}>
                <Text style={styles.confirmModalOkText}>Lanjutkan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: "#71717a",
    fontSize: 13,
    fontWeight: "700",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    backgroundColor: "rgba(24, 24, 27, 0.6)",
    borderWidth: 1,
    borderColor: "#27272a",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  backBtnText: {
    color: "#a1a1aa",
    fontSize: 12,
    fontWeight: "600",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "900",
  },
  subtitle: {
    color: "#a1a1aa",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  sectionLabel: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 20,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#27272a",
    paddingBottom: 8,
  },
  emptyBox: {
    borderWidth: 1,
    borderColor: "#27272a",
    borderStyle: "dashed",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  emptyBoxText: {
    color: "#71717a",
    fontSize: 12,
    textAlign: "center",
  },
  bengkelCard: {
    backgroundColor: "rgba(24, 24, 27, 0.5)",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 16,
    padding: 16,
  },
  bengkelName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 8,
  },
  bengkelAddressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  bengkelAddress: {
    color: "#a1a1aa",
    fontSize: 11,
    flex: 1,
  },
  bengkelCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#27272a",
  },
  badgeMitra: {
    backgroundColor: "rgba(220, 38, 38, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeMitraText: {
    color: "#ef4444",
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(24, 24, 27, 0.5)",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  serviceCardActive: {
    backgroundColor: "rgba(220, 38, 38, 0.08)",
    borderColor: "#dc2626",
  },
  serviceNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  serviceName: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  serviceDesc: {
    color: "#a1a1aa",
    fontSize: 11,
    marginTop: 4,
  },
  servicePrice: {
    color: "#ef4444",
    fontSize: 12,
    fontWeight: "800",
    fontFamily: "monospace",
  },

  // BOX: Layanan sudah dipilih dari Dashboard (skip pemilihan ulang)
  prefilledServiceBox: {
    backgroundColor: "rgba(16, 185, 129, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.3)",
    borderRadius: 16,
    padding: 14,
    marginTop: 20,
    marginBottom: 20,
  },
  prefilledServiceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  prefilledIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(52, 211, 153, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  prefilledLabel: {
    color: "#a1a1aa",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  prefilledServiceName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    marginTop: 2,
  },
  prefilledChangeBtn: {
    alignSelf: "flex-start",
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
  },
  prefilledChangeBtnText: {
    color: "#a1a1aa",
    fontSize: 11,
    fontWeight: "700",
  },

  formCard: {
    backgroundColor: "rgba(9, 9, 11, 0.85)",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 24,
    padding: 20,
    marginTop: 4,
  },
  formTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 4,
  },
  formSubtitle: {
    color: "#a1a1aa",
    fontSize: 12,
    marginBottom: 18,
  },
  summaryBox: {
    backgroundColor: "rgba(0,0,0,0.5)",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  summaryRowBorder: {
    borderTopWidth: 1,
    borderTopColor: "rgba(39, 39, 42, 0.5)",
    marginTop: 4,
  },
  summaryLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  summaryLabel: {
    color: "#71717a",
    fontSize: 11,
    fontWeight: "700",
  },
  summaryValue: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  summaryValuePending: {
    color: "#ef4444",
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    color: "#a1a1aa",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 13,
    paddingVertical: 12,
  },
  submitBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#dc2626",
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 8,
  },
  submitBtnDisabled: {
    backgroundColor: "#27272a",
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 13,
  },

  // ===== MODAL KONFIRMASI LAYANAN =====
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  confirmModalContent: {
    width: "100%",
    backgroundColor: "#09090b",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 20,
    padding: 18,
    gap: 14,
  },
  confirmModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  confirmModalIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(220, 38, 38, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmModalTitle: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
  confirmModalCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmModalDesc: {
    color: "#a1a1aa",
    fontSize: 12,
    lineHeight: 18,
  },
  confirmDetailBox: {
    backgroundColor: "rgba(24, 24, 27, 0.6)",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 14,
    padding: 14,
  },
  confirmDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  confirmDetailRowBorder: {
    borderTopWidth: 1,
    borderTopColor: "rgba(39, 39, 42, 0.6)",
    marginTop: 4,
  },
  confirmDetailLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  confirmDetailLabel: {
    color: "#71717a",
    fontSize: 11,
    fontWeight: "700",
  },
  confirmDetailValue: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    flexShrink: 1,
    textAlign: "right",
    marginLeft: 12,
  },
  confirmDetailValuePrice: {
    color: "#34d399",
    fontSize: 13,
    fontWeight: "900",
  },
  confirmModalActions: {
    flexDirection: "row",
    gap: 10,
  },
  confirmModalCancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
    alignItems: "center",
  },
  confirmModalCancelText: {
    color: "#a1a1aa",
    fontSize: 13,
    fontWeight: "700",
  },
  confirmModalOkBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: "#dc2626",
    alignItems: "center",
  },
  confirmModalOkText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
});