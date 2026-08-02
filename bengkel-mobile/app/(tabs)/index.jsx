import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  ActivityIndicator,
  Alert,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Wrench,
  ShieldCheck,
  Clock,
  ArrowRight,
  Star,
  ChevronRight,
  MapPin,
  Phone,
  Store,
} from "lucide-react-native";

const { width } = Dimensions.get("window");
const API_URL = "https://your-api-domain.com"; // Ganti dengan URL API kamu

export default function LandingScreen({ navigation }) {
  const [bengkels, setBengkels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/bengkels`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setBengkels(data.data || []);
        }
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error memuat data:", error);
        setIsLoading(false);
      });
  }, []);

  const handleCtaClick = async () => {
    try {
      const session = await AsyncStorage.getItem("user_session");

      if (session) {
        const parsed = JSON.parse(session);
        // Navigasi sesuai role
        if (parsed.role === "superadmin") {
          navigation.navigate("SuperAdminDashboard");
        } else if (parsed.role === "admin_bengkel") {
          navigation.navigate("AdminDashboard");
        } else {
          navigation.navigate("UserDashboard");
        }
      } else {
        Alert.alert(
          "Autentikasi Diperlukan",
          "Silakan masuk atau daftar akun terlebih dahulu untuk melakukan reservasi servis kendaraan.",
          [
            { text: "Nanti Saja", style: "cancel" },
            {
              text: "Masuk / Daftar",
              onPress: () => navigation.navigate("Login"),
            },
          ]
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#dc2626" />
        <Text style={styles.loadingText}>Memuat BengkelKu...</Text>
      </View>
    );
  }

  const bestBengkels = bengkels.slice(0, 3);
  const otherBengkels = bengkels.slice(3);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* HEADER / NAVBAR */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Wrench size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.logoText}>
            BENGKEL<Text style={{ color: "#dc2626" }}>KU</Text>
          </Text>
        </View>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.headerBtnText}>Masuk</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HERO SECTION */}
        <View style={styles.heroContainer}>
          <ImageBackground
            source={{ uri: "https://via.placeholder.com/800x600" }} // Ganti dengan path gambar kamu
            style={styles.heroBg}
            imageStyle={{ opacity: 0.3 }}
          >
            <View style={styles.badge}>
              <View style={styles.badgeDot} />
              <Text style={styles.badgeText}>
                Platform Perawatan Otomotif Digital
              </Text>
            </View>

            <Text style={styles.heroTitle}>
              PRESISI TINGGI UNTUK{" "}
              <Text style={{ color: "#dc2626" }}>KENDARAAN ANDA</Text>.
            </Text>

            <Text style={styles.heroSubtitle}>
              Booking servis kendaraan tanpa antre, bandingkan harga bengkel, dan
              pantau progres pengerjaan secara real-time.
            </Text>

            <View style={styles.ctaButtonGroup}>
              <TouchableOpacity
                style={styles.primaryCta}
                onPress={handleCtaClick}
              >
                <Text style={styles.primaryCtaText}>Mulai Reservasi</Text>
                <ArrowRight size={16} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryCta}
                onPress={() => navigation.navigate("Login")}
              >
                <Text style={styles.secondaryCtaText}>Akses Dashboard</Text>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </View>

        {/* SECTION 1: BENGKEL POPULER */}
        {bestBengkels.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionSubtitle}>MITRA UNGGULAN</Text>
            <Text style={styles.sectionTitle}>Bengkel Rekomendasi Kami</Text>
            <Text style={styles.sectionDesc}>
              Dipercaya ratusan pelanggan dengan mekanik profesional
              tersertifikasi.
            </Text>

            <View style={styles.cardList}>
              {bestBengkels.map((bengkel, index) => {
                const isPopular = index === 1;
                return (
                  <View
                    key={bengkel.id || index.toString()}
                    style={[
                      styles.bengkelCard,
                      isPopular && styles.popularBengkelCard,
                    ]}
                  >
                    {isPopular && (
                      <View style={styles.popularBadge}>
                        <Star size={10} color="#FFFFFF" fill="#FFFFFF" />
                        <Text style={styles.popularBadgeText}>POPULAR</Text>
                      </View>
                    )}
                    <Text style={styles.bengkelName}>{bengkel.name}</Text>
                    <View style={styles.infoGroup}>
                      <View style={styles.infoRow}>
                        <MapPin size={14} color="#ef4444" />
                        <Text style={styles.infoText}>{bengkel.address}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Phone size={14} color="#ef4444" />
                        <Text style={styles.infoText}>{bengkel.phone}</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.cardButton,
                        isPopular ? styles.popularBtn : styles.normalBtn,
                      ]}
                      onPress={handleCtaClick}
                    >
                      <Text
                        style={[
                          styles.cardBtnText,
                          isPopular ? { color: "#FFF" } : { color: "#FFF" },
                        ]}
                      >
                        Booking di Sini
                      </Text>
                      <ChevronRight size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* SECTION 2: DAFTAR BENGKEL LAINNYA */}
        {otherBengkels.length > 0 && (
          <View style={[styles.section, styles.borderTop]}>
            <Text style={styles.sectionTitle}>Katalog Mitra Bengkel</Text>
            <Text style={styles.sectionDesc}>
              Temukan bengkel terdekat di wilayahmu.
            </Text>

            <View style={styles.cardList}>
              {otherBengkels.map((bengkel, index) => (
                <View
                  key={bengkel.id || index.toString()}
                  style={styles.otherBengkelCard}
                >
                  <Text style={styles.otherBengkelTitle}>{bengkel.name}</Text>
                  <View style={styles.infoGroup}>
                    <View style={styles.infoRow}>
                      <MapPin size={12} color="#a1a1aa" />
                      <Text style={styles.infoText}>{bengkel.address}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Phone size={12} color="#a1a1aa" />
                      <Text style={styles.infoText}>{bengkel.phone}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.otherBengkelBtn}
                    onPress={handleCtaClick}
                  >
                    <Text style={styles.otherBengkelBtnText}>
                      Pilih Bengkel Ini
                    </Text>
                    <ChevronRight size={14} color="#d4d4d8" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* SECTION 3: CTA GABUNG MITRA */}
        <View style={styles.mitraBanner}>
          <Text style={styles.mitraTitle}>Punya Bengkel Sendiri?</Text>
          <Text style={styles.mitraSubtitle}>
            Tingkatkan Omset Bersama Kami.
          </Text>
          <Text style={styles.mitraDesc}>
            Bergabunglah menjadi mitra BengkelKu. Kelola antrean lebih mudah,
            jangkau lebih banyak pelanggan, dan atur jadwal operasional secara
            digital 100% gratis.
          </Text>
          <TouchableOpacity
            style={styles.mitraBtn}
            onPress={() => navigation.navigate("RegisterMitra")}
          >
            <Store size={18} color="#000000" />
            <Text style={styles.mitraBtnText}>Daftar Mitra Sekarang</Text>
          </TouchableOpacity>
        </View>

        {/* SECTION 4: VALUE PROPS */}
        <View style={[styles.section, styles.borderTop]}>
          <View style={styles.propCard}>
            <View style={styles.propIconBox}>
              <Clock size={20} color="#dc2626" />
            </View>
            <Text style={styles.propTitle}>Realtime Tracking</Text>
            <Text style={styles.propDesc}>
              Pantau status pengerjaan kendaraanmu secara langsung dari
              perangkat kapanpun dan dimanapun.
            </Text>
          </View>

          <View style={styles.propCard}>
            <View style={styles.propIconBox}>
              <ShieldCheck size={20} color="#dc2626" />
            </View>
            <Text style={styles.propTitle}>Mitra Terpercaya</Text>
            <Text style={styles.propDesc}>
              Bekerja sama dengan puluhan bengkel bersertifikasi untuk menjamin
              kualitas servis kendaraan Anda.
            </Text>
          </View>

          <View style={styles.propCard}>
            <View style={styles.propIconBox}>
              <Wrench size={20} color="#dc2626" />
            </View>
            <Text style={styles.propTitle}>Transparan & Cepat</Text>
            <Text style={styles.propDesc}>
              Bebas antre di lokasi, estimasi pengerjaan jelas, dan layanan
              komprehensif tanpa biaya tersembunyi.
            </Text>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © {new Date().getFullYear()} BENGKELKU. All rights reserved.
          </Text>
        </View>
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
    fontWeight: "bold",
    fontSize: 14,
  },
  header: {
    height: 60,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#18181b",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#dc2626",
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 1,
  },
  headerBtn: {
    backgroundColor: "#18181b",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  headerBtnText: {
    color: "#a1a1aa",
    fontSize: 12,
    fontWeight: "600",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroContainer: {
    minHeight: 450,
    backgroundColor: "#000000",
  },
  heroBg: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(24, 24, 27, 0.8)",
    borderWidth: 1,
    borderColor: "#27272a",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
    gap: 8,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#dc2626",
  },
  badgeText: {
    color: "#d4d4d8",
    fontSize: 12,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
    lineHeight: 36,
    marginBottom: 12,
  },
  heroSubtitle: {
    color: "#d4d4d8",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 320,
    marginBottom: 24,
  },
  ctaButtonGroup: {
    width: "100%",
    gap: 12,
  },
  primaryCta: {
    backgroundColor: "#dc2626",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  primaryCtaText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  secondaryCta: {
    backgroundColor: "rgba(39, 39, 42, 0.8)",
    borderWidth: 1,
    borderColor: "#52525b",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
  },
  secondaryCtaText: {
    color: "#e4e4e7",
    fontWeight: "bold",
    fontSize: 14,
  },
  section: {
    padding: 20,
    marginTop: 20,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: "#18181b",
  },
  sectionSubtitle: {
    color: "#dc2626",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    textAlign: "center",
    marginBottom: 4,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 6,
  },
  sectionDesc: {
    color: "#a1a1aa",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 24,
  },
  cardList: {
    gap: 16,
  },
  bengkelCard: {
    backgroundColor: "#09090b",
    borderWidth: 1,
    borderColor: "#18181b",
    borderRadius: 20,
    padding: 20,
  },
  popularBengkelCard: {
    borderColor: "#dc2626",
    borderWidth: 2,
    backgroundColor: "#09090b",
  },
  popularBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#dc2626",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  popularBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },
  bengkelName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  infoGroup: {
    gap: 6,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    color: "#a1a1aa",
    fontSize: 12,
    flexShrink: 1,
  },
  cardButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  popularBtn: {
    backgroundColor: "#dc2626",
  },
  normalBtn: {
    backgroundColor: "#18181b",
  },
  cardBtnText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  otherBengkelCard: {
    backgroundColor: "#09090b",
    borderWidth: 1,
    borderColor: "#18181b",
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  otherBengkelTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  otherBengkelBtn: {
    backgroundColor: "#18181b",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
  },
  otherBengkelBtnText: {
    color: "#d4d4d8",
    fontSize: 12,
    fontWeight: "600",
  },
  mitraBanner: {
    margin: 20,
    backgroundColor: "#18181b",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#27272a",
  },
  mitraTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },
  mitraSubtitle: {
    color: "#ef4444",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  mitraDesc: {
    color: "#a1a1aa",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 20,
  },
  mitraBtn: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  mitraBtnText: {
    color: "#000000",
    fontWeight: "900",
    fontSize: 13,
  },
  propCard: {
    backgroundColor: "#09090b",
    borderWidth: 1,
    borderColor: "#18181b",
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
  },
  propIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(220, 38, 38, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  propTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 6,
  },
  propDesc: {
    color: "#a1a1aa",
    fontSize: 12,
    lineHeight: 18,
  },
  footer: {
    padding: 20,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#18181b",
  },
  footerText: {
    color: "#52525b",
    fontSize: 11,
  },
});