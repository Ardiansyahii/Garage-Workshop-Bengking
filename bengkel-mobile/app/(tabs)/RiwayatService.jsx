import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Modal,
  TextInput,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ArrowLeft,
  Clock,
  Calendar,
  Car,
  CheckCircle2,
  XCircle,
  FileText,
  Ban,
  AlertCircle,
  Wrench,
  PlusCircle,
} from "lucide-react-native";

// Samakan dengan API_URL di Login/Register/Verify screen kamu
const API_URL = Platform.select({
  web: "http://localhost:5000",
  android: "http://10.0.2.2:5000", // khusus Emulator Android
  default: "http://192.168.1.16:5000", // Ganti dengan IP Wi-Fi laptop kamu jika pakai HP Fisik (Expo Go)
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
      const data = await fetchWithAuth(`/api/bookings?user_id=${user.id}`, {
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

  const renderStatusBadge = (status) => {
    switch (status) {
      case "Pending":
        return (
          <View style={[styles.badge, styles.badgePending]}>
            <Clock size={12} color="#fbbf24" />
            <Text style={[styles.badgeText, { color: "#fbbf24" }]}>Pending</Text>
          </View>
        );
      case "Menunggu Pembatalan":
        return (
          <View style={[styles.badge, styles.badgeOrange]}>
            <AlertCircle size={12} color="#fb923c" />
            <Text style={[styles.badgeText, { color: "#fb923c" }]}>
              Menunggu Pembatalan
            </Text>
          </View>
        );
      case "Menunggu Reschedule":
        return (
          <View style={[styles.badge, styles.badgePurple]}>
            <Calendar size={12} color="#c084fc" />
            <Text style={[styles.badgeText, { color: "#c084fc" }]}>
              Menunggu Reschedule
            </Text>
          </View>
        );
      case "Dikonfirmasi":
        return (
          <View style={[styles.badge, styles.badgeBlue]}>
            <CheckCircle2 size={12} color="#60a5fa" />
            <Text style={[styles.badgeText, { color: "#60a5fa" }]}>
              Dikonfirmasi
            </Text>
          </View>
        );
      case "Sedang Dikerjakan":
        return (
          <View style={[styles.badge, styles.badgePurple]}>
            <Wrench size={12} color="#c084fc" />
            <Text style={[styles.badgeText, { color: "#c084fc" }]}>
              Sedang Dikerjakan
            </Text>
          </View>
        );
      case "Selesai":
        return (
          <View style={[styles.badge, styles.badgeGreen]}>
            <CheckCircle2 size={12} color="#34d399" />
            <Text style={[styles.badgeText, { color: "#34d399" }]}>Selesai</Text>
          </View>
        );
      case "Dibatalkan":
      case "Cancelled":
        return (
          <View style={[styles.badge, styles.badgeRed]}>
            <XCircle size={12} color="#ef4444" />
            <Text style={[styles.badgeText, { color: "#ef4444" }]}>
              Dibatalkan
            </Text>
          </View>
        );
      default:
        return (
          <View style={[styles.badge, styles.badgeDefault]}>
            <Text style={[styles.badgeText, { color: "#d4d4d8" }]}>
              {status}
            </Text>
          </View>
        );
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#dc2626" />
        <Text style={styles.loadingText}>Memuat data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* HEADER NAVBAR */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.btnBack}
          >
            <ArrowLeft size={18} color="#e4e4e7" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Riwayat Servis</Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push("/booking")}
          style={styles.btnPrimary}
        >
          <PlusCircle size={14} color="#fff" />
          <Text style={styles.btnPrimaryText}>Booking</Text>
        </TouchableOpacity>
      </View>

      {/* MAIN CONTENT */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HORIZONTAL TABS */}
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
              <FileText size={48} color="#52525b" />
              <Text style={styles.emptyTitle}>
                Tidak Ada Pesanan ({activeTab})
              </Text>
              <Text style={styles.emptyDescription}>
                Kamu belum memiliki riwayat reservasi servis kendaraan dengan
                kategori status tersebut.
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/booking")}
                style={styles.emptyButton}
              >
                <Text style={styles.emptyButtonText}>Buat Booking Sekarang</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredBookings.map((booking) => (
              <View key={booking.id} style={styles.bookingCard}>
                <View style={styles.redBorderLeft} />

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
                        <Car size={14} color="#ef4444" />
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
                        <Calendar size={14} color="#ef4444" />
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
                          onPress={() => {
                            setSelectedBookingId(booking.id);
                            setRescheduleModalVisible(true);
                          }}
                          style={styles.btnReschedule}
                        >
                          <Calendar size={14} color="#60a5fa" />
                          <Text style={styles.btnRescheduleText}>
                            Reschedule
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => {
                            setSelectedBookingId(booking.id);
                            setCancelModalVisible(true);
                          }}
                          style={styles.btnCancel}
                        >
                          <Ban size={14} color="#ef4444" />
                          <Text style={styles.btnCancelText}>Batalkan</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {booking.status === "Sedang Dikerjakan" && (
                    <View style={styles.workingNotice}>
                      <Wrench size={14} color="#c084fc" />
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Alasan Pembatalan</Text>
            <Text style={styles.modalSubtitle}>
              Tuliskan alasan mengapa kamu ingin membatalkan jadwal servis ini:
            </Text>
            <TextInput
              value={cancelReason}
              onChangeText={setCancelReason}
              placeholder="Contoh: Ada keperluan mendadak..."
              placeholderTextColor="#71717a"
              multiline
              numberOfLines={3}
              style={[styles.modalInput, styles.modalTextArea]}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setCancelModalVisible(false)}
                style={styles.modalBtnCancel}
              >
                <Text style={styles.modalBtnCancelText}>Kembali</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submitCancelBooking}
                style={styles.modalBtnSubmit}
              >
                <Text style={styles.modalBtnSubmitText}>Kirim Pengajuan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL RESCHEDULE BOOKING */}
      <Modal
        visible={rescheduleModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRescheduleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
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
                placeholderTextColor="#71717a"
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
                placeholderTextColor="#71717a"
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
                placeholderTextColor="#71717a"
                multiline
                numberOfLines={2}
                style={[styles.modalInput, styles.modalTextArea]}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setRescheduleModalVisible(false)}
                style={styles.modalBtnCancel}
              >
                <Text style={styles.modalBtnCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submitRescheduleBooking}
                style={styles.modalBtnSubmit}
              >
                <Text style={styles.modalBtnSubmitText}>
                  Ajukan Reschedule
                </Text>
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
    backgroundColor: "#000",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#71717a",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 12,
  },
  header: {
    height: 68,
    backgroundColor: "rgba(9, 9, 11, 0.95)",
    borderBottomWidth: 1,
    borderBottomColor: "#18181b",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  btnBack: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
  btnPrimary: {
    backgroundColor: "#dc2626",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  btnPrimaryText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#000",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  tabsContainer: {
    backgroundColor: "rgba(9, 9, 11, 0.85)",
    borderWidth: 1,
    borderColor: "#18181b",
    borderRadius: 16,
    padding: 6,
    marginBottom: 20,
  },
  tabsContent: {
    flexDirection: "row",
    gap: 6,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: "#dc2626",
  },
  tabText: {
    color: "#a1a1aa",
    fontSize: 12,
    fontWeight: "700",
  },
  tabTextActive: {
    color: "#fff",
  },
  listContainer: {
    gap: 16,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: "rgba(9, 9, 11, 0.85)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#18181b",
    marginTop: 20,
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 16,
    textAlign: "center",
  },
  emptyDescription: {
    color: "#a1a1aa",
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 18,
  },
  emptyButton: {
    marginTop: 20,
    backgroundColor: "#dc2626",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  emptyButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  bookingCard: {
    backgroundColor: "rgba(9, 9, 11, 0.85)",
    borderWidth: 1,
    borderColor: "#18181b",
    borderRadius: 20,
    padding: 20,
    position: "relative",
    overflow: "hidden",
  },
  redBorderLeft: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: 5,
    backgroundColor: "#dc2626",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#18181b",
    paddingBottom: 12,
    marginBottom: 16,
  },
  codeWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  codeLabel: {
    fontSize: 11,
    color: "#a1a1aa",
  },
  codeValue: {
    fontSize: 12,
    fontWeight: "900",
    color: "#fff",
    fontFamily: "monospace",
    backgroundColor: "#18181b",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#27272a",
  },
  cardBody: {
    gap: 16,
  },
  serviceInfo: {
    gap: 8,
  },
  serviceType: {
    fontSize: 18,
    fontWeight: "900",
    color: "#fff",
  },
  vehicleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  vehiclePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#18181b",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#27272a",
  },
  vehicleText: {
    color: "#e4e4e7",
    fontSize: 12,
    fontWeight: "600",
  },
  platePill: {
    backgroundColor: "#18181b",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#27272a",
  },
  plateText: {
    color: "#e4e4e7",
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  cardFooter: {
    gap: 12,
  },
  scheduleBox: {
    backgroundColor: "rgba(24, 24, 27, 0.6)",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#27272a",
  },
  scheduleLabel: {
    fontSize: 11,
    color: "#a1a1aa",
    marginBottom: 4,
  },
  scheduleDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  scheduleDateText: {
    color: "#fff",
    fontSize: 12,
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
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "rgba(96, 165, 250, 0.3)",
    paddingVertical: 10,
    borderRadius: 12,
  },
  btnRescheduleText: {
    color: "#60a5fa",
    fontSize: 12,
    fontWeight: "700",
  },
  btnCancel: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    paddingVertical: 10,
    borderRadius: 12,
  },
  btnCancelText: {
    color: "#ef4444",
    fontSize: 12,
    fontWeight: "700",
  },
  workingNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#18181b",
  },
  workingNoticeText: {
    color: "#c084fc",
    fontSize: 11,
    fontWeight: "600",
    flex: 1,
  },

  // BADGES
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  badgePending: {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderColor: "rgba(245, 158, 11, 0.2)",
  },
  badgeOrange: {
    backgroundColor: "rgba(249, 115, 22, 0.1)",
    borderColor: "rgba(249, 115, 22, 0.2)",
  },
  badgePurple: {
    backgroundColor: "rgba(168, 85, 247, 0.1)",
    borderColor: "rgba(168, 85, 247, 0.2)",
  },
  badgeBlue: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderColor: "rgba(59, 130, 246, 0.2)",
  },
  badgeGreen: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  badgeRed: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  badgeDefault: {
    backgroundColor: "#27272a",
    borderColor: "#3f3f46",
  },

  // MODALS
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#09090b",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  modalSubtitle: {
    color: "#a1a1aa",
    fontSize: 12,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    color: "#a1a1aa",
    fontSize: 11,
  },
  modalInput: {
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 10,
    padding: 10,
    color: "#fff",
    fontSize: 12,
  },
  modalTextArea: {
    textAlignVertical: "top",
    minHeight: 60,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 8,
  },
  modalBtnCancel: {
    backgroundColor: "#27272a",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  modalBtnCancelText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  modalBtnSubmit: {
    backgroundColor: "#dc2626",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  modalBtnSubmitText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
});