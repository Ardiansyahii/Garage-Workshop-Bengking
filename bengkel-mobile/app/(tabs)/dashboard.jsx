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
  Image,
  Platform,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Wrench,
  LogOut,
  MapPin,
  Phone,
  Store,
  ChevronRight,
  X,
  Tag,
  Clock,
} from "lucide-react-native";
import BottomNavBar from "../../components/Bottomnavbar"; // sesuaikan path relatif ini dengan lokasi folder components kamu

// Samakan dengan API_URL di Login/Register/Verify screen kamu
const API_URL = Platform.select({
  web: "http://localhost:5000",
  android: "http://10.51.2.60:5000", // khusus Emulator Android
  default: "http://10.51.2.60:5000", // Ganti dengan IP Wi-Fi laptop kamu jika pakai HP Fisik (Expo Go)
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

// Helper format harga ke Rupiah
const formatRupiah = (value) => {
  const number = Number(value) || 0;
  return `Rp${number.toLocaleString("id-ID")}`;
};

export default function UserDashboardScreen() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ============== STATE: BENGKEL & LAYANAN (E-COMMERCE STYLE) ==============
  const [bengkels, setBengkels] = useState([]);
  const [isLoadingBengkels, setIsLoadingBengkels] = useState(true);

  const [bengkelModalVisible, setBengkelModalVisible] = useState(false);
  const [selectedBengkel, setSelectedBengkel] = useState(null);
  const [bengkelServices, setBengkelServices] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);

  // ============== STATE: KONFIRMASI LAYANAN (harga & estimasi waktu) ==============
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingService, setPendingService] = useState(null);

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
      } catch (e) {
        router.replace("/login");
      } finally {
        setIsLoading(false);
      }
    };

    initSession();
    fetchBengkels();
  }, []);

  // ==========================================
  // FETCH: Daftar Bengkel (list "toko" e-commerce)
  // ==========================================
  const fetchBengkels = async () => {
    try {
      setIsLoadingBengkels(true);
      const data = await fetchWithAuth("/api/bengkels");
      if (data?.success) {
        setBengkels(data.data);
      }
    } catch (err) {
      // ignore or log
    } finally {
      setIsLoadingBengkels(false);
    }
  };

  // ==========================================
  // FETCH: Layanan milik Bengkel tertentu ("produk" toko)
  // ==========================================
  const fetchBengkelServices = async (bengkelId) => {
    try {
      setIsLoadingServices(true);
      const data = await fetchWithAuth(
        `/api/services?bengkel_id=${bengkelId}`
      );
      if (data?.success) {
        setBengkelServices(data.data);
      } else {
        setBengkelServices([]);
      }
    } catch (err) {
      setBengkelServices([]);
    } finally {
      setIsLoadingServices(false);
    }
  };

  const openBengkelModal = (bengkel) => {
    setSelectedBengkel(bengkel);
    setBengkelModalVisible(true);
    fetchBengkelServices(bengkel.id);
  };

  const closeBengkelModal = () => {
    setBengkelModalVisible(false);
    setSelectedBengkel(null);
    setBengkelServices([]);
  };

  // Saat tombol "Booking" pada sebuah layanan ditekan -> buka modal konfirmasi dulu
  const handlePressService = (service) => {
    setPendingService(service);
    setConfirmVisible(true);
  };

  const handleCancelConfirm = () => {
    setConfirmVisible(false);
    setPendingService(null);
  };

  // Lanjut booking dengan bengkel & layanan yang sudah dikonfirmasi
  const handleConfirmService = () => {
    if (!pendingService) return;
    setConfirmVisible(false);
    setBengkelModalVisible(false);
    router.push({
      pathname: "/booking",
      params: {
        bengkel_id: selectedBengkel?.id,
        bengkel_name: selectedBengkel?.name,
        service_id: pendingService?.id,
        service_name: pendingService?.service_name,
      },
    });
    setPendingService(null);
  };

  const handleLogout = () => {
    Alert.alert("Keluar Akun", "Apakah kamu yakin ingin keluar dari sesi ini?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Ya, Keluar",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("user");
          await AsyncStorage.removeItem("auth_token");
          await AsyncStorage.removeItem("user_session");
          router.replace("/login");
        },
      },
    ]);
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

      {/* BACKGROUND IMAGE */}
      <View style={StyleSheet.absoluteFillObject}>
        <Image
          source={require("../../assets/workshop-bg.png")} // Sesuaikan path gambar lokal Anda
          style={styles.bgImage}
          resizeMode="cover"
        />
        <View style={styles.bgOverlay} />
      </View>

      {/* HEADER NAVBAR */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatarIcon}>
            <Wrench size={18} color="#fff" />
          </View>
          <View>
            <Text style={styles.userName}>Halo, {user?.name || "User"}! 👋</Text>
            <Text style={styles.userPhone}>{user?.whatsapp || "-"}</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleLogout} style={styles.btnLogout}>
            <LogOut size={14} color="#d4d4d8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* MAIN CONTENT */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ================= SECTION: BENGKEL PARTNER (STORE CARDS ala E-COMMERCE) ================= */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Bengkel Partner</Text>
            <Text style={styles.sectionSubtitle}>
              Pilih bengkel rekanan untuk lihat layanan & booking langsung
            </Text>
          </View>
        </View>

        {isLoadingBengkels ? (
          <View style={styles.bengkelLoadingBox}>
            <ActivityIndicator size="small" color="#dc2626" />
          </View>
        ) : bengkels.length === 0 ? (
          <View style={styles.bengkelEmptyBox}>
            <Store size={28} color="#52525b" />
            <Text style={styles.bengkelEmptyText}>
              Belum ada bengkel partner tersedia.
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.bengkelListContainer}
            contentContainerStyle={styles.bengkelListContent}
          >
            {bengkels.map((bengkel) => (
              <TouchableOpacity
                key={bengkel.id}
                style={styles.bengkelCard}
                activeOpacity={0.8}
                onPress={() => openBengkelModal(bengkel)}
              >
                <View style={styles.bengkelCardBanner}>
                  <View style={styles.bengkelCardIconWrap}>
                    <Store size={22} color="#dc2626" />
                  </View>
                </View>

                <View style={styles.bengkelCardBody}>
                  <Text style={styles.bengkelCardName} numberOfLines={1}>
                    {bengkel.name}
                  </Text>

                  <View style={styles.bengkelCardRow}>
                    <MapPin size={12} color="#a1a1aa" />
                    <Text style={styles.bengkelCardRowText} numberOfLines={1}>
                      {bengkel.address}
                    </Text>
                  </View>

                  <View style={styles.bengkelCardRow}>
                    <Phone size={12} color="#a1a1aa" />
                    <Text style={styles.bengkelCardRowText} numberOfLines={1}>
                      {bengkel.phone}
                    </Text>
                  </View>

                  <View style={styles.bengkelCardFooter}>
                    <Text style={styles.bengkelCardCta}>Lihat Layanan</Text>
                    <ChevronRight size={14} color="#dc2626" />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </ScrollView>

      {/* ================= MODAL: DETAIL BENGKEL + DAFTAR LAYANAN (ala "produk toko") ================= */}
      <Modal
        visible={bengkelModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeBengkelModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bengkelModalContent}>
            {/* HEADER */}
            <View style={styles.bengkelModalHeader}>
              <View style={styles.bengkelModalHeaderInfo}>
                <View style={styles.bengkelModalIconWrap}>
                  <Store size={20} color="#dc2626" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bengkelModalTitle} numberOfLines={1}>
                    {selectedBengkel?.name}
                  </Text>
                  <Text style={styles.bengkelModalSubtitle} numberOfLines={1}>
                    {selectedBengkel?.address}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={closeBengkelModal}
                style={styles.bengkelModalCloseBtn}
              >
                <X size={18} color="#a1a1aa" />
              </TouchableOpacity>
            </View>

            <View style={styles.bengkelModalContactRow}>
              <Phone size={12} color="#a1a1aa" />
              <Text style={styles.bengkelModalContactText}>
                {selectedBengkel?.phone}
              </Text>
            </View>

            <Text style={styles.bengkelModalSectionLabel}>
              Daftar Layanan Tersedia
            </Text>

            {/* LIST LAYANAN / "PRODUK" */}
            {isLoadingServices ? (
              <View style={styles.bengkelLoadingBox}>
                <ActivityIndicator size="small" color="#dc2626" />
              </View>
            ) : bengkelServices.length === 0 ? (
              <View style={styles.bengkelEmptyBox}>
                <Wrench size={28} color="#52525b" />
                <Text style={styles.bengkelEmptyText}>
                  Bengkel ini belum memiliki daftar layanan.
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.serviceScrollList}
                showsVerticalScrollIndicator={false}
              >
                {bengkelServices.map((service) => (
                  <View key={service.id} style={styles.serviceListItem}>
                    <View style={styles.serviceListIconWrap}>
                      <Tag size={16} color="#dc2626" />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.serviceListName} numberOfLines={1}>
                        {service.service_name}
                      </Text>
                      {!!service.description && (
                        <Text
                          style={styles.serviceListDescription}
                          numberOfLines={2}
                        >
                          {service.description}
                        </Text>
                      )}
                      <Text style={styles.serviceListPrice}>
                        {formatRupiah(service.price)}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.serviceListBookBtn}
                      onPress={() => handlePressService(service)}
                    >
                      <Text style={styles.serviceListBookBtnText}>
                        Booking
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ================= MODAL: KONFIRMASI LAYANAN (harga & estimasi waktu) ================= */}
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

      {/* ================= BOTTOM NAVIGATION BAR (Home / Booking / Riwayat) ================= */}
      <BottomNavBar activeTab="home" />
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
  bgImage: {
    width: "100%",
    height: "100%",
    opacity: 0.3,
  },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
  },
  header: {
    height: 68,
    backgroundColor: "rgba(9, 9, 11, 0.9)",
    borderBottomWidth: 1,
    borderBottomColor: "#18181b",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 10,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#dc2626",
    alignItems: "center",
    justifyContent: "center",
  },
  userName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
  },
  userPhone: {
    color: "#a1a1aa",
    fontSize: 11,
    fontFamily: "monospace",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  btnLogout: {
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
    padding: 8,
    borderRadius: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },

  // SECTION HEADERS
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
  sectionSubtitle: {
    color: "#a1a1aa",
    fontSize: 11,
    marginTop: 2,
  },

  // BENGKEL "STORE CARD" LIST (E-COMMERCE STYLE)
  bengkelListContainer: {
    marginBottom: 8,
  },
  bengkelListContent: {
    flexDirection: "row",
    gap: 12,
    paddingRight: 8,
  },
  bengkelCard: {
    width: 190,
    backgroundColor: "rgba(9, 9, 11, 0.85)",
    borderWidth: 1,
    borderColor: "#18181b",
    borderRadius: 18,
    overflow: "hidden",
  },
  bengkelCardBanner: {
    height: 60,
    backgroundColor: "#18181b",
    alignItems: "center",
    justifyContent: "center",
  },
  bengkelCardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(220, 38, 38, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  bengkelCardBody: {
    padding: 12,
    gap: 6,
  },
  bengkelCardName: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "900",
  },
  bengkelCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  bengkelCardRowText: {
    color: "#a1a1aa",
    fontSize: 10.5,
    flex: 1,
  },
  bengkelCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#18181b",
  },
  bengkelCardCta: {
    color: "#dc2626",
    fontSize: 11,
    fontWeight: "800",
  },
  bengkelLoadingBox: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(9, 9, 11, 0.85)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#18181b",
  },
  bengkelEmptyBox: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(9, 9, 11, 0.85)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#18181b",
    gap: 8,
  },
  bengkelEmptyText: {
    color: "#a1a1aa",
    fontSize: 11,
    textAlign: "center",
  },

  // MODAL OVERLAY (dipakai modal bengkel & modal konfirmasi)
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  // MODAL: DETAIL BENGKEL + LAYANAN
  bengkelModalContent: {
    width: "100%",
    maxHeight: "75%",
    backgroundColor: "#09090b",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 20,
    padding: 18,
    gap: 12,
  },
  bengkelModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  bengkelModalHeaderInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  bengkelModalIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(220, 38, 38, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  bengkelModalTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
  },
  bengkelModalSubtitle: {
    color: "#a1a1aa",
    fontSize: 11,
    marginTop: 2,
  },
  bengkelModalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
    alignItems: "center",
    justifyContent: "center",
  },
  bengkelModalContactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#18181b",
  },
  bengkelModalContactText: {
    color: "#a1a1aa",
    fontSize: 11,
  },
  bengkelModalSectionLabel: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
  serviceScrollList: {
    gap: 10,
  },
  serviceListItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(24, 24, 27, 0.6)",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  serviceListIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(220, 38, 38, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  serviceListName: {
    color: "#fff",
    fontSize: 12.5,
    fontWeight: "800",
  },
  serviceListDescription: {
    color: "#a1a1aa",
    fontSize: 10.5,
    marginTop: 2,
  },
  serviceListPrice: {
    color: "#34d399",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 4,
  },
  serviceListBookBtn: {
    backgroundColor: "#dc2626",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  serviceListBookBtnText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },

  // ===== MODAL KONFIRMASI LAYANAN =====
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
    color: "#fff",
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
    color: "#fff",
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
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
});