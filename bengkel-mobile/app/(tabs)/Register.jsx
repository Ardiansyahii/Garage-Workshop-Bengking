import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Alert,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Wrench,
  User,
  Phone,
  Lock,
  ArrowLeft,
  ArrowRight,
  Car,
  Bell,
  ShieldCheck,
} from "lucide-react-native";

// Configure URL API dynamically based on environment
const API_URL = Platform.select({
  web: "http://localhost:5000",
  android: "http://10.0.2.2:5000", // khusus Emulator Android
  default: "http://192.168.1.16:5000", // Ganti dengan IP Wi-Fi laptop kamu jika pakai HP Fisik (Expo Go)
});

const ROUTES = {
  home: "/",
  login: "/Login",
  verify: "/verify",
};

export default function RegisterScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    whatsapp: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Fade-in animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
  };

  const handleRegister = async () => {
    if (!formData.name || !formData.whatsapp || !formData.password) {
      Alert.alert("Data Belum Lengkap", "Mohon isi semua kolom terlebih dahulu.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.whatsapp,
          whatsapp: formData.whatsapp,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Tampilkan notifikasi singkat (tidak menghalangi navigasi)
        Alert.alert(
          "Registrasi Berhasil!",
          data.message || "Kode OTP verifikasi telah dikirim ke nomor WhatsApp kamu."
        );

        // Auto redirect ke halaman verifikasi OTP begitu registrasi sukses
        router.push({
          pathname: ROUTES.verify,
          params: { whatsapp: formData.whatsapp },
        });
      } else {
        Alert.alert("Gagal Mendaftar", data.message || "Terjadi kesalahan pada sistem.");
      }
    } catch (error) {
      console.error("Register Error:", error);
      Alert.alert(
        "Kesalahan Jaringan",
        `Gagal terhubung ke server. Pastikan backend berjalan di port 5000.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ImageBackground
          source={{ uri: "https://via.placeholder.com/800x1200" }}
          style={styles.bg}
          imageStyle={{ opacity: 0.25 }}
        >
          <View style={styles.overlay} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* TOMBOL KEMBALI */}
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.push(ROUTES.home)}
            >
              <ArrowLeft size={14} color="#a1a1aa" />
              <Text style={styles.backBtnText}>Kembali ke Beranda</Text>
            </TouchableOpacity>

            {/* HEADER LOGO */}
            <Animated.View
              style={[
                styles.logoRow,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: translateAnim }],
                },
              ]}
            >
              <View style={styles.logoIcon}>
                <Wrench size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.logoText}>
                BENGKEL<Text style={{ color: "#dc2626" }}>KU</Text>
              </Text>
            </Animated.View>

            {/* JUDUL */}
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: translateAnim }],
              }}
            >
              <Text style={styles.heroTitle}>
                Perawatan Mobil Kini Lebih{" "}
                <Text style={{ color: "#ef4444" }}>Mudah.</Text>
              </Text>
              <Text style={styles.heroSubtitle}>
                Daftarkan diri Anda untuk menikmati kemudahan reservasi servis
                kendaraan tanpa perlu antre panjang di bengkel.
              </Text>
            </Animated.View>

            {/* LIST FITUR PELANGGAN */}
            <View style={styles.featureList}>
              <View style={styles.featureRow}>
                <View style={styles.featureIconBox}>
                  <Car size={16} color="#ef4444" />
                </View>
                <View style={styles.featureTextBox}>
                  <Text style={styles.featureTitle}>Manajemen Kendaraan</Text>
                  <Text style={styles.featureDesc}>
                    Simpan data mobil Anda untuk proses booking servis yang
                    lebih instan.
                  </Text>
                </View>
              </View>

              <View style={styles.featureRow}>
                <View style={styles.featureIconBox}>
                  <Bell size={16} color="#ef4444" />
                </View>
                <View style={styles.featureTextBox}>
                  <Text style={styles.featureTitle}>Notifikasi WhatsApp</Text>
                  <Text style={styles.featureDesc}>
                    Dapatkan pembaruan status pengerjaan mobil Anda langsung
                    ke HP.
                  </Text>
                </View>
              </View>

              <View style={styles.featureRow}>
                <View style={styles.featureIconBox}>
                  <ShieldCheck size={16} color="#ef4444" />
                </View>
                <View style={styles.featureTextBox}>
                  <Text style={styles.featureTitle}>Riwayat Terpercaya</Text>
                  <Text style={styles.featureDesc}>
                    Pantau riwayat servis kendaraan Anda kapan saja dengan
                    aman.
                  </Text>
                </View>
              </View>
            </View>

            {/* FORM CARD */}
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Buat Akun Pelanggan</Text>
              <Text style={styles.formSubtitle}>
                Lengkapi identitas diri untuk mulai menggunakan layanan.
              </Text>

              {/* NAMA */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>NAMA LENGKAP</Text>
                <View style={styles.inputWrapper}>
                  <User size={16} color="#71717a" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Cth: Ardi Pratama"
                    placeholderTextColor="#52525b"
                    value={formData.name}
                    onChangeText={(v) => handleChange("name", v)}
                  />
                </View>
              </View>

              {/* WHATSAPP */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>NOMOR WHATSAPP AKTIF</Text>
                <View style={styles.inputWrapper}>
                  <Phone size={16} color="#71717a" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Cth: 081234567890"
                    placeholderTextColor="#52525b"
                    keyboardType="phone-pad"
                    value={formData.whatsapp}
                    onChangeText={(v) => handleChange("whatsapp", v)}
                  />
                </View>
              </View>

              {/* PASSWORD */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>PASSWORD</Text>
                <View style={styles.inputWrapper}>
                  <Lock size={16} color="#71717a" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#52525b"
                    secureTextEntry
                    value={formData.password}
                    onChangeText={(v) => handleChange("password", v)}
                  />
                </View>
              </View>

              {/* TOMBOL DAFTAR */}
              <TouchableOpacity
                style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
                onPress={handleRegister}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.submitBtnText}>Memproses Data...</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.submitBtnText}>Daftar Sekarang</Text>
                    <ArrowRight size={16} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>

              {/* LINK LOGIN */}
              <View style={styles.loginRow}>
                <Text style={styles.loginText}>Sudah punya akun? </Text>
                <TouchableOpacity onPress={() => router.push(ROUTES.login)}>
                  <Text style={styles.loginLink}>Masuk di sini</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.footerText}>
              © {new Date().getFullYear()} BENGKELKU. All rights reserved.
            </Text>
          </ScrollView>
        </ImageBackground>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  bg: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
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
    marginBottom: 24,
  },
  backBtnText: {
    color: "#a1a1aa",
    fontSize: 12,
    fontWeight: "600",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#dc2626",
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 20,
    letterSpacing: 1,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "900",
    lineHeight: 32,
    marginBottom: 10,
  },
  heroSubtitle: {
    color: "#a1a1aa",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 24,
  },
  featureList: {
    gap: 14,
    marginBottom: 28,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  featureIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
    justifyContent: "center",
    alignItems: "center",
  },
  featureTextBox: {
    flex: 1,
  },
  featureTitle: {
    color: "#e4e4e7",
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 2,
  },
  featureDesc: {
    color: "#71717a",
    fontSize: 11,
    lineHeight: 16,
  },
  formCard: {
    backgroundColor: "rgba(9, 9, 11, 0.85)",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 24,
    padding: 22,
  },
  formTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 4,
  },
  formSubtitle: {
    color: "#a1a1aa",
    fontSize: 12,
    marginBottom: 22,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: "#a1a1aa",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(24, 24, 27, 0.6)",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 13,
    paddingVertical: 14,
  },
  submitBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#dc2626",
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 6,
  },
  submitBtnDisabled: {
    backgroundColor: "#27272a",
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: "#27272a",
  },
  loginText: {
    color: "#a1a1aa",
    fontSize: 12,
  },
  loginLink: {
    color: "#ef4444",
    fontWeight: "bold",
    fontSize: 12,
    textDecorationLine: "underline",
  },
  footerText: {
    color: "#52525b",
    fontSize: 10,
    textAlign: "center",
    marginTop: 24,
  },
});