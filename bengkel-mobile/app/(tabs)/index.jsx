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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Wrench,
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
const API_URL = "http://10.60.194.60:5000";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Tinggi hero & tinggi lengkungan putih di bagian bawah hero
// (dibatasi agar tidak terlalu tinggi saat dibuka di browser/web)
const HERO_HEIGHT = Math.min(520, Math.max(380, Math.round(SCREEN_HEIGHT * 0.52)));

// Ganti dengan path gambar lokal kamu, contoh:
// const workshopBg = require("../assets/workshop-bg.png");
// lalu pakai <Image source={workshopBg} ... />
const WORKSHOP_BG = require("../../assets/workshop-bg.png");

export default function LandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [bengkels, setBengkels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  // Lebar hero yang sebenarnya (bukan lebar window), supaya lengkungan
  // tetap benar di web / layar dengan container lebih sempit dari window.
  const [heroWidth, setHeroWidth] = useState(SCREEN_WIDTH);
  const curveHeight = Math.min(90, Math.round(heroWidth * 0.17));

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

  // Dummy handler untuk login sosial (Google / Facebook).
  // Ganti isi fungsi ini dengan integrasi OAuth asli nanti
  // (misal expo-auth-session, firebase auth, dsb).
  const handleSocialLogin = (provider) => {
    Alert.alert(
      `Masuk dengan ${provider}`,
      `Ini masih tombol dummy untuk ${provider}. Integrasi OAuth belum terhubung ke backend.`,
      [{ text: "Oke" }],
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#18181b" />
        <Text style={styles.loadingText}>Memuat BengkelKu...</Text>
      </View>
    );
  }

  const bestBengkels = bengkels.slice(0, 3);
  const otherBengkels = bengkels.slice(3);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO SECTION: gambar + logo + nama aplikasi + tagline */}
        <View
          style={[
            styles.hero,
            { marginTop: insets.top + 8, paddingBottom: curveHeight },
          ]}
          onLayout={(e) => setHeroWidth(e.nativeEvent.layout.width)}
        >
          <Image
            source={WORKSHOP_BG}
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
              width: "100%",
            }}
          >
            <View style={styles.logoCircle}>
              <Wrench size={34} color="#18181b" />
            </View>
            <Text style={styles.brandName}>BENGKELKU</Text>
            <Text style={styles.brandTagline}>
              Platform Perawatan Otomotif Digital
            </Text>
          </Animated.View>

          {/* Lengkungan putih yang menyatu dengan area Welcome */}
          <View
            style={[
              styles.heroCurve,
              {
                left: -heroWidth / 2,
                top: HERO_HEIGHT - curveHeight,
                width: heroWidth * 2,
                height: heroWidth * 2,
                borderRadius: heroWidth,
              },
            ]}
          />
        </View>

        {/* WELCOME SECTION */}
        <Animated.View
          style={[
            styles.welcome,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={styles.heroTitle}>WELCOME</Text>

          <Text style={styles.heroSubtitle}>
            Booking servis kendaraan tanpa antre, bandingkan harga bengkel,
            dan pantau progres pengerjaan secara real-time.
          </Text>

          {/* AUTH BUTTONS: Login & Sign Up */}
          <View style={styles.heroButtons}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push("/Login")}
            >
              <Text style={styles.secondaryButtonText}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push("/Register")}
            >
              <Text style={styles.primaryButtonText}>Sign Up</Text>
              <ArrowRight size={16} color="#18181b" />
            </TouchableOpacity>
          </View>

          {/* DIVIDER */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>atau lanjutkan dengan</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* SOCIAL LOGIN (DUMMY) */}
          <View style={styles.socialRow}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialLogin("Google")}
            >
              <Image
                source={{
                  uri: "https://www.google.com/favicon.ico",
                }}
                style={styles.socialIcon}
              />
              <Text style={styles.socialButtonText}>Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialLogin("Facebook")}
            >
              <Text style={[styles.socialIconLetter, { color: "#1877F2" }]}>
                f
              </Text>
              <Text style={styles.socialButtonText}>Facebook</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* SECTION 1: BENGKEL POPULER */}
        {bestBengkels.length > 0 && (
          <View style={[styles.section, styles.sectionBorderTop]}>
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
                      <MapPin size={14} color="#52525b" />
                      <Text style={styles.bengkelInfoText}>
                        {bengkel.address}
                      </Text>
                    </View>
                    <View style={styles.bengkelInfoRow}>
                      <Phone size={14} color="#52525b" />
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
                      <Text
                        style={[
                          styles.bengkelButtonText,
                          !isPopular && styles.bengkelButtonTextDefault,
                        ]}
                      >
                        Booking di Sini
                      </Text>
                      <ChevronRight
                        size={14}
                        color={isPopular ? "#fff" : "#18181b"}
                      />
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
                    <MapPin size={13} color="#71717a" />
                    <Text style={styles.otherCardText}>
                      {bengkel.address}
                    </Text>
                  </View>
                  <View style={styles.bengkelInfoRow}>
                    <Phone size={13} color="#71717a" />
                    <Text style={styles.otherCardText}>{bengkel.phone}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.otherCardButton}
                    onPress={handleCtaClick}
                  >
                    <Text style={styles.otherCardButtonText}>
                      Pilih Bengkel Ini
                    </Text>
                    <ChevronRight size={14} color="#3f3f46" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerCopy}>
            © {new Date().getFullYear()} BENGKELKU. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingText: {
    color: "#71717a",
    fontWeight: "600",
    fontSize: 13,
  },
  scroll: {
    flex: 1,
  },

  // HERO
  hero: {
    height: HERO_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: "hidden",
    backgroundColor: "#27272a",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  // Lingkaran besar berwarna putih; hanya bagian atasnya yang terlihat
  // sehingga membentuk lengkungan halus di bawah gambar.
  heroCurve: {
    position: "absolute",
    backgroundColor: "#fff",
  },
  logoCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  brandName: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: 1,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  brandTagline: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },

  // WELCOME
  welcome: {
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 12,
    paddingBottom: 36,
    backgroundColor: "#fff",
  },
  heroTitle: {
    color: "#3f3f46",
    fontSize: SCREEN_WIDTH < 380 ? 34 : 40,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  heroSubtitle: {
    color: "#71717a",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
    maxWidth: 340,
  },
  heroButtons: {
    width: "100%",
    maxWidth: 300,
    gap: 12,
  },
  // Tombol Login (hitam, pill)
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#18181b",
    height: 52,
    borderRadius: 999,
  },
  secondaryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  // Tombol Sign Up (putih, border abu-abu, pill)
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d4d4d8",
    height: 52,
    borderRadius: 999,
  },
  primaryButtonText: {
    color: "#18181b",
    fontWeight: "600",
    fontSize: 15,
  },

  // DIVIDER ("atau lanjutkan dengan")
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    maxWidth: 300,
    marginTop: 28,
    marginBottom: 16,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e4e4e7",
  },
  dividerText: {
    color: "#a1a1aa",
    fontSize: 11,
    fontWeight: "600",
  },

  // SOCIAL LOGIN BUTTONS (DUMMY)
  socialRow: {
    flexDirection: "row",
    width: "100%",
    maxWidth: 300,
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    height: 46,
    borderRadius: 999,
  },
  socialIcon: {
    width: 16,
    height: 16,
  },
  socialIconLetter: {
    fontSize: 15,
    fontWeight: "900",
  },
  socialButtonText: {
    color: "#18181b",
    fontSize: 12,
    fontWeight: "600",
  },

  // SECTIONS
  section: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    backgroundColor: "#fff",
  },
  sectionBorderTop: {
    borderTopWidth: 1,
    borderTopColor: "#f4f4f5",
  },
  sectionHeader: {
    alignItems: "center",
    marginBottom: 28,
    gap: 6,
  },
  sectionEyebrow: {
    color: "#71717a",
    fontSize: 12,
    fontWeight: "600",
  },
  sectionTitle: {
    color: "#18181b",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  sectionSubtitle: {
    color: "#71717a",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },

  cardStack: {
    gap: 16,
  },

  // BENGKEL CARD (populer)
  bengkelCard: {
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 24,
    padding: 22,
  },
  bengkelCardPopular: {
    borderWidth: 2,
    borderColor: "#18181b",
    backgroundColor: "#fff",
  },
  popularBadge: {
    position: "absolute",
    top: -12,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#18181b",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  popularBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  bengkelName: {
    color: "#18181b",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 10,
  },
  bengkelInfoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 6,
  },
  bengkelInfoText: {
    color: "#71717a",
    fontSize: 12,
    flex: 1,
  },
  bengkelButton: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 48,
    borderRadius: 999,
  },
  bengkelButtonDefault: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d4d4d8",
  },
  bengkelButtonPopular: {
    backgroundColor: "#18181b",
  },
  bengkelButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  bengkelButtonTextDefault: {
    color: "#18181b",
  },

  // OTHER BENGKEL CARD
  otherCard: {
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 20,
    padding: 18,
  },
  otherCardName: {
    color: "#18181b",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
  },
  otherCardText: {
    color: "#71717a",
    fontSize: 12,
    flex: 1,
  },
  otherCardButton: {
    marginTop: 14,
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
  otherCardButtonText: {
    color: "#3f3f46",
    fontSize: 12,
    fontWeight: "600",
  },

  // FOOTER
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#f4f4f5",
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 12,
  },
  footerCopy: {
    color: "#a1a1aa",
    fontSize: 11,
  },
});