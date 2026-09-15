import React, { useState, useEffect, useMemo } from "react";
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
  TextInput,
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
  Search,
  SlidersHorizontal,
  ArrowDownAZ,
  ArrowUpAZ,
  RotateCcw,
  Check,
} from "lucide-react-native";
import BottomNavBar from "../../components/Bottomnavbar"; // sesuaikan path relatif ini dengan lokasi folder components kamu

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

// Helper format harga ke Rupiah
const formatRupiah = (value) => {
  const number = Number(value) || 0;
  return `Rp${number.toLocaleString("id-ID")}`;
};

// Opsi rentang harga untuk filter layanan
const PRICE_RANGES = [
  { key: "all", label: "Semua Harga" },
  { key: "under100", label: "< Rp100rb" },
  { key: "100to300", label: "Rp100rb - Rp300rb" },
  { key: "over300", label: "> Rp300rb" },
];

export default function UserDashboardScreen() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ============== STATE: BENGKEL & LAYANAN ==============
  const [bengkels, setBengkels] = useState([]);
  const [isLoadingBengkels, setIsLoadingBengkels] = useState(true);

  const [bengkelModalVisible, setBengkelModalVisible] = useState(false);
  const [selectedBengkel, setSelectedBengkel] = useState(null);
  const [bengkelServices, setBengkelServices] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);

  // ============== STATE: KONFIRMASI LAYANAN ==============
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingService, setPendingService] = useState(null);

  // ============== STATE: PENCARIAN & FILTER BENGKEL ==============
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [sortOption, setSortOption] = useState("name_asc"); // name_asc | name_desc

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [draftLocationFilter, setDraftLocationFilter] = useState("");
  const [draftSortOption, setDraftSortOption] = useState("name_asc");

  // ============== STATE: PENCARIAN & FILTER LAYANAN (di dalam modal bengkel) ==============
  const [serviceSearch, setServiceSearch] = useState("");
  const [servicePriceRange, setServicePriceRange] = useState("all");
  const [serviceSort, setServiceSort] = useState("default"); // default | price_asc | price_desc

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
  // FETCH: Daftar Bengkel
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
  // FETCH: Layanan milik Bengkel tertentu
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
    setServiceSearch("");
    setServicePriceRange("all");
    setServiceSort("default");
    fetchBengkelServices(bengkel.id);
  };

  const closeBengkelModal = () => {
    setBengkelModalVisible(false);
    setSelectedBengkel(null);
    setBengkelServices([]);
  };

  const handlePressService = (service) => {
    setPendingService(service);
    setConfirmVisible(true);
  };

  const handleCancelConfirm = () => {
    setConfirmVisible(false);
    setPendingService(null);
  };

  const handleConfirmService = () => {
    if (!pendingService) return;

    const bengkelId = selectedBengkel?.id;
    const bengkelName = selectedBengkel?.name;
    const serviceId = pendingService?.id;
    const serviceName = pendingService?.service_name;

    setConfirmVisible(false);
    setBengkelModalVisible(false);
    setPendingService(null);

    setTimeout(() => {
      router.push({
        pathname: "/booking",
        params: {
          bengkel_id: bengkelId,
          bengkel_name: bengkelName,
          service_id: serviceId,
          service_name: serviceName,
        },
      });
    }, 150);
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

  // ==========================================
  // FILTER & SORT: Bengkel (pencarian nama/alamat + filter lokasi + urutan)
  // ==========================================
  const filteredBengkels = useMemo(() => {
    let list = [...bengkels];

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (b) =>
          b.name?.toLowerCase().includes(q) ||
          b.address?.toLowerCase().includes(q)
      );
    }

    if (locationFilter.trim()) {
      const q = locationFilter.trim().toLowerCase();
      list = list.filter((b) => b.address?.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      if (sortOption === "name_desc") {
        return (b.name || "").localeCompare(a.name || "");
      }
      return (a.name || "").localeCompare(b.name || "");
    });

    return list;
  }, [bengkels, searchQuery, locationFilter, sortOption]);

  const activeFilterCount =
    (locationFilter.trim() ? 1 : 0) + (sortOption !== "name_asc" ? 1 : 0);

  const openFilterModal = () => {
    setDraftLocationFilter(locationFilter);
    setDraftSortOption(sortOption);
    setFilterModalVisible(true);
  };

  const applyFilter = () => {
    setLocationFilter(draftLocationFilter);
    setSortOption(draftSortOption);
    setFilterModalVisible(false);
  };

  const resetFilter = () => {
    setDraftLocationFilter("");
    setDraftSortOption("name_asc");
  };

  // ==========================================
  // FILTER & SORT: Layanan di dalam bengkel (pencarian + harga + urutan)
  // ==========================================
  const filteredServices = useMemo(() => {
    let list = [...bengkelServices];

    if (serviceSearch.trim()) {
      const q = serviceSearch.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.service_name?.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q)
      );
    }

    if (servicePriceRange !== "all") {
      list = list.filter((s) => {
        const price = Number(s.price) || 0;
        if (servicePriceRange === "under100") return price < 100000;
        if (servicePriceRange === "100to300")
          return price >= 100000 && price <= 300000;
        if (servicePriceRange === "over300") return price > 300000;
        return true;
      });
    }

    if (serviceSort === "price_asc") {
      list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (serviceSort === "price_desc") {
      list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    }

    return list;
  }, [bengkelServices, serviceSearch, servicePriceRange, serviceSort]);

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
          source={require("../../assets/workshop-bg.png")}
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
        {/* ================= HERO PENCARIAN ================= */}
        <View style={styles.searchHero}>
          <View style={styles.searchHeroGlow} />
          <Text style={styles.searchHeroTitle}>Butuh servis kendaraan?</Text>
          <Text style={styles.searchHeroSubtitle}>
            Cari bengkel rekanan terdekat & booking langsung
          </Text>

          <View style={styles.searchBarRow}>
            <View style={styles.searchBarWrap}>
              <Search size={16} color="#71717a" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Cari nama bengkel atau alamat..."
                placeholderTextColor="#71717a"
                style={styles.searchInput}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <X size={16} color="#71717a" />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.filterButton}
              onPress={openFilterModal}
              activeOpacity={0.8}
            >
              <SlidersHorizontal size={17} color="#fff" />
              {activeFilterCount > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>
                    {activeFilterCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {(locationFilter.trim() || sortOption !== "name_asc") && (
            <View style={styles.activeChipRow}>
              {locationFilter.trim() ? (
                <View style={styles.activeChip}>
                  <MapPin size={11} color="#dc2626" />
                  <Text style={styles.activeChipText} numberOfLines={1}>
                    {locationFilter}
                  </Text>
                  <TouchableOpacity onPress={() => setLocationFilter("")}>
                    <X size={12} color="#a1a1aa" />
                  </TouchableOpacity>
                </View>
              ) : null}
              {sortOption !== "name_asc" ? (
                <View style={styles.activeChip}>
                  <ArrowUpAZ size={11} color="#dc2626" />
                  <Text style={styles.activeChipText}>Nama Z-A</Text>
                  <TouchableOpacity onPress={() => setSortOption("name_asc")}>
                    <X size={12} color="#a1a1aa" />
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          )}
        </View>

        {/* ================= SECTION: DAFTAR BENGKEL ================= */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Bengkel Partner</Text>
          {!isLoadingBengkels && (
            <Text style={styles.resultCountText}>
              {filteredBengkels.length} ditemukan
            </Text>
          )}
        </View>

        {isLoadingBengkels ? (
          <View style={styles.bengkelLoadingBox}>
            <ActivityIndicator size="small" color="#dc2626" />
          </View>
        ) : filteredBengkels.length === 0 ? (
          <View style={styles.bengkelEmptyBox}>
            <Store size={28} color="#52525b" />
            <Text style={styles.bengkelEmptyText}>
              {bengkels.length === 0
                ? "Belum ada bengkel partner tersedia."
                : "Tidak ada bengkel yang cocok dengan pencarian/filter kamu."}
            </Text>
            {bengkels.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery("");
                  setLocationFilter("");
                  setSortOption("name_asc");
                }}
                style={styles.clearAllBtn}
              >
                <RotateCcw size={12} color="#dc2626" />
                <Text style={styles.clearAllBtnText}>Reset pencarian & filter</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.bengkelVerticalList}>
            {filteredBengkels.map((bengkel) => (
              <TouchableOpacity
                key={bengkel.id}
                style={styles.bengkelRowCard}
                activeOpacity={0.8}
                onPress={() => openBengkelModal(bengkel)}
              >
                <View style={styles.bengkelRowIconWrap}>
                  <Store size={20} color="#dc2626" />
                </View>

                <View style={styles.bengkelRowBody}>
                  <Text style={styles.bengkelRowName} numberOfLines={1}>
                    {bengkel.name}
                  </Text>

                  <View style={styles.bengkelRowMetaLine}>
                    <MapPin size={11} color="#a1a1aa" />
                    <Text style={styles.bengkelRowMetaText} numberOfLines={1}>
                      {bengkel.address}
                    </Text>
                  </View>

                  <View style={styles.bengkelRowMetaLine}>
                    <Phone size={11} color="#a1a1aa" />
                    <Text style={styles.bengkelRowMetaText} numberOfLines={1}>
                      {bengkel.phone}
                    </Text>
                  </View>
                </View>

                <ChevronRight size={18} color="#52525b" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ================= MODAL: FILTER BENGKEL (LOKASI & URUTAN) ================= */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterModalContent}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Filter Bengkel</Text>
              <TouchableOpacity
                onPress={() => setFilterModalVisible(false)}
                style={styles.confirmModalCloseBtn}
              >
                <X size={16} color="#a1a1aa" />
              </TouchableOpacity>
            </View>

            <Text style={styles.filterGroupLabel}>Lokasi / Alamat</Text>
            <View style={styles.filterInputWrap}>
              <MapPin size={15} color="#71717a" />
              <TextInput
                value={draftLocationFilter}
                onChangeText={setDraftLocationFilter}
                placeholder="cth: Kopo, Soekarno-Hatta, Buah Batu..."
                placeholderTextColor="#71717a"
                style={styles.filterInput}
              />
            </View>

            <Text style={styles.filterGroupLabel}>Urutkan</Text>
            <View style={styles.sortOptionList}>
              <TouchableOpacity
                style={styles.sortOptionRow}
                onPress={() => setDraftSortOption("name_asc")}
              >
                <View style={styles.sortOptionLabelRow}>
                  <ArrowDownAZ size={15} color="#a1a1aa" />
                  <Text style={styles.sortOptionText}>Nama (A-Z)</Text>
                </View>
                <View
                  style={[
                    styles.radioOuter,
                    draftSortOption === "name_asc" && styles.radioOuterActive,
                  ]}
                >
                  {draftSortOption === "name_asc" && (
                    <Check size={12} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sortOptionRow}
                onPress={() => setDraftSortOption("name_desc")}
              >
                <View style={styles.sortOptionLabelRow}>
                  <ArrowUpAZ size={15} color="#a1a1aa" />
                  <Text style={styles.sortOptionText}>Nama (Z-A)</Text>
                </View>
                <View
                  style={[
                    styles.radioOuter,
                    draftSortOption === "name_desc" && styles.radioOuterActive,
                  ]}
                >
                  {draftSortOption === "name_desc" && (
                    <Check size={12} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.filterModalActions}>
              <TouchableOpacity
                style={styles.confirmModalCancelBtn}
                onPress={resetFilter}
              >
                <Text style={styles.confirmModalCancelText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmModalOkBtn}
                onPress={applyFilter}
              >
                <Text style={styles.confirmModalOkText}>Terapkan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL: DETAIL BENGKEL + DAFTAR LAYANAN ================= */}
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

            {/* PENCARIAN LAYANAN */}
            <View style={styles.serviceSearchWrap}>
              <Search size={14} color="#71717a" />
              <TextInput
                value={serviceSearch}
                onChangeText={setServiceSearch}
                placeholder="Cari layanan..."
                placeholderTextColor="#71717a"
                style={styles.serviceSearchInput}
              />
              {serviceSearch.length > 0 && (
                <TouchableOpacity onPress={() => setServiceSearch("")}>
                  <X size={14} color="#71717a" />
                </TouchableOpacity>
              )}
            </View>

            {/* FILTER HARGA LAYANAN */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.priceChipRow}
              contentContainerStyle={{ gap: 8 }}
            >
              {PRICE_RANGES.map((range) => (
                <TouchableOpacity
                  key={range.key}
                  onPress={() => setServicePriceRange(range.key)}
                  style={[
                    styles.priceChip,
                    servicePriceRange === range.key && styles.priceChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.priceChipText,
                      servicePriceRange === range.key &&
                        styles.priceChipTextActive,
                    ]}
                  >
                    {range.label}
                  </Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                onPress={() =>
                  setServiceSort(
                    serviceSort === "price_asc" ? "price_desc" : "price_asc"
                  )
                }
                style={[styles.priceChip, styles.sortChip]}
              >
                {serviceSort === "price_desc" ? (
                  <ArrowUpAZ size={12} color="#dc2626" />
                ) : (
                  <ArrowDownAZ size={12} color="#dc2626" />
                )}
                <Text style={styles.sortChipText}>
                  {serviceSort === "price_asc"
                    ? "Termurah"
                    : serviceSort === "price_desc"
                    ? "Termahal"
                    : "Urutkan Harga"}
                </Text>
              </TouchableOpacity>
            </ScrollView>

            <Text style={styles.bengkelModalSectionLabel}>
              Daftar Layanan Tersedia
            </Text>

            {isLoadingServices ? (
              <View style={styles.bengkelLoadingBox}>
                <ActivityIndicator size="small" color="#dc2626" />
              </View>
            ) : filteredServices.length === 0 ? (
              <View style={styles.bengkelEmptyBox}>
                <Wrench size={28} color="#52525b" />
                <Text style={styles.bengkelEmptyText}>
                  {bengkelServices.length === 0
                    ? "Bengkel ini belum memiliki daftar layanan."
                    : "Tidak ada layanan yang cocok dengan pencarian/filter."}
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.serviceScrollList}
                showsVerticalScrollIndicator={false}
              >
                {filteredServices.map((service) => (
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

      {/* ================= MODAL: KONFIRMASI LAYANAN ================= */}
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

      {/* ================= BOTTOM NAVIGATION BAR ================= */}
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

  // ===== HERO PENCARIAN =====
  searchHero: {
    backgroundColor: "rgba(9, 9, 11, 0.9)",
    borderWidth: 1,
    borderColor: "#18181b",
    borderRadius: 22,
    padding: 18,
    marginBottom: 20,
    overflow: "hidden",
  },
  searchHeroGlow: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(220, 38, 38, 0.18)",
    top: -100,
    right: -60,
  },
  searchHeroTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
  searchHeroSubtitle: {
    color: "#a1a1aa",
    fontSize: 11.5,
    marginTop: 4,
    marginBottom: 16,
  },
  searchBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchBarWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 13,
  },
  filterButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#dc2626",
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 3,
    borderRadius: 9,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: {
    color: "#dc2626",
    fontSize: 10,
    fontWeight: "900",
  },
  activeChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  activeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(220, 38, 38, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.35)",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    maxWidth: 200,
  },
  activeChipText: {
    color: "#fff",
    fontSize: 10.5,
    fontWeight: "700",
    flexShrink: 1,
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
  resultCountText: {
    color: "#71717a",
    fontSize: 11,
    fontWeight: "700",
  },

  // ===== DAFTAR BENGKEL (LIST VERTIKAL) =====
  bengkelVerticalList: {
    gap: 10,
  },
  bengkelRowCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(9, 9, 11, 0.85)",
    borderWidth: 1,
    borderColor: "#18181b",
    borderRadius: 16,
    padding: 12,
  },
  bengkelRowIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: "rgba(220, 38, 38, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  bengkelRowBody: {
    flex: 1,
    gap: 4,
  },
  bengkelRowName: {
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "900",
  },
  bengkelRowMetaLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  bengkelRowMetaText: {
    color: "#a1a1aa",
    fontSize: 10.5,
    flex: 1,
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
  clearAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.35)",
  },
  clearAllBtnText: {
    color: "#dc2626",
    fontSize: 10.5,
    fontWeight: "800",
  },

  // MODAL OVERLAY
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  // ===== MODAL FILTER BENGKEL =====
  filterModalContent: {
    width: "100%",
    backgroundColor: "#09090b",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 20,
    padding: 18,
    gap: 4,
  },
  filterModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  filterModalTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
  },
  filterGroupLabel: {
    color: "#71717a",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 12,
    marginBottom: 8,
  },
  filterInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  filterInput: {
    flex: 1,
    color: "#fff",
    fontSize: 12.5,
  },
  sortOptionList: {
    gap: 8,
  },
  sortOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(24, 24, 27, 0.6)",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  sortOptionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sortOptionText: {
    color: "#e4e4e7",
    fontSize: 12.5,
    fontWeight: "700",
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#3f3f46",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterActive: {
    backgroundColor: "#dc2626",
    borderColor: "#dc2626",
  },
  filterModalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },

  // ===== MODAL: DETAIL BENGKEL + LAYANAN =====
  bengkelModalContent: {
    width: "100%",
    maxHeight: "82%",
    backgroundColor: "#09090b",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 20,
    padding: 18,
    gap: 10,
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

  // pencarian & filter layanan
  serviceSearchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
  },
  serviceSearchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 12.5,
  },
  priceChipRow: {
    flexGrow: 0,
  },
  priceChip: {
    borderWidth: 1,
    borderColor: "#27272a",
    backgroundColor: "rgba(24, 24, 27, 0.6)",
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  priceChipActive: {
    backgroundColor: "#dc2626",
    borderColor: "#dc2626",
  },
  priceChipText: {
    color: "#a1a1aa",
    fontSize: 10.5,
    fontWeight: "700",
  },
  priceChipTextActive: {
    color: "#fff",
  },
  sortChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderColor: "rgba(220, 38, 38, 0.35)",
  },
  sortChipText: {
    color: "#dc2626",
    fontSize: 10.5,
    fontWeight: "800",
  },

  bengkelModalSectionLabel: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 2,
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