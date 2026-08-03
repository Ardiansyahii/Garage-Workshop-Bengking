import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
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
} from "lucide-react-native";

// ==========================================
// KONFIGURASI
// ==========================================
// Ganti dengan base URL backend Express kamu.
// Di React Native TIDAK ADA process.env.NEXT_PUBLIC_API_URL bawaan Next.js,
// jadi definisikan langsung di sini atau lewat file config/env terpisah
// (misal pakai react-native-dotenv / expo-constants).
const API_URL = "http://192.168.1.16:5000";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Ganti dengan path gambar lokal kamu, contoh:
// const workshopBg = require("../assets/workshop-bg.png");
// lalu pakai <Image source={workshopBg} ... />
const WORKSHOP_BG_URI = "../../assets/banner-bg.png";

export default function LandingScreen() {
  const router = useRouter();
  const [bengkels, setBengkels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

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

  useEffect(() => {
    if (!isLoading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isLoading]);

  const handleCtaClick = async () => {
    const session = await AsyncStorage.getItem("user_session");

    if (session) {
      const parsed = JSON.parse(session);
      if (parsed.role === "superadmin") router.push("/superadmin");
      else if (parsed.role === "admin_bengkel") router.push("/admin");
      else router.push("/dashboard");
    } else {
      Alert.alert(
        "Autentikasi Diperlukan",
        "Silakan masuk atau daftar akun terlebih dahulu untuk melakukan reservasi servis kendaraan.",
        [
          { text: "Nanti Saja", style: "cancel" },
          { text: "Masuk / Daftar", onPress: () => router.push("/login") },
        ],
      );
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
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logoBox}>
            <Wrench size={16} color="#fff" />
          </View>
          <Text style={styles.logoText}>
            BENGKEL<Text style={{ color: "#dc2626" }}>KU</Text>
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => router.push("/login")}>
            <Text style={styles.headerLink}>Masuk</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerCta}
            onPress={() => router.push("/register")}
          >
            <Text style={styles.headerCtaText}>Buat Akun</Text>
            <ArrowRight size={14} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO SECTION */}
        <View style={styles.hero}>
          <Image
            source={{ uri: WORKSHOP_BG_URI }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />

          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              alignItems: "center",
              paddingHorizontal: 24,
            }}
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
              Booking servis kendaraan tanpa antre, bandingkan harga bengkel,
              dan pantau progres pengerjaan secara real-time.
            </Text>

            <View style={styles.heroButtons}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleCtaClick}
              >
                <Text style={styles.primaryButtonText}>Mulai Reservasi</Text>
                <ArrowRight size={16} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => router.push("/login")}
              >
                <Text style={styles.secondaryButtonText}>
                  Akses Dashboard
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>

        {/* SECTION 1: BENGKEL POPULER */}
        {bestBengkels.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEyebrow}>Mitra Unggulan</Text>
              <Text style={styles.sectionTitle}>Bengkel Rekomendasi Kami</Text>
              <Text style={styles.sectionSubtitle}>
                Dipercaya ratusan pelanggan dengan mekanik profesional
                tersertifikasi.
              </Text>
            </View>

            <View style={styles.cardStack}>
              {bestBengkels.map((bengkel, index) => {
                const isPopular = index === 1;
                return (
                  <View
                    key={bengkel.id}
                    style={[
                      styles.bengkelCard,
                      isPopular && styles.bengkelCardPopular,
                    ]}
                  >
                    {isPopular && (
                      <View style={styles.popularBadge}>
                        <Star size={10} color="#fff" fill="#fff" />
                        <Text style={styles.popularBadgeText}>POPULAR</Text>
                      </View>
                    )}

                    <Text style={styles.bengkelName}>{bengkel.name}</Text>

                    <View style={styles.bengkelInfoRow}>
                      <MapPin size={14} color="#ef4444" />
                      <Text style={styles.bengkelInfoText}>
                        {bengkel.address}
                      </Text>
                    </View>
                    <View style={styles.bengkelInfoRow}>
                      <Phone size={14} color="#ef4444" />
                      <Text style={styles.bengkelInfoText}>
                        {bengkel.phone}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.bengkelButton,
                        isPopular
                          ? styles.bengkelButtonPopular
                          : styles.bengkelButtonDefault,
                      ]}
                      onPress={handleCtaClick}
                    >
                      <Text style={styles.bengkelButtonText}>
                        Booking di Sini
                      </Text>
                      <ChevronRight size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* SECTION 2: DAFTAR BENGKEL LAINNYA */}
        {otherBengkels.length > 0 && (
          <View style={[styles.section, styles.sectionBorderTop]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Katalog Mitra Bengkel</Text>
              <Text style={styles.sectionSubtitle}>
                Temukan bengkel terdekat di wilayahmu.
              </Text>
            </View>

            <View style={styles.cardStack}>
              {otherBengkels.map((bengkel) => (
                <View key={bengkel.id} style={styles.otherCard}>
                  <Text style={styles.otherCardName}>{bengkel.name}</Text>
                  <View style={styles.bengkelInfoRow}>
                    <MapPin size={13} color="#a1a1aa" />
                    <Text style={styles.otherCardText}>
                      {bengkel.address}
                    </Text>
                  </View>
                  <View style={styles.bengkelInfoRow}>
                    <Phone size={13} color="#a1a1aa" />
                    <Text style={styles.otherCardText}>{bengkel.phone}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.otherCardButton}
                    onPress={handleCtaClick}
                  >
                    <Text style={styles.otherCardButtonText}>
                      Pilih Bengkel Ini
                    </Text>
                    <ChevronRight size={14} color="#d4d4d8" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* SECTION 3: VALUE PROPS */}
        <View style={[styles.section, styles.sectionBorderTop]}>
          <View style={styles.valueCard}>
            <View style={styles.valueIconBox}>
              <Clock size={20} color="#dc2626" />
            </View>
            <Text style={styles.valueTitle}>Realtime Tracking</Text>
            <Text style={styles.valueText}>
              Pantau status pengerjaan kendaraanmu secara langsung dari
              perangkat kapanpun dan dimanapun.
            </Text>
          </View>

          <View style={styles.valueCard}>
            <View style={styles.valueIconBox}>
              <ShieldCheck size={20} color="#dc2626" />
            </View>
            <Text style={styles.valueTitle}>Mitra Terpercaya</Text>
            <Text style={styles.valueText}>
              Bekerja sama dengan puluhan bengkel bersertifikasi untuk
              menjamin kualitas servis kendaraan Anda.
            </Text>
          </View>

          <View style={styles.valueCard}>
            <View style={styles.valueIconBox}>
              <Wrench size={20} color="#dc2626" />
            </View>
            <Text style={styles.valueTitle}>Transparan & Cepat</Text>
            <Text style={styles.valueText}>
              Bebas antre di lokasi, estimasi pengerjaan jelas, dan layanan
              komprehensif tanpa biaya tersembunyi.
            </Text>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerCopy}>
            © {new Date().getFullYear()} BENGKELKU. All rights reserved.
          </Text>
          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={() => router.push("/login")}>
              <Text style={styles.footerLink}>Masuk</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/register")}>
              <Text style={styles.footerLink}>Daftar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
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
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingText: {
    color: "#71717a",
    fontWeight: "700",
    fontSize: 13,
  },
  scroll: {
    flex: 1,
  },

  // HEADER
  header: {
    height: 64,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.9)",
    borderBottomWidth: 1,
    borderBottomColor: "#18181b",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#dc2626",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 15,
    letterSpacing: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerLink: {
    color: "#a1a1aa",
    fontSize: 12,
    fontWeight: "600",
  },
  headerCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#dc2626",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  headerCtaText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },

  // HERO
  hero: {
    minHeight: 560,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingBottom: 60,
    overflow: "hidden",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(24,24,27,0.8)",
    borderWidth: 1,
    borderColor: "#27272a",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    marginBottom: 20,
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: "#dc2626",
  },
  badgeText: {
    color: "#d4d4d8",
    fontSize: 11,
    fontWeight: "600",
  },
  heroTitle: {
    color: "#fff",
    fontSize: SCREEN_WIDTH < 380 ? 32 : 38,
    fontWeight: "900",
    textAlign: "center",
    lineHeight: SCREEN_WIDTH < 380 ? 38 : 44,
    marginBottom: 16,
  },
  heroSubtitle: {
    color: "#d4d4d8",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 28,
    maxWidth: 440,
  },
  heroButtons: {
    width: "100%",
    gap: 12,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#dc2626",
    paddingVertical: 16,
    borderRadius: 14,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
  },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(39,39,42,0.8)",
    borderWidth: 1,
    borderColor: "#52525b",
    paddingVertical: 16,
    borderRadius: 14,
  },
  secondaryButtonText: {
    color: "#e4e4e7",
    fontWeight: "800",
    fontSize: 13,
  },

  // SECTIONS
  section: {
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  sectionBorderTop: {
    borderTopWidth: 1,
    borderTopColor: "rgba(39,39,42,0.8)",
  },
  sectionHeader: {
    alignItems: "center",
    marginBottom: 28,
    gap: 6,
  },
  sectionEyebrow: {
    color: "#dc2626",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },
  sectionSubtitle: {
    color: "#a1a1aa",
    fontSize: 12,
    textAlign: "center",
  },

  cardStack: {
    gap: 16,
  },

  // BENGKEL CARD (populer)
  bengkelCard: {
    backgroundColor: "rgba(9,9,11,0.8)",
    borderWidth: 1,
    borderColor: "#18181b",
    borderRadius: 20,
    padding: 22,
  },
  bengkelCardPopular: {
    borderWidth: 2,
    borderColor: "#dc2626",
    backgroundColor: "#0a0a0a",
  },
  popularBadge: {
    position: "absolute",
    top: -12,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#dc2626",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  popularBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  bengkelName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 10,
  },
  bengkelInfoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 6,
  },
  bengkelInfoText: {
    color: "#a1a1aa",
    fontSize: 12,
    flex: 1,
  },
  bengkelButton: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
  },
  bengkelButtonDefault: {
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
  },
  bengkelButtonPopular: {
    backgroundColor: "#dc2626",
  },
  bengkelButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },

  // OTHER BENGKEL CARD
  otherCard: {
    backgroundColor: "rgba(9,9,11,0.6)",
    borderWidth: 1,
    borderColor: "#18181b",
    borderRadius: 16,
    padding: 18,
  },
  otherCardName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 8,
  },
  otherCardText: {
    color: "#a1a1aa",
    fontSize: 12,
    flex: 1,
  },
  otherCardButton: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
    paddingVertical: 11,
    borderRadius: 12,
  },
  otherCardButtonText: {
    color: "#d4d4d8",
    fontSize: 12,
    fontWeight: "700",
  },

  // VALUE PROPS
  valueCard: {
    backgroundColor: "#09090b",
    borderWidth: 1,
    borderColor: "#18181b",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    gap: 8,
  },
  valueIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(220,38,38,0.1)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  valueTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  valueText: {
    color: "#a1a1aa",
    fontSize: 12,
    lineHeight: 18,
  },

  // FOOTER
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#18181b",
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 12,
  },
  footerCopy: {
    color: "#71717a",
    fontSize: 11,
  },
  footerLinks: {
    flexDirection: "row",
    gap: 20,
  },
  footerLink: {
    color: "#71717a",
    fontSize: 11,
    fontWeight: "600",
  },
});