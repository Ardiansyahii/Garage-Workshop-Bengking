import React, { useState, useEffect, useRef } from "react";
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
  BackHandler,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Wrench, ArrowLeft, ArrowRight } from "lucide-react-native";

// Samakan dengan API_URL di RegisterScreen/LoginScreen kamu
const API_URL = Platform.select({
  web: "http://localhost:5000",
  android: "http://10.0.2.2:5000", // khusus Emulator Android
  default: "http://192.168.1.16:5000", // Ganti dengan IP Wi-Fi laptop kamu jika pakai HP Fisik (Expo Go)
});

// ====================================================================
// Sesuaikan dengan struktur app/(tabs) project bengkel-mobile kamu.
// ====================================================================
const ROUTES = {
  register: "/Register",
  login: "/Login",
};

export default function VerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams(); // pengganti useSearchParams() Next.js
  const [whatsapp, setWhatsapp] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const otpRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  const otp = otpDigits.join("");

  const handleOtpChange = (text, index) => {
    // Hanya izinkan 1 digit angka per kotak
    const digit = text.replace(/[^0-9]/g, "").slice(-1);

    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);

    // Auto-pindah ke kotak berikutnya kalau sudah diisi
    if (digit && index < 3) {
      otpRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyPress = (e, index) => {
    // Kalau backspace di kotak kosong, pindah fokus ke kotak sebelumnya
    if (e.nativeEvent.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  // ==========================================
  // TOMBOL BACK UNIVERSAL — dipakai floating
  // arrow di layar maupun hardware back Android
  // ==========================================
  const handleBackPress = () => {
    router.push(ROUTES.register);
    return true; // sudah ditangani, cegah default keluar app
  };

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress
    );

    return () => subscription.remove();
  }, []);

  // Fade-in animation (pengganti framer-motion / animasi masuk halaman)
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Ambil param "whatsapp" yang dikirim dari halaman Register
    // (router.push({ pathname: "/verify", params: { whatsapp } }))
    if (params?.whatsapp) {
      setWhatsapp(String(params.whatsapp));
    }

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
  }, [params?.whatsapp]);

  const handleVerify = async () => {
    if (!whatsapp || !otp) {
      Alert.alert("Data Belum Lengkap", "Nomor WhatsApp dan kode OTP wajib diisi.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsapp, otp }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        // Tampilkan notifikasi singkat (tidak menghalangi navigasi)
        Alert.alert("Verifikasi Berhasil!", "Akun kamu sudah aktif, silakan login.");

        // Auto redirect ke halaman login begitu OTP terverifikasi
        router.replace(ROUTES.login);
      } else {
        Alert.alert("Gagal Verifikasi", data.message || "Kode OTP salah.");
        setOtpDigits(["", "", "", ""]);
        otpRefs[0].current?.focus();
      }
    } catch (error) {
      console.error("Verify Error:", error);
      Alert.alert(
        "Kesalahan Jaringan",
        "Tidak dapat terhubung ke server. Pastikan backend berjalan."
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
          source={{ uri: "https://via.placeholder.com/800x1200" }} // Ganti dengan asset banner-bg kamu
          style={styles.bg}
          imageStyle={{ opacity: 0.25 }}
        >
          <View style={styles.overlay} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Spacer biar konten tidak tertutup floating back button */}
            <View style={styles.topSpacer} />

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
              <Text style={styles.heroTitle}>Verifikasi WhatsApp.</Text>
              <Text style={styles.heroSubtitle}>
                Masukkan 4 digit kode OTP yang telah dikirimkan ke nomor
                WhatsApp kamu.
              </Text>
            </Animated.View>

            {/* FORM CARD */}
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Masukkan Kode OTP</Text>
              <Text style={styles.formSubtitle}>
                Cek pesan masuk WhatsApp dari Fonnte.
              </Text>

              {/* NOMOR WHATSAPP */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>NOMOR WHATSAPP</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Cth: 081234567890"
                    placeholderTextColor="#52525b"
                    keyboardType="phone-pad"
                    value={whatsapp}
                    onChangeText={setWhatsapp}
                  />
                </View>
              </View>

              {/* KODE OTP - 4 kotak terpisah */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>KODE OTP (4 DIGIT)</Text>
                <View style={styles.otpBoxRow}>
                  {otpDigits.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={otpRefs[index]}
                      style={[
                        styles.otpBox,
                        digit ? styles.otpBoxFilled : null,
                      ]}
                      keyboardType="number-pad"
                      maxLength={1}
                      value={digit}
                      onChangeText={(text) => handleOtpChange(text, index)}
                      onKeyPress={(e) => handleOtpKeyPress(e, index)}
                      textAlign="center"
                    />
                  ))}
                </View>
              </View>

              {/* TOMBOL VERIFIKASI */}
              <TouchableOpacity
                style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
                onPress={handleVerify}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.submitBtnText}>Memverifikasi...</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.submitBtnText}>Verifikasi Akun</Text>
                    <ArrowRight size={16} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.footerText}>
              © {new Date().getFullYear()} BENGKELKU. All rights reserved.
            </Text>
          </ScrollView>

          {/* FLOATING ARROW BACK — selalu tampil, aman dari notch/status bar
              di semua device (iOS, Android, web). Hardware back Android
              juga dipetakan ke fungsi yang sama lewat handleBackPress(). */}
          <TouchableOpacity
            style={styles.floatingBackBtn}
            onPress={handleBackPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </TouchableOpacity>
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

  // FLOATING ARROW BACK (fixed, tidak ikut scroll, aman di semua device)
  floatingBackBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 20,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(24, 24, 27, 0.85)",
    borderWidth: 1,
    borderColor: "#27272a",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 50,
    elevation: 6, // shadow Android
    shadowColor: "#000", // shadow iOS
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  topSpacer: {
    height: 44, // ruang kosong biar konten tidak tertutup floating back button
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
  formCard: {
    backgroundColor: "rgba(9, 9, 11, 0.85)",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 24,
    padding: 22,
    overflow: "hidden", // cegah konten anak (mis. otpBoxRow) bocor keluar kartu di web
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
  otpBoxRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    minWidth: 0, // penting di web: cegah row melebar melebihi induknya
  },
  otpBox: {
    flex: 1,
    minWidth: 0, // penting di web: flex:1 pada <input> butuh ini agar bisa menyusut
    height: 56,
    backgroundColor: "rgba(24, 24, 27, 0.6)",
    borderWidth: 1.5,
    borderColor: "#27272a",
    borderRadius: 12,
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },
  otpBoxFilled: {
    borderColor: "#dc2626",
    backgroundColor: "rgba(220, 38, 38, 0.08)",
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
  footerText: {
    color: "#52525b",
    fontSize: 10,
    textAlign: "center",
    marginTop: 24,
  },
});