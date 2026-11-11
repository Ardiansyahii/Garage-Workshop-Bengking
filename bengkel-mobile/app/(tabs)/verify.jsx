import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Animated,
  BackHandler,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  Wrench,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Phone,
} from "lucide-react-native";

// Samakan dengan API_URL di RegisterScreen/LoginScreen kamu
const API_URL = Platform.select({
  web:"http://localhost:5000",
  android:"http://10.51.2.60:5000", // khusus Emulator Android
  default:"http://10.60.194.60:5000", // Ganti dengan IP Wi-Fi laptop kamu jika pakai HP Fisik (Expo Go)
});

// ====================================================================
// Sesuaikan dengan struktur app/(tabs) project bengkel-mobile kamu.
// ====================================================================
const ROUTES = {
  register: "/Register",
  login: "/Login",
};

const MAX_CONTENT_WIDTH = 440;

export default function VerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams(); // pengganti useSearchParams() Next.js
  const [whatsapp, setWhatsapp] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const otpRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  // State tambahan khusus UI (efek fokus)
  const [focusedOtp, setFocusedOtp] = useState(null);
  const [whatsappFocused, setWhatsappFocused] = useState(false);

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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.bg}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
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
                <Wrench size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.logoText}>BENGKELKU</Text>
            </Animated.View>

            {/* JUDUL */}
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: translateAnim }],
                alignItems: "center",
              }}
            >
              <View style={styles.verifyCircle}>
                <ShieldCheck size={36} color="#18181b" />
              </View>
              <Text style={styles.heroTitle}>Verify Your Account</Text>
              <Text style={styles.heroSubtitle}>
                Kami telah mengirimkan kode verifikasi ke nomor WhatsApp Anda.
                Silakan periksa pesan masuk dan masukkan 4 digit kode untuk
                melanjutkan.
              </Text>
            </Animated.View>

            {/* FORM */}
            <View style={styles.formCard}>
              {/* NOMOR WHATSAPP */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nomor WhatsApp</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    whatsappFocused && styles.inputWrapperFocused,
                  ]}
                >
                  <Phone
                    size={18}
                    color={whatsappFocused ? "#18181b" : "#a1a1aa"}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Cth: 081234567890"
                    placeholderTextColor="#a1a1aa"
                    keyboardType="phone-pad"
                    value={whatsapp}
                    onChangeText={setWhatsapp}
                    onFocus={() => setWhatsappFocused(true)}
                    onBlur={() => setWhatsappFocused(false)}
                  />
                </View>
              </View>

              {/* KODE OTP - 4 kotak terpisah */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { textAlign: "center" }]}>
                  Kode OTP (4 digit)
                </Text>
                <View style={styles.otpBoxRow}>
                  {otpDigits.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={otpRefs[index]}
                      style={[
                        styles.otpBox,
                        digit ? styles.otpBoxFilled : null,
                        focusedOtp === index ? styles.otpBoxFocused : null,
                      ]}
                      keyboardType="number-pad"
                      maxLength={1}
                      value={digit}
                      onChangeText={(text) => handleOtpChange(text, index)}
                      onKeyPress={(e) => handleOtpKeyPress(e, index)}
                      onFocus={() => setFocusedOtp(index)}
                      onBlur={() =>
                        setFocusedOtp((prev) => (prev === index ? null : prev))
                      }
                      textAlign="center"
                    />
                  ))}
                </View>
                <Text style={styles.formSubtitle}>
                  Cek pesan masuk WhatsApp dari Fonnte.
                </Text>
              </View>

              {/* TOMBOL VERIFIKASI */}
              <TouchableOpacity
                style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
                activeOpacity={0.85}
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
                    <Text style={styles.submitBtnText}>Verify Account</Text>
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
          <View style={styles.floatingBackWrap} pointerEvents="box-none">
            <View style={styles.floatingBackInner} pointerEvents="box-none">
              <TouchableOpacity
                style={styles.floatingBackBtn}
                activeOpacity={0.7}
                onPress={handleBackPress}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <ArrowLeft size={20} color="#18181b" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const webNoOutline = Platform.select({
  web: { outlineStyle: "none" },
  default: {},
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  bg: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  // Konten dipusatkan & dibatasi lebarnya agar rapi di web / tablet
  scrollContent: {
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: "center",
    padding: 24,
    paddingBottom: 40,
  },

  // FLOATING ARROW BACK (fixed, tidak ikut scroll, aman di semua device)
  floatingBackWrap: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 20,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 50,
  },
  floatingBackInner: {
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
    paddingHorizontal: 24,
    alignItems: "flex-start",
  },
  floatingBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2, // shadow Android
    shadowColor: "#000", // shadow iOS
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  topSpacer: {
    height: 32, // ruang kosong biar konten tidak tertutup floating back button
  },

  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
  },
  logoIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#18181b",
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    color: "#18181b",
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 1.5,
  },
  verifyCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#f4f4f5",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 22,
  },
  heroTitle: {
    color: "#3f3f46",
    fontSize: 30,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 10,
  },
  heroSubtitle: {
    color: "#71717a",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 28,
    maxWidth: 340,
  },
  formCard: {
    backgroundColor: "transparent",
    overflow: "hidden", // cegah konten anak (mis. otpBoxRow) bocor keluar di web
  },
  formTitle: {
    color: "#18181b",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
  },
  formSubtitle: {
    color: "#a1a1aa",
    fontSize: 12,
    textAlign: "center",
    marginTop: 12,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: "#3f3f46",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f4f4f5",
    borderWidth: 1.5,
    borderColor: "transparent",
    borderRadius: 16,
    paddingHorizontal: 16,
    minHeight: 54,
  },
  inputWrapperFocused: {
    backgroundColor: "#FFFFFF",
    borderColor: "#18181b",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: "#18181b",
    fontSize: 14,
    paddingVertical: 14,
    ...webNoOutline,
  },
  otpBoxRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    minWidth: 0, // penting di web: cegah row melebar melebihi induknya
  },
  otpBox: {
    flex: 1,
    minWidth: 0, // penting di web: flex:1 pada <input> butuh ini agar bisa menyusut
    height: 60,
    backgroundColor: "#f4f4f5",
    borderWidth: 1.5,
    borderColor: "transparent",
    borderRadius: 16,
    color: "#18181b",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    ...webNoOutline,
  },
  otpBoxFilled: {
    backgroundColor: "#FFFFFF",
    borderColor: "#d4d4d8",
  },
  otpBoxFocused: {
    backgroundColor: "#FFFFFF",
    borderColor: "#18181b",
  },
  submitBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#18181b",
    height: 54,
    borderRadius: 999,
    marginTop: 6,
  },
  submitBtnDisabled: {
    backgroundColor: "#a1a1aa",
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },
  footerText: {
    color: "#a1a1aa",
    fontSize: 10,
    textAlign: "center",
    marginTop: 24,
  },
});