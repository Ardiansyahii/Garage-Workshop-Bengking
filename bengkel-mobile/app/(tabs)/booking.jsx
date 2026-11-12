import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
  StyleSheet,
  Modal,
  Platform,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
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
import BottomNavBar from "../../components/Bottomnavbar";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
// Samakan dengan API_URL di Login/Register/Verify/Dashboard screen kamu
const API_URL = Platform.select({
  web: "http://localhost:5000",
  android: "http://10.51.2.60:5000", // khusus Emulator Android
  default: "http://10.60.194.60:5000", // Ganti dengan IP Wi-Fi laptop kamu jika pakai HP Fisik (Expo Go)
});

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

// Helper format tanggal/jam dari picker (pakai waktu lokal agar tidak bergeser zona waktu)
const pad = (n) => String(n).padStart(2, "0");
const toDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toTimeStr = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

// Input native browser (type="date" / "time") untuk platform web
const WebInput = ({ inputRef, ...props }) =>
  React.createElement("input", {
    ref: inputRef,
    ...props,
    style: {
      flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent",
      color: "#18181b", fontSize: 13, padding: "12px 0", fontFamily: "inherit",
    },
  });

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

  // State Picker Tanggal / Jam
  const [picker, setPicker] = useState(null); // "date" | "time" | null
  const [tempValue, setTempValue] = useState(new Date()); // dipakai picker iOS
  const dateInputRef = useRef(null); // web
  const timeInputRef = useRef(null); // web

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
 useFocusEffect(
  useCallback(() => {
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
      setIsLoading(true);

      try {
        const data = await fetchWithAuth(`/api/bengkels`);
        const bengkelList = data?.success ? data.data || [] : [];
        setBengkels(bengkelList);

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
        } else {
          // Reset ke step "pilih bengkel" kalau tidak ada params (masuk manual lewat tab)
          setSelectedBengkel(null);
          setIsPrefilled(false);
        }
      } catch (err) {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [params?.bengkel_id, params?.service_id])
);

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

  // 5b. Picker tanggal/jam (tanpa mengetik) — tetap lewat validateDate / validateTime
  const openPicker = (mode) => {
    if (mode === "time" && !formData.booking_date) {
      Alert.alert("Pilih Tanggal Dulu", "Silakan tentukan tanggal servis terlebih dahulu.");
      return;
    }
    if (Platform.OS === "web") {
      (mode === "date" ? dateInputRef : timeInputRef).current?.showPicker?.();
      return;
    }
    setTempValue(new Date());
    setPicker(mode);
  };

  const applyPicked = (mode, d) =>
    mode === "date" ? validateDate(toDateStr(d)) : validateTime(toTimeStr(d));

  const handlePickerChange = (event, selected) => {
    if (Platform.OS === "android") {
      const mode = picker;
      setPicker(null);
      if (event.type === "set" && selected) applyPicked(mode, selected);
    } else if (selected) {
      setTempValue(selected);
    }
  };

  const handleIosPickerDone = () => {
    const mode = picker;
    setPicker(null);
    applyPicked(mode, tempValue);
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
        <Wrench size={32} color="#18181b" />
        <Text style={styles.loadingText}>Menyiapkan Ruang Reservasi...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HEADER / BACK */}
       <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.replace("/dashboard")}
      >
        <ArrowLeft size={14} color="#52525b" />
        <Text style={styles.backBtnText}>Kembali</Text>
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
            <Text style={[styles.title, { color: "#18181b" }]}>
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
                    <CheckCircle2 size={16} color="#18181b" />
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
                              {isActive && <CheckCircle2 size={14} color="#18181b" />}
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
                      placeholderTextColor="#a1a1aa"
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
                      placeholderTextColor="#a1a1aa"
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
                    <TouchableOpacity onPress={() => openPicker("date")} hitSlop={8} style={styles.inputIcon}>
                      <Calendar size={16} color="#71717a" />
                    </TouchableOpacity>
                    {Platform.OS === "web" ? (
                      <WebInput
                        inputRef={dateInputRef}
                        type="date"
                        min={toDateStr(new Date())}
                        value={formData.booking_date}
                        onChange={(e) => handleDateChange(e.target.value)}
                      />
                    ) : (
                      <TextInput
                        style={styles.textInput}
                        placeholder="2026-03-25"
                        placeholderTextColor="#a1a1aa"
                        value={formData.booking_date}
                        maxLength={10}
                        onChangeText={handleDateChange}
                      />
                    )}
                  </View>
                </View>

                {/* JAM SERVIS */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>JAM SERVIS (HH:MM)</Text>
                  <View style={styles.inputWrapper}>
                    <TouchableOpacity onPress={() => openPicker("time")} hitSlop={8} style={styles.inputIcon}>
                      <Clock size={16} color="#71717a" />
                    </TouchableOpacity>
                    {Platform.OS === "web" ? (
                      <WebInput
                        inputRef={timeInputRef}
                        type="time"
                        value={formData.booking_time}
                        disabled={!formData.booking_date}
                        onChange={(e) => handleTimeChange(e.target.value)}
                      />
                    ) : (
                      <TextInput
                        style={styles.textInput}
                        placeholder="10:00"
                        placeholderTextColor="#a1a1aa"
                        value={formData.booking_time}
                        editable={!!formData.booking_date}
                        maxLength={5}
                        onChangeText={handleTimeChange}
                      />
                    )}
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
                <Tag size={18} color="#18181b" />
              </View>
              <Text style={styles.confirmModalTitle} numberOfLines={2}>
                {pendingService?.service_name}
              </Text>
              <TouchableOpacity onPress={handleCancelConfirm} style={styles.confirmModalCloseBtn}>
                <X size={16} color="#71717a" />
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
      {/* ================= PICKER TANGGAL / JAM ================= */}
      {picker && Platform.OS === "android" && (
        <DateTimePicker
          value={new Date()}
          mode={picker}
          is24Hour
          minimumDate={picker === "date" ? new Date() : undefined}
          onChange={handlePickerChange}
        />
      )}
      {picker && Platform.OS === "ios" && (
        <Modal transparent animationType="fade" onRequestClose={() => setPicker(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.confirmModalContent}>
              <Text style={styles.confirmModalTitle}>
                {picker === "date" ? "Pilih Tanggal" : "Pilih Jam"}
              </Text>
              <DateTimePicker
                value={tempValue}
                mode={picker}
                display="spinner"
                is24Hour
                themeVariant="light"
                minimumDate={picker === "date" ? new Date() : undefined}
                onChange={handlePickerChange}
              />
              <View style={styles.confirmModalActions}>
                <TouchableOpacity style={styles.confirmModalCancelBtn} onPress={() => setPicker(null)}>
                  <Text style={styles.confirmModalCancelText}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmModalOkBtn} onPress={handleIosPickerDone}>
                  <Text style={styles.confirmModalOkText}>Pilih</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
       <BottomNavBar activeTab="Booking" />
    </SafeAreaView>

    
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  loadingContainer: { flex: 1, backgroundColor: "#FFFFFF", justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { color: "#71717a", fontSize: 13, fontWeight: "700" },
  scrollContent: { padding: 20, paddingBottom: 40 },
  backBtn: {
    flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 8, backgroundColor: "#FFFFFF",
    borderWidth: 1, borderColor: "#e4e4e7", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginBottom: 20,
  },
  backBtnText: { color: "#52525b", fontSize: 12, fontWeight: "600" },
  title: { color: "#18181b", fontSize: 26, fontWeight: "900" },
  subtitle: { color: "#71717a", fontSize: 12, lineHeight: 18, marginTop: 6 },
  sectionLabel: {
    color: "#18181b", fontSize: 13, fontWeight: "800", marginTop: 20, marginBottom: 12,
    borderBottomWidth: 1, borderBottomColor: "#e4e4e7", paddingBottom: 8,
  },
  emptyBox: { borderWidth: 1, borderColor: "#e4e4e7", borderStyle: "dashed", borderRadius: 16, padding: 24, alignItems: "center" },
  emptyBoxText: { color: "#71717a", fontSize: 12, textAlign: "center" },
  bengkelCard: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#e4e4e7", borderRadius: 16, padding: 16 },
  bengkelName: { color: "#18181b", fontSize: 14, fontWeight: "800", marginBottom: 8 },
  bengkelAddressRow: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  bengkelAddress: { color: "#71717a", fontSize: 11, flex: 1 },
  bengkelCardFooter: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: "#e4e4e7",
  },
  badgeMitra: { backgroundColor: "#f4f4f5", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeMitraText: { color: "#18181b", fontSize: 9, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },
  serviceCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#FFFFFF",
    borderWidth: 1, borderColor: "#e4e4e7", borderRadius: 16, padding: 14, gap: 10,
  },
  serviceCardActive: { backgroundColor: "#f4f4f5", borderColor: "#18181b" },
  serviceNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  serviceName: { color: "#18181b", fontSize: 13, fontWeight: "800" },
  serviceDesc: { color: "#71717a", fontSize: 11, marginTop: 4 },
  servicePrice: { color: "#18181b", fontSize: 12, fontWeight: "800", fontFamily: "monospace" },

  // BOX: Layanan sudah dipilih dari Dashboard (skip pemilihan ulang)
  prefilledServiceBox: {
    backgroundColor: "#f4f4f5", borderWidth: 1, borderColor: "#e4e4e7",
    borderRadius: 16, padding: 14, marginTop: 20, marginBottom: 20,
  },
  prefilledServiceRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  prefilledIconWrap: { width: 34, height: 34, borderRadius: 10, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  prefilledLabel: { color: "#71717a", fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  prefilledServiceName: { color: "#18181b", fontSize: 14, fontWeight: "900", marginTop: 2 },
  prefilledChangeBtn: {
    alignSelf: "flex-start", marginTop: 12, paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 10, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#d4d4d8",
  },
  prefilledChangeBtnText: { color: "#18181b", fontSize: 11, fontWeight: "700" },

  formCard: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#e4e4e7", borderRadius: 24, padding: 20, marginTop: 4 },
  formTitle: { color: "#18181b", fontSize: 20, fontWeight: "900", marginBottom: 4 },
  formSubtitle: { color: "#71717a", fontSize: 12, marginBottom: 18 },
  summaryBox: { backgroundColor: "#f4f4f5", borderWidth: 1, borderColor: "#e4e4e7", borderRadius: 16, padding: 14, marginBottom: 18 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6 },
  summaryRowBorder: { borderTopWidth: 1, borderTopColor: "#e4e4e7", marginTop: 4 },
  summaryLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  summaryLabel: { color: "#71717a", fontSize: 11, fontWeight: "700" },
  summaryValue: { color: "#18181b", fontSize: 11, fontWeight: "800" },
  summaryValuePending: { color: "#a1a1aa" },
  inputGroup: { marginBottom: 14 },
  inputLabel: { color: "#3f3f46", fontSize: 10, fontWeight: "800", letterSpacing: 1, marginBottom: 6 },
  inputWrapper: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#f4f4f5",
    borderWidth: 1, borderColor: "#e4e4e7", borderRadius: 12, paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  textInput: { flex: 1, color: "#18181b", fontSize: 13, paddingVertical: 12 },
  submitBtn: {
    flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8,
    backgroundColor: "#18181b", paddingVertical: 15, borderRadius: 12, marginTop: 8,
  },
  submitBtnDisabled: { backgroundColor: "#a1a1aa" },
  submitBtnText: { color: "#FFFFFF", fontWeight: "bold", fontSize: 13 },

  // ===== MODAL KONFIRMASI LAYANAN =====
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 },
  confirmModalContent: {
    width: "100%", backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#e4e4e7",
    borderRadius: 20, padding: 18, gap: 14,
  },
  confirmModalHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  confirmModalIconWrap: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: "#f4f4f5", borderWidth: 1,
    borderColor: "#e4e4e7", alignItems: "center", justifyContent: "center",
  },
  confirmModalTitle: { flex: 1, color: "#18181b", fontSize: 14, fontWeight: "900" },
  confirmModalCloseBtn: {
    width: 30, height: 30, borderRadius: 9, backgroundColor: "#f4f4f5", borderWidth: 1,
    borderColor: "#e4e4e7", alignItems: "center", justifyContent: "center",
  },
  confirmModalDesc: { color: "#71717a", fontSize: 12, lineHeight: 18 },
  confirmDetailBox: { backgroundColor: "#f4f4f5", borderWidth: 1, borderColor: "#e4e4e7", borderRadius: 14, padding: 14 },
  confirmDetailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6 },
  confirmDetailRowBorder: { borderTopWidth: 1, borderTopColor: "#e4e4e7", marginTop: 4 },
  confirmDetailLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  confirmDetailLabel: { color: "#71717a", fontSize: 11, fontWeight: "700" },
  confirmDetailValue: { color: "#18181b", fontSize: 11, fontWeight: "700", flexShrink: 1, textAlign: "right", marginLeft: 12 },
  confirmDetailValuePrice: { color: "#18181b", fontSize: 13, fontWeight: "900" },
  confirmModalActions: { flexDirection: "row", gap: 10 },
  confirmModalCancelBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: "#FFFFFF",
    borderWidth: 1, borderColor: "#d4d4d8", alignItems: "center",
  },
  confirmModalCancelText: { color: "#18181b", fontSize: 13, fontWeight: "700" },
  confirmModalOkBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: "#18181b", alignItems: "center" },
  confirmModalOkText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
});