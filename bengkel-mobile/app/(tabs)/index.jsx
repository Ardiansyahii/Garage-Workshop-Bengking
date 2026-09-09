import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInUp } from "react-native-reanimated";
import {
  Wrench,
  ArrowRight,
  Star,
  ChevronRight,
  MapPin,
  Phone,
} from "lucide-react-native";

import API_URL from "../../config/api";
import { getUser } from "../../lib/storage";
import { ROUTES } from "../../lib/api";
import Colors from "../../constants/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const WORKSHOP_BG = require("../../assets/workshop-bg.png");

export default function LandingScreen() {
  const router = useRouter();
  const [bengkels, setBengkels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    fetch(`${API_URL}/api/bengkels`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Gagal memuat data");
        return res.json();
      })
      .then((data) => {
        if (data.success) setBengkels(data.data || []);
        setIsLoading(false);
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error("Error memuat data:", error);
        }
        setIsLoading(false);
      })
      .finally(() => clearTimeout(timeoutId));

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, []);

  const handleCtaClick = async () => {
    const user = await getUser();

    if (user) {
      router.push(ROUTES.dashboard);
    } else {
      Alert.alert(
        "Autentikasi Diperlukan",
        "Silakan masuk atau daftar akun terlebih dahulu.",
        [
          { text: "Nanti Saja", style: "cancel" },
          { text: "Masuk / Daftar", onPress: () => router.push(ROUTES.login) },
        ],
      );
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Memuat BengkelKu...</Text>
      </View>
    );
  }

  const bestBengkels = bengkels.slice(0, 3);
  const otherBengkels = bengkels.slice(3);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logoBox}>
            <Wrench size={16} color="#fff" />
          </View>
          <Text style={styles.logoText}>
            BENGKEL<Text style={{ color: Colors.primary }}>KU</Text>
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Animated.Image
            entering={FadeInUp.duration(800)}
            source={WORKSHOP_BG}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />

          <Animated.View
            entering={FadeInUp.duration(600).delay(200)}
            style={styles.heroContent}
          >
            <View style={styles.badge}>
              <View style={styles.badgeDot} />
              <Text style={styles.badgeText}>Platform Perawatan Otomotif Digital</Text>
            </View>

            <Text style={styles.heroTitle}>
              PRESISI TINGGI UNTUK{" "}
              <Text style={{ color: Colors.primary }}>KENDARAAN ANDA</Text>.
            </Text>

            <Text style={styles.heroSubtitle}>
              Booking servis kendaraan tanpa antre, bandingkan harga bengkel,
              dan pantau progres pengerjaan secara real-time.
            </Text>

            <View style={styles.heroButtons}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.push(ROUTES.register)}
              >
                <Text style={styles.primaryButtonText}>Daftar</Text>
                <ArrowRight size={16} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => router.push(ROUTES.login)}
              >
                <Text style={styles.secondaryButtonText}>Masuk</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>

        {bestBengkels.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEyebrow}>Mitra Unggulan</Text>
              <Text style={styles.sectionTitle}>Bengkel Rekomendasi Kami</Text>
              <Text style={styles.sectionSubtitle}>
                Dipercaya ratusan pelanggan dengan mekanik profesional tersertifikasi.
              </Text>
            </View>

            <View style={styles.cardStack}>
              {bestBengkels.map((bengkel, index) => {
                const isPopular = index === 1;
                return (
                  <View
                    key={bengkel.id}
                    style={[styles.bengkelCard, isPopular && styles.bengkelCardPopular]}
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
                      <Text style={styles.bengkelInfoText}>{bengkel.address}</Text>
                    </View>
                    <View style={styles.bengkelInfoRow}>
                      <Phone size={14} color="#ef4444" />
                      <Text style={styles.bengkelInfoText}>{bengkel.phone}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.bengkelButton, isPopular ? styles.bengkelButtonPopular : styles.bengkelButtonDefault]}
                      onPress={handleCtaClick}
                    >
                      <Text style={styles.bengkelButtonText}>Booking di Sini</Text>
                      <ChevronRight size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {otherBengkels.length > 0 && (
          <View style={[styles.section, styles.sectionBorderTop]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Katalog Mitra Bengkel</Text>
              <Text style={styles.sectionSubtitle}>Temukan bengkel terdekat di wilayahmu.</Text>
            </View>
            <View style={styles.cardStack}>
              {otherBengkels.map((bengkel) => (
                <View key={bengkel.id} style={styles.otherCard}>
                  <Text style={styles.otherCardName}>{bengkel.name}</Text>
                  <View style={styles.bengkelInfoRow}>
                    <MapPin size={13} color="#a1a1aa" />
                    <Text style={styles.otherCardText}>{bengkel.address}</Text>
                  </View>
                  <View style={styles.bengkelInfoRow}>
                    <Phone size={13} color="#a1a1aa" />
                    <Text style={styles.otherCardText}>{bengkel.phone}</Text>
                  </View>
                  <TouchableOpacity style={styles.otherCardButton} onPress={handleCtaClick}>
                    <Text style={styles.otherCardButtonText}>Pilih Bengkel Ini</Text>
                    <ChevronRight size={14} color="#d4d4d8" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerCopy}>© {new Date().getFullYear()} BENGKELKU. All rights reserved.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  loadingContainer: { flex: 1, backgroundColor: "#000", alignItems: "center", justifyContent: "center", gap: 16 },
  loadingText: { color: "#71717a", fontWeight: "700", fontSize: 13 },
  scroll: { flex: 1 },
  header: {
    height: 64, paddingHorizontal: 20, flexDirection: "row",
    alignItems: "center", justifyContent: "flex-start",
    backgroundColor: "rgba(0,0,0,0.9)", borderBottomWidth: 1, borderBottomColor: "#18181b",
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoBox: { width: 30, height: 30, borderRadius: 8, backgroundColor: "#dc2626", alignItems: "center", justifyContent: "center" },
  logoText: { color: "#fff", fontWeight: "900", fontSize: 15, letterSpacing: 1 },
  hero: { minHeight: 560, alignItems: "center", justifyContent: "center", paddingTop: 60, paddingBottom: 60, overflow: "hidden" },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
  heroContent: { alignItems: "center", paddingHorizontal: 24, width: "100%" },
  badge: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(24,24,27,0.8)", borderWidth: 1, borderColor: "#27272a",
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, marginBottom: 20,
  },
  badgeDot: { width: 7, height: 7, borderRadius: 999, backgroundColor: "#dc2626" },
  badgeText: { color: "#d4d4d8", fontSize: 11, fontWeight: "600" },
  heroTitle: { color: "#fff", fontSize: SCREEN_WIDTH < 380 ? 32 : 38, fontWeight: "900", textAlign: "center", lineHeight: SCREEN_WIDTH < 380 ? 38 : 44, marginBottom: 16 },
  heroSubtitle: { color: "#d4d4d8", fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 28, maxWidth: 440 },
  heroButtons: { width: "100%", gap: 12 },
  primaryButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#dc2626", paddingVertical: 16, borderRadius: 14 },
  primaryButtonText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  secondaryButton: { alignItems: "center", justifyContent: "center", backgroundColor: "rgba(39,39,42,0.8)", borderWidth: 1, borderColor: "#52525b", paddingVertical: 16, borderRadius: 14 },
  secondaryButtonText: { color: "#e4e4e7", fontWeight: "800", fontSize: 13 },
  section: { paddingHorizontal: 20, paddingVertical: 40 },
  sectionBorderTop: { borderTopWidth: 1, borderTopColor: "rgba(39,39,42,0.8)" },
  sectionHeader: { alignItems: "center", marginBottom: 28, gap: 6 },
  sectionEyebrow: { color: "#dc2626", fontSize: 11, fontWeight: "900", letterSpacing: 1.5, textTransform: "uppercase" },
  sectionTitle: { color: "#fff", fontSize: 22, fontWeight: "900", textAlign: "center" },
  sectionSubtitle: { color: "#a1a1aa", fontSize: 12, textAlign: "center" },
  cardStack: { gap: 16 },
  bengkelCard: { backgroundColor: "rgba(9,9,11,0.8)", borderWidth: 1, borderColor: "#18181b", borderRadius: 20, padding: 22 },
  bengkelCardPopular: { borderWidth: 2, borderColor: "#dc2626", backgroundColor: "#0a0a0a" },
  popularBadge: { position: "absolute", top: -12, right: 20, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#dc2626", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  popularBadgeText: { color: "#fff", fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  bengkelName: { color: "#fff", fontSize: 18, fontWeight: "900", marginBottom: 10 },
  bengkelInfoRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 6 },
  bengkelInfoText: { color: "#a1a1aa", fontSize: 12, flex: 1 },
  bengkelButton: { marginTop: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderRadius: 12 },
  bengkelButtonDefault: { backgroundColor: "#18181b", borderWidth: 1, borderColor: "#27272a" },
  bengkelButtonPopular: { backgroundColor: "#dc2626" },
  bengkelButtonText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  otherCard: { backgroundColor: "rgba(9,9,11,0.6)", borderWidth: 1, borderColor: "#18181b", borderRadius: 16, padding: 18 },
  otherCardName: { color: "#fff", fontSize: 15, fontWeight: "800", marginBottom: 8 },
  otherCardText: { color: "#a1a1aa", fontSize: 12, flex: 1 },
  otherCardButton: { marginTop: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#18181b", borderWidth: 1, borderColor: "#27272a", paddingVertical: 11, borderRadius: 12 },
  otherCardButtonText: { color: "#d4d4d8", fontSize: 12, fontWeight: "700" },
  footer: { borderTopWidth: 1, borderTopColor: "#18181b", paddingVertical: 24, paddingHorizontal: 20, alignItems: "center" },
  footerCopy: { color: "#71717a", fontSize: 11 },
});
