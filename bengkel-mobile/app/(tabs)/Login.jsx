import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  Wrench,
  Phone,
  Lock,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  LayoutDashboard,
  Clock,
} from "lucide-react-native";

const { width } = Dimensions.get("window");

// Samakan dengan API_URL di RegisterScreen/VerifyScreen kamu
const API_URL = Platform.select({
  web: "http://localhost:5000",
  android: "http://10.0.2.2:5000", // khusus Emulator Android
  default: "http://192.168.1.16:5000", // Ganti dengan IP Wi-Fi laptop kamu jika pakai HP Fisik (Expo Go)
});

// ====================================================================
// Sesuaikan dengan struktur app/(tabs) project bengkel-mobile kamu.
// Yang sudah ada: home ("/"), login ("/Login"), register ("/Register")
// Yang BELUM ada file-nya (route masih perkiraan, buat dulu filenya):
//   - registerMitra, dashboard, superAdminDashboard, adminDashboard
// ====================================================================
const ROUTES = {
  home: "/",
  register: "/Register",
  registerMitra: "/register-mitra",
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HEADER / BACK BUTTON */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <ArrowLeft size={14} color="#a1a1aa" />
            <Text style={styles.backBtnText}>Kembali ke Beranda</Text>
          </TouchableOpacity>
        </View>

        {/* SECTION INFORMASI */}
        <View style={styles.infoSection}>
          <View style={styles.brandRow}>
            <View style={styles.brandIcon}>
              <Wrench size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.brandText}>
              BENGKEL<Text style={{ color: "#dc2626" }}>KU</Text>
            </Text>
          </View>

          <Text style={styles.heroTitle}>
            Kendali Penuh{"\n"}Di Tangan{" "}
            <Text style={{ color: "#ef4444" }}>Anda.</Text>
          </Text>

          <Text style={styles.heroSubtitle}>
            Portal akses eksklusif bagi administrator dan pengguna untuk
            mengelola operasional harian.
          </Text>

          {/* FEATURE LIST */}
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <View style={styles.featureIconBox}>
                <LayoutDashboard size={16} color="#ef4444" />
              </View>
              <View style={styles.featureTextGroup}>
                <Text style={styles.featureTitle}>Manajemen Terpadu</Text>
                <Text style={styles.featureDesc}>
                  Kelola data pelanggan, kendaraan, dan layanan dalam satu tempat.
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIconBox}>
                <Clock size={16} color="#ef4444" />
              </View>
              <View style={styles.featureTextGroup}>
                <Text style={styles.featureTitle}>Antrean Real-Time</Text>
                <Text style={styles.featureDesc}>
                  Pantau dan perbarui status pengerjaan kendaraan secara langsung.
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIconBox}>
                <ShieldCheck size={16} color="#ef4444" />
              </View>
              <View style={styles.featureTextGroup}>
                <Text style={styles.featureTitle}>Sistem Aman Terenkripsi</Text>
                <Text style={styles.featureDesc}>
                  Data operasional tersimpan aman dengan enkripsi tinggi.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* FORM LOGIN */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Login Portal</Text>
          <Text style={styles.formSubtitle}>
            Masukkan kredensial WhatsApp dan password Anda.
          </Text>

          {/* INPUT WHATSAPP */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>NOMOR WHATSAPP</Text>
            <View style={styles.inputWrapper}>
              <Phone size={16} color="#71717a" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Cth: 081234567890"
                placeholderTextColor="#52525b"
                keyboardType="phone-pad"
                value={formData.whatsapp}
                onChangeText={(val) => handleChange("whatsapp", val)}
              />
            </View>
          </View>

          {/* INPUT PASSWORD */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>PASSWORD</Text>
            <View style={styles.inputWrapper}>
              <Lock size={16} color="#71717a" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="••••••••"
                placeholderTextColor="#52525b"
                secureTextEntry
                value={formData.password}
                onChangeText={(val) => handleChange("password", val)}
              />
            </View>
          </View>

          {/* BUTTON SUBMIT */}
          <TouchableOpacity
            style={[styles.submitBtn, isLoading && styles.disabledBtn]}
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
                <Text style={styles.submitBtnText}>Akses Sistem</Text>
                <ArrowRight size={16} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>

          {/* FOOTER LINKS */}
          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.linkContainer}
            onPress={() => router.push(ROUTES.registerMitra)}
          >
            <Text style={styles.linkText}>
              Punya bengkel tapi belum jadi mitra?{" "}
              <Text style={styles.highlightText}>Daftar Kemitraan</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.linkContainer, { marginTop: 12 }]}
            onPress={() => router.push(ROUTES.register)}
          >
            <Text style={styles.linkText}>
              Belum punya akun?{" "}
              <Text style={styles.highlightText}>Register di sini</Text>
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
    backgroundColor: "#000000",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    paddingVertical: 16,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(24, 24, 27, 0.6)",
    borderColor: "#27272a",
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
    gap: 6,
  },
  backBtnText: {
    color: "#a1a1aa",
    fontSize: 12,
    fontWeight: "600",
  },
  infoSection: {
    marginVertical: 12,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  brandIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#dc2626",
    justifyContent: "center",
    alignItems: "center",
  },
  brandText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 1,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 34,
    marginBottom: 8,
  },
  heroSubtitle: {
    color: "#a1a1aa",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
  featureList: {
    gap: 14,
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
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
  featureTextGroup: {
    flex: 1,
  },
  featureTitle: {
    color: "#e4e4e7",
    fontSize: 13,
    fontWeight: "bold",
  },
  featureDesc: {
    color: "#71717a",
    fontSize: 11,
    marginTop: 2,
  },
  formCard: {
    backgroundColor: "rgba(9, 9, 11, 0.9)",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 24,
    padding: 20,
    marginVertical: 10,
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
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: "#a1a1aa",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 13,
    paddingVertical: 12,
  },
  submitBtn: {
    backgroundColor: "#dc2626",
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  disabledBtn: {
    backgroundColor: "#27272a",
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#27272a",
    marginVertical: 16,
  },
  linkContainer: {
    alignItems: "center",
  },
  linkText: {
    color: "#a1a1aa",
    fontSize: 11,
    textAlign: "center",
  },
  highlightText: {
    color: "#ef4444",
    fontWeight: "bold",
  },
  copyrightText: {
    color: "#52525b",
    fontSize: 10,
    textAlign: "center",
    marginTop: 20,
  },
});