import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
  StyleSheet,
  Modal,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Clock,
  Calendar,
  Car,
  CheckCircle2,
  XCircle,
  FileText,
  Ban,
  AlertCircle,
  Wrench,
} from "lucide-react-native";
import BottomNavBar from "../../components/Bottomnavbar";
// Samakan dengan API_URL di Login/Register/Verify screen kamu
const API_URL = Platform.select({
  web: "http://localhost:5000",
  android: "http://10.51.2.60:5000", // khusus Emulator Android
  default: "http://10.60.194.60:5000", // Ganti dengan IP Wi-Fi laptop kamu jika pakai HP Fisik (Expo Go)
});

// API Helper pengganti fetchWithAuth
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

const MAX_CONTENT_WIDTH = 480;

export default function RiwayatServisScreen() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState("Semua");
  const [isLoading, setIsLoading] = useState(true);

  // Modal State untuk Cancel & Reschedule
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);

  const [cancelReason, setCancelReason] = useState("");
  const [rescheduleData, setRescheduleData] = useState({
    date: "",
    time: "",
    reason: "",
  });

  const tabs = [
    "Semua",
    "Pending",
    "Menunggu Pembatalan",
    "Menunggu Reschedule",
    "Dikonfirmasi",
    "Sedang Dikerjakan",
    "Selesai",
    "Dibatalkan",
  ];

  // Initialize User Session
  useEffect(() => {
    const initSession = async () => {
      try {
        const storedUser =
          (await AsyncStorage.getItem("user")) ||
          (await AsyncStorage.getItem("user_session"));
        if (!storedUser) {
          router.replace("/login");
          return;
        }
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        fetchBookings(parsedUser.id);
      } catch (e) {
        router.replace("/login");
      }
    };

    initSession();
  }, []);

  // Polling data bookings
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      fetchBookings(user.id);
    }, 3000);

    return () => clearInterval(interval);
  }, [user]);

  const fetchBookings = async (userId) => {
    try {
      const data = await fetchWithAuth(`/api/bookings?user_id=${userId}`);
      if (data?.success) {
        setBookings(data.data);
      }
    } catch (err) {
      // ignore or log
    } finally {
      setIsLoading(false);
    }
  };

  // Process Cancel Submission
  const submitCancelBooking = async () => {
    if (!cancelReason.trim()) {
      Alert.alert("Perhatian", "Kamu wajib mengisi alasan pembatalan!");
      return;
    }

    try {
      const data = await fetchWithAuth("/api/booking/cancel", {
        method: "PATCH",
        body: JSON.stringify({
          booking_id: selectedBookingId,
          reason: cancelReason,
        }),
      });

      setCancelModalVisible(false);
      setCancelReason("");

      if (data.success) {
        Alert.alert("Pengajuan Terkirim", data.message);
        if (user) fetchBookings(user.id);
      } else {
        Alert.alert("Gagal", data.message || "Terjadi kesalahan.");
      }
    } catch (error) {
      setCancelModalVisible(false);
      Alert.alert("Kesalahan Jaringan", "Gagal terhubung ke server.");
    }
  };

  // Process Reschedule Submission
  // FIX: sebelumnya endpoint ini salah pakai `/api/bookings?user_id=...`
  // (endpoint yang sama dengan list/create booking), sehingga backend
  // membuat entry booking BARU alih-alih meng-update booking yang ada.
  // Sekarang diarahkan ke endpoint khusus reschedule, konsisten dengan
  // pola endpoint cancel di atas.
  const submitRescheduleBooking = async () => {
    if (
      !rescheduleData.date ||
      !rescheduleData.time ||
      !rescheduleData.reason
    ) {
      Alert.alert("Perhatian", "Semua kolom tanggal, jam, dan alasan wajib diisi!");
      return;
    }

    try {
      const data = await fetchWithAuth("/api/booking/reschedule", {
        method: "PATCH",
        body: JSON.stringify({
          booking_id: selectedBookingId,
          new_date: rescheduleData.date,
          new_time: rescheduleData.time,
          reason: rescheduleData.reason,
        }),
      });

      setRescheduleModalVisible(false);
      setRescheduleData({ date: "", time: "", reason: "" });

      if (data.success) {
        Alert.alert("Berhasil Diajukan", data.message);
        if (user) fetchBookings(user.id);
      } else {
        Alert.alert("Gagal", data.message || "Terjadi kesalahan.");
      }
    } catch (err) {
      setRescheduleModalVisible(false);
      Alert.alert("Kesalahan Jaringan", "Gagal terhubung ke server.");
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    if (activeTab === "Semua") return true;
    return booking.status === activeTab;
  });

  // Ringkasan: dihitung langsung dari data bookings yang sudah ada
  const totalBookings = bookings.length;
  const totalSelesai = bookings.filter((b) => b.status === "Selesai").length;
  const totalDibatalkan = bookings.filter(
    (b) => b.status === "Dibatalkan" || b.status === "Cancelled"
  ).length;

  // Badge status: warna lembut (kuning = menunggu, biru = diproses,
  // hijau = berhasil, merah = gagal/batal)
  const renderStatusBadge = (status) => {
    switch (status) {
      case "Pending":
        return (
          <View style={[styles.badge, styles.badgePending]}>
            <Clock size={12} color="#b45309" />
            <Text style={[styles.badgeText, { color: "#b45309" }]}>Pending</Text>
          </View>
        );
      case "Menunggu Pembatalan":
        return (
          <View style={[styles.badge, styles.badgeOrange]}>
            <AlertCircle size={12} color="#c2410c" />
            <Text style={[styles.badgeText, { color: "#c2410c" }]}>
              Menunggu Pembatalan
            </Text>
          </View>
        );
      case "Menunggu Reschedule":
        return (
          <View style={[styles.badge, styles.badgeOrange]}>
            <Calendar size={12} color="#c2410c" />
            <Text style={[styles.badgeText, { color: "#c2410c" }]}>
              Menunggu Reschedule
            </Text>
          </View>
        );
      case "Dikonfirmasi":
        return (
          <View style={[styles.badge, styles.badgeBlue]}>
            <CheckCircle2 size={12} color="#1d4ed8" />
            <Text style={[styles.badgeText, { color: "#1d4ed8" }]}>
              Dikonfirmasi
            </Text>
          </View>
        );
      case "Sedang Dikerjakan":
        return (
          <View style={[styles.badge, styles.badgeBlue]}>
            <Wrench size={12} color="#1d4ed8" />
            <Text style={[styles.badgeText, { color: "#1d4ed8" }]}>
              Sedang Dikerjakan
            </Text>
          </View>
        );
      case "Selesai":
        return (
          <View style={[styles.badge, styles.badgeGreen]}>
            <CheckCircle2 size={12} color="#15803d" />
            <Text style={[styles.badgeText, { color: "#15803d" }]}>Selesai</Text>
          </View>
        );
      case "Dibatalkan":
      case "Cancelled":
        return (
          <View style={[styles.badge, styles.badgeRed]}>
            <XCircle size={12} color="#b91c1c" />
            <Text style={[styles.badgeText, { color: "#b91c1c" }]}>
              Dibatalkan
            </Text>
          </View>
        );
      default:
        return (
          <View style={[styles.badge, styles.badgeDefault]}>
            <Text style={[styles.badgeText, { color: "#52525b" }]}>
              {status}
            </Text>
          </View>
        );
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#18181b" />
        <Text style={styles.loadingText}>Memuat data...</Text>
        <BottomNavBar activeTab="riwayat" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* HEADER NAVBAR */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Riwayat</Text>
        <Text style={styles.headerSubtitle}>
          Lihat seluruh aktivitas servis Anda sebelumnya
        </Text>
      </View>

      {/* MAIN CONTENT */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* RINGKASAN (data nyata dari daftar booking) */}
        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalBookings}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalSelesai}</Text>
            <Text style={styles.statLabel}>Selesai</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalDibatalkan}</Text>
            <Text style={styles.statLabel}>Dibatalkan</Text>
          </View>
        </View>

        {/* HORIZONTAL TABS (filter status) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsContainer}
          contentContainerStyle={styles.tabsContent}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                activeOpacity={0.7}
                onPress={() => setActiveTab(tab)}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
              >
                <Text
                  style={[styles.tabText, isActive && styles.tabTextActive]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* BOOKINGS LIST */}
        <View style={styles.listContainer}>
          {filteredBookings.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <FileText size={32} color="#18181b" />
              </View>
              <Text style={styles.emptyTitle}>
                Belum Ada Riwayat ({activeTab})
              </Text>
              <Text style={styles.emptyDescription}>
                Kamu belum memiliki riwayat reservasi servis kendaraan dengan
                kategori status tersebut.
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/dashboard")}
                activeOpacity={0.85}
                style={styles.emptyButton}
              >
                <Text style={styles.emptyButtonText}>Buat Booking Sekarang</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredBookings.map((booking) => (
              <View key={booking.id} style={styles.bookingCard}>
                {/* CARD HEADER */}
                <View style={styles.cardHeader}>
                  <View style={styles.codeWrapper}>
                    <Text style={styles.codeLabel}>Kode Reservasi:</Text>
                    <Text style={styles.codeValue}>{booking.booking_code}</Text>
                  </View>
                  {renderStatusBadge(booking.status)}
                </View>

                {/* CARD BODY */}
                <View style={styles.cardBody}>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceType}>
                      {booking.service_type}
                    </Text>
                    <View style={styles.vehicleRow}>
                      <View style={styles.vehiclePill}>
                        <Car size={14} color="#18181b" />
                        <Text style={styles.vehicleText}>
                          {booking.vehicle_name}
                        </Text>
                      </View>
                      <View style={styles.platePill}>
                        <Text style={styles.plateText}>
                          {booking.license_plate}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* JADWAL & ACTION BUTTONS */}
                  <View style={styles.cardFooter}>
                    <View style={styles.scheduleBox}>
                      <Text style={styles.scheduleLabel}>Jadwal Servis:</Text>
                      <View style={styles.scheduleDateRow}>
                        <Calendar size={14} color="#18181b" />
                        <Text style={styles.scheduleDateText}>
                          {new Date(
                            booking.booking_date
                          ).toLocaleDateString("id-ID")}{" "}
                          • {booking.booking_time}
                        </Text>
                      </View>
                    </View>

                    {(booking.status === "Pending" ||
                      booking.status === "Dikonfirmasi") && (
                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => {
                            setSelectedBookingId(booking.id);
                            setRescheduleModalVisible(true);
                          }}
                          style={styles.btnReschedule}
                        >
                          <Calendar size={14} color="#18181b" />
                          <Text style={styles.btnRescheduleText}>
                            Reschedule
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => {
                            setSelectedBookingId(booking.id);
                            setCancelModalVisible(true);
                          }}
                          style={styles.btnCancel}
                        >
                          <Ban size={14} color="#b91c1c" />
                          <Text style={styles.btnCancelText}>Batalkan</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {booking.status === "Sedang Dikerjakan" && (
                    <View style={styles.workingNotice}>
                      <Wrench size={14} color="#1d4ed8" />
                      <Text style={styles.workingNoticeText}>
                        Mekanik sedang menangani perbaikan kendaraanmu di
                        bengkel.
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* MODAL CANCEL BOOKING */}
      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Alasan Pembatalan</Text>
            <Text style={styles.modalSubtitle}>
              Tuliskan alasan mengapa kamu ingin membatalkan jadwal servis ini:
            </Text>
            <TextInput
              value={cancelReason}
              onChangeText={setCancelReason}
              placeholder="Contoh: Ada keperluan mendadak..."
              placeholderTextColor="#a1a1aa"
              multiline
              numberOfLines={3}
              style={[styles.modalInput, styles.modalTextArea]}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setCancelModalVisible(false)}
                activeOpacity={0.7}
                style={styles.modalBtnCancel}
              >
                <Text style={styles.modalBtnCancelText}>Kembali</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submitCancelBooking}
                activeOpacity={0.85}
                style={styles.modalBtnSubmit}
              >
                <Text style={styles.modalBtnSubmitText}>Kirim Pengajuan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL RESCHEDULE BOOKING */}
      <Modal
        visible={rescheduleModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRescheduleModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ubah Jadwal (Reschedule)</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tanggal Baru (YYYY-MM-DD):</Text>
              <TextInput
                value={rescheduleData.date}
                onChangeText={(val) =>
                  setRescheduleData((p) => ({ ...p, date: val }))
                }
                placeholder="2026-03-25"
                placeholderTextColor="#a1a1aa"
                style={styles.modalInput}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Jam Baru (HH:MM):</Text>
              <TextInput
                value={rescheduleData.time}
                onChangeText={(val) =>
                  setRescheduleData((p) => ({ ...p, time: val }))
                }
                placeholder="10:00"
                placeholderTextColor="#a1a1aa"
                style={styles.modalInput}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Alasan Reschedule:</Text>
              <TextInput
                value={rescheduleData.reason}
                onChangeText={(val) =>
                  setRescheduleData((p) => ({ ...p, reason: val }))
                }
                placeholder="Contoh: Ada halangan mendadak..."
                placeholderTextColor="#a1a1aa"
                multiline
                numberOfLines={2}
                style={[styles.modalInput, styles.modalTextArea]}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setRescheduleModalVisible(false)}
                activeOpacity={0.7}
                style={styles.modalBtnCancel}
              >
                <Text style={styles.modalBtnCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submitRescheduleBooking}
                activeOpacity={0.85}
                style={styles.modalBtnSubmit}
              >
                <Text style={styles.modalBtnSubmitText}>
                  Ajukan Reschedule
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <BottomNavBar activeTab="riwayat" />
    </SafeAreaView>
  );
}

