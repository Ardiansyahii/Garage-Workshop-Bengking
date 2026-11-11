import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Platform,
  Image,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  Wrench,
  Phone,
  Lock,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react-native";

const { width } = Dimensions.get("window");

// Samakan dengan API_URL di RegisterScreen/VerifyScreen kamu
const API_URL = Platform.select({
  web:"http://localhost:5000",
  android:"http://10.12.5.158:5000", // IP Wi-Fi laptop untuk Expo Go/perangkat Android
  default:"http://10.60.194.60:5000",
});

// ====================================================================
// Sesuaikan dengan struktur app/(tabs) project bengkel-mobile kamu.
// Yang sudah ada: home ("/"), login ("/Login"), register ("/Register")
// Yang BELUM ada file-nya (route masih perkiraan, buat dulu filenya):
//   - registerMitra, dashboard, superAdminDashboard, adminDashboard
//   - forgotPassword ("/ForgotPassword") -> lihat ForgotPasswordScreen.tsx
// ====================================================================
const ROUTES = {
  home: "/",
  register: "/Register",
  registerMitra: "/register-mitra",
  forgotPassword: "/ForgotPassword",
  superAdminDashboard: "/dashboard/superadmin",
  adminDashboard: "/dashboard/admin",
  dashboard: "/dashboard",
};

