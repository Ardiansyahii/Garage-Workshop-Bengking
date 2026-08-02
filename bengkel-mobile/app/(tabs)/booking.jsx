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
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
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
} from "lucide-react-native";

// Samakan dengan API_URL di Login/Register/Verify/Dashboard screen kamu
const API_URL = Platform.select({
  web: "http://localhost:5000",
  android: "http://10.0.2.2:5000", // khusus Emulator Android
  default: "http://192.168.1.16:5000", // Ganti dengan IP Wi-Fi laptop kamu jika pakai HP Fisik (Expo Go)
});

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

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
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State Data Master
  const [bengkels, setBengkels] = useState([]);
  const [services, setServices] = useState([]);
  const [schedules, setSchedules] = useState([]);

  // State Pemilihan
  const [selectedBengkel, setSelectedBengkel] = useState(null);

  // State Form
  const [formData, setFormData] = useState({
    vehicle_name: "",
    license_plate: "",
    service_id: "",
    service_name: "",
    booking_date: "",
    booking_time: "",
  });

  // 1. Cek Sesi & Ambil Daftar Bengkel
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
        if (data?.success) setBengkels(data.data || []);
      } catch (err) {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  // 2. Handler Saat Bengkel Dipilih
  const handleSelectBengkel = async (bengkel) => {
    setSelectedBengkel(bengkel);
    setFormData((prev) => ({
      ...prev,
      service_id: "",
      service_name: "",
      booking_date: "",
      booking_time: "",
    }));

    try {
      const [serviceData, scheduleData] = await Promise.all([
        fetchWithAuth(`/api/services?bengkel_id=${bengkel.id}`),
        fetchWithAuth(`/api/schedules/${bengkel.id}`),
      ]);
      setServices(serviceData?.success ? serviceData.data : []);
      setSchedules(scheduleData?.success ? scheduleData.data : []);
    } catch (err) {
      setServices([]);
      setSchedules([]);
    }
  };

  // 3. Kembali ke Daftar Bengkel
  const handleBackToBengkels = () => {
    setSelectedBengkel(null);
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
          /* ============ STEP 2: PILIH LAYANAN + FORM ============ */
          <View>
            <Text style={[styles.title, { color: "#ef4444" }]}>
              {selectedBengkel.name}
            </Text>
            <View style={styles.bengkelAddressRow}>
              <MapPin size={14} color="#71717a" />
              <Text style={styles.subtitle}>{selectedBengkel.address}</Text>
            </View>

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
                      onPress={() =>
                        setFormData((prev) => ({
                          ...prev,
                          service_id: service.id,
                          service_name: service.service_name,
                        }))
                      }
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

            {/* FORM CARD */}
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
                    editable={!!formData.service_id}
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
                    editable={!!formData.service_id}
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
                    editable={!!formData.service_id}
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
          </View>
        )}
      </ScrollView>
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
});