const softShadow = {
  shadowColor: "#000",
  shadowOpacity: 0.06,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 3 },
  elevation: 2,
};

const webNoOutline = Platform.select({
  web: { outlineStyle: "none" },
  default: {},
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#71717a",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
  },

  // HEADER
  header: {
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    zIndex: 10,
  },
  headerTitle: {
    color: "#3f3f46",
    fontSize: 28,
    fontWeight: "900",
  },
  headerSubtitle: {
    color: "#71717a",
    fontSize: 13,
    marginTop: 4,
  },

  scrollView: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 120,
  },

  // RINGKASAN
  statRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f4f4f5",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    ...softShadow,
  },
  statValue: {
    color: "#18181b",
    fontSize: 22,
    fontWeight: "900",
  },
  statLabel: {
    color: "#71717a",
    fontSize: 12,
    marginTop: 2,
  },

  // FILTER TABS
  tabsContainer: {
    marginBottom: 18,
    flexGrow: 0,
  },
  tabsContent: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 8,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e4e4e7",
  },
  tabButtonActive: {
    backgroundColor: "#18181b",
    borderColor: "#18181b",
  },
  tabText: {
    color: "#52525b",
    fontSize: 12.5,
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#fff",
  },

  listContainer: {
    gap: 14,
  },

  // EMPTY STATE
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: "#fafafa",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#f4f4f5",
    marginTop: 8,
  },
  emptyIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#f4f4f5",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    color: "#18181b",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 16,
    textAlign: "center",
  },
  emptyDescription: {
    color: "#71717a",
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  emptyButton: {
    marginTop: 20,
    backgroundColor: "#18181b",
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyButtonText: {
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "600",
  },

  // BOOKING CARD
  bookingCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f4f4f5",
    borderRadius: 22,
    padding: 18,
    ...softShadow,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f4f4f5",
    paddingBottom: 12,
    marginBottom: 14,
    gap: 8,
  },
  codeWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
  },
  codeLabel: {
    fontSize: 11,
    color: "#71717a",
  },
  codeValue: {
    fontSize: 12,
    fontWeight: "800",
    color: "#18181b",
    backgroundColor: "#f4f4f5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: "hidden",
  },
  cardBody: {
    gap: 14,
  },
  serviceInfo: {
    gap: 8,
  },
  serviceType: {
    fontSize: 17,
    fontWeight: "800",
    color: "#18181b",
  },
  vehicleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  vehiclePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f4f4f5",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  vehicleText: {
    color: "#18181b",
    fontSize: 12,
    fontWeight: "600",
  },
  platePill: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e4e4e7",
  },
  plateText: {
    color: "#3f3f46",
    fontSize: 11.5,
    fontWeight: "700",
  },
  cardFooter: {
    gap: 12,
  },
  scheduleBox: {
    backgroundColor: "#f4f4f5",
    padding: 12,
    borderRadius: 16,
  },
  scheduleLabel: {
    fontSize: 11,
    color: "#71717a",
    marginBottom: 4,
  },
  scheduleDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  scheduleDateText: {
    color: "#18181b",
    fontSize: 13,
    fontWeight: "700",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  btnReschedule: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d4d4d8",
    height: 44,
    borderRadius: 999,
  },
  btnRescheduleText: {
    color: "#18181b",
    fontSize: 12.5,
    fontWeight: "600",
  },
  btnCancel: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#fecaca",
    height: 44,
    borderRadius: 999,
  },
  btnCancelText: {
    color: "#b91c1c",
    fontSize: 12.5,
    fontWeight: "600",
  },
  workingNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#eff6ff",
    borderRadius: 14,
    padding: 12,
  },
  workingNoticeText: {
    color: "#1d4ed8",
    fontSize: 11.5,
    fontWeight: "500",
    flex: 1,
    lineHeight: 17,
  },

  // BADGES (warna lembut)
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    flexShrink: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  badgePending: {
    backgroundColor: "#fef3c7",
  },
  badgeOrange: {
    backgroundColor: "#ffedd5",
  },
  badgeBlue: {
    backgroundColor: "#dbeafe",
  },
  badgeGreen: {
    backgroundColor: "#dcfce7",
  },
  badgeRed: {
    backgroundColor: "#fee2e2",
  },
  badgeDefault: {
    backgroundColor: "#f4f4f5",
  },

  // MODALS
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 22,
    gap: 14,
  },
  modalTitle: {
    color: "#18181b",
    fontSize: 18,
    fontWeight: "800",
  },
  modalSubtitle: {
    color: "#71717a",
    fontSize: 13,
    lineHeight: 20,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    color: "#3f3f46",
    fontSize: 12.5,
    fontWeight: "600",
  },
  modalInput: {
    backgroundColor: "#f4f4f5",
    borderWidth: 1.5,
    borderColor: "transparent",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#18181b",
    fontSize: 13.5,
    ...webNoOutline,
  },
  modalTextArea: {
    textAlignVertical: "top",
    minHeight: 72,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 6,
  },
  modalBtnCancel: {
    flex: 1,
    height: 48,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d4d4d8",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnCancelText: {
    color: "#18181b",
    fontSize: 13.5,
    fontWeight: "600",
  },
  modalBtnSubmit: {
    flex: 1.4,
    height: 48,
    borderRadius: 999,
    backgroundColor: "#18181b",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnSubmitText: {
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "600",
  },
});