export default function LoginScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    whatsapp: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  // State tambahan khusus UI (tidak memengaruhi logika login)
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleLogin = async () => {
    if (!formData.whatsapp || !formData.password) {
      Alert.alert("Perhatian", "Nomor WhatsApp dan Password wajib diisi.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        // 1. Simpan sesi ke AsyncStorage
        await AsyncStorage.setItem("user", JSON.stringify(data.user));
        await AsyncStorage.setItem("user_session", JSON.stringify(data.user));
        await AsyncStorage.setItem("auth_token", data.token);

        Alert.alert("Akses Diberikan", data.message || "Berhasil masuk!");

        // 2. Arahkan ke screen yang TEPAT berdasarkan Role (auto redirect)
        if (data.role === "superadmin") {
          router.replace(ROUTES.superAdminDashboard);
        } else if (data.role === "admin_bengkel") {
          router.replace(ROUTES.adminDashboard);
        } else if (data.role === "pelanggan") {
          router.replace(ROUTES.dashboard);
        } else {
          router.replace(ROUTES.home);
        }
      } else {
        Alert.alert("Otentikasi Gagal", data.message || "Kredensial tidak valid.");
      }
    } catch (error) {
      console.log(error);
      Alert.alert(
        "Kesalahan Jaringan",
        "Gagal terhubung ke server backend."
      );
    } finally {
      setIsLoading(false);
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {/* HEADER / BACK BUTTON */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.7}
            onPress={() => router.back()}
          >
            <ArrowLeft size={14} color="#52525b" />
            <Text style={styles.backBtnText}>Kembali ke Beranda</Text>
          </TouchableOpacity>
        </View>

        {/* SECTION INFORMASI */}
        <View style={styles.infoSection}>
          <View style={styles.brandRow}>
            <View style={styles.brandIcon}>
              <Wrench size={26} color="#FFFFFF" />
            </View>
            <Text style={styles.brandText}>BENGKELKU</Text>
          </View>

          <Text style={styles.heroTitle}>Welcome Back!</Text>

          <Text style={styles.heroSubtitle}>
            Masuk untuk mengelola servis kendaraan dan operasional bengkel
            Anda dengan mudah.
          </Text>
        </View>

        {/* FORM LOGIN */}
        <View style={styles.formCard}>
          {/* INPUT WHATSAPP */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nomor WhatsApp</Text>
            <View
              style={[
                styles.inputWrapper,
                focusedField === "whatsapp" && styles.inputWrapperFocused,
              ]}
            >
              <Phone
                size={18}
                color={focusedField === "whatsapp" ? "#18181b" : "#a1a1aa"}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                placeholder="Cth: 081234567890"
                placeholderTextColor="#a1a1aa"
                keyboardType="phone-pad"
                value={formData.whatsapp}
                onChangeText={(val) => handleChange("whatsapp", val)}
                onFocus={() => setFocusedField("whatsapp")}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          </View>

          {/* INPUT PASSWORD */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View
              style={[
                styles.inputWrapper,
                focusedField === "password" && styles.inputWrapperFocused,
              ]}
            >
              <Lock
                size={18}
                color={focusedField === "password" ? "#18181b" : "#a1a1aa"}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                placeholder="Masukkan password"
                placeholderTextColor="#a1a1aa"
                secureTextEntry={!showPassword}
                value={formData.password}
                onChangeText={(val) => handleChange("password", val)}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel={
                  showPassword ? "Sembunyikan password" : "Tampilkan password"
                }
              >
                {showPassword ? (
                  <EyeOff size={18} color="#71717a" />
                ) : (
                  <Eye size={18} color="#71717a" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* LUPA KATA SANDI */}
          <TouchableOpacity
            style={styles.forgotPasswordLink}
            onPress={() => router.push(ROUTES.forgotPassword)}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Text style={styles.forgotPasswordText}>Lupa kata sandi?</Text>
          </TouchableOpacity>

          {/* BUTTON SUBMIT */}
          <TouchableOpacity
            style={[styles.submitBtn, isLoading && styles.disabledBtn]}
            activeOpacity={0.85}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.submitBtnText}>Mengautentikasi...</Text>
              </View>
            ) : (
              <View style={styles.loadingRow}>
                <Text style={styles.submitBtnText}>Login</Text>
                <ArrowRight size={16} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>

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
              activeOpacity={0.7}
              onPress={() => handleSocialLogin("Google")}
            >
              <Image
                source={{ uri: "https://www.google.com/favicon.ico" }}
                style={styles.socialIcon}
              />
              <Text style={styles.socialButtonText}>Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              activeOpacity={0.7}
              onPress={() => handleSocialLogin("Facebook")}
            >
              <Text style={[styles.socialIconLetter, { color: "#1877F2" }]}>
                f
              </Text>
              <Text style={styles.socialButtonText}>Facebook</Text>
            </TouchableOpacity>
          </View>

          {/* FOOTER LINKS */}
          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.linkContainer}
            onPress={() => router.push(ROUTES.register)}
          >
            <Text style={styles.linkText}>
              Belum punya akun?{" "}
              <Text style={styles.highlightText}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* COPYRIGHT */}
        <Text style={styles.copyrightText}>
          © {new Date().getFullYear()} BENGKELKU. System Access.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  // Konten dibatasi lebarnya supaya tetap rapi di web / tablet
  scrollContent: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingBottom: 40,
    flexGrow: 1,
  },
  header: {
    paddingVertical: 16,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: "#e4e4e7",
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    alignSelf: "flex-start",
    gap: 6,
  },
  backBtnText: {
    color: "#52525b",
    fontSize: 12,
    fontWeight: "600",
  },
  infoSection: {
    alignItems: "center",
    marginTop: 12,
    marginBottom: 28,
  },
  brandRow: {
    alignItems: "center",
    gap: 10,
    marginBottom: 24,
  },
  brandIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#18181b",
    justifyContent: "center",
    alignItems: "center",
  },
  brandText: {
    color: "#18181b",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  heroTitle: {
    color: "#3f3f46",
    fontSize: width < 380 ? 30 : 34,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 10,
  },
  heroSubtitle: {
    color: "#71717a",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 320,
  },
  formCard: {
    backgroundColor: "transparent",
    marginVertical: 4,
  },
  formTitle: {
    color: "#18181b",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
  },
  formSubtitle: {
    color: "#71717a",
    fontSize: 12,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
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
  textInput: {
    flex: 1,
    color: "#18181b",
    fontSize: 14,
    paddingVertical: 14,
    // Hilangkan outline default browser saat di web
    ...Platform.select({ web: { outlineStyle: "none" }, default: {} }),
  },
  forgotPasswordLink: {
    alignSelf: "flex-end",
    marginTop: -4,
    marginBottom: 22,
  },
  forgotPasswordText: {
    color: "#3f3f46",
    fontSize: 12,
    fontWeight: "600",
  },
  submitBtn: {
    backgroundColor: "#18181b",
    height: 54,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledBtn: {
    backgroundColor: "#a1a1aa",
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  // DIVIDER ("atau lanjutkan dengan")
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginTop: 24,
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
    height: 48,
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

  divider: {
    height: 1,
    backgroundColor: "#f4f4f5",
    marginVertical: 22,
  },
  linkContainer: {
    alignItems: "center",
  },
  linkText: {
    color: "#71717a",
    fontSize: 13,
    textAlign: "center",
  },
  highlightText: {
    color: "#18181b",
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  copyrightText: {
    color: "#a1a1aa",
    fontSize: 10,
    textAlign: "center",
    marginTop: 20,
  },
});