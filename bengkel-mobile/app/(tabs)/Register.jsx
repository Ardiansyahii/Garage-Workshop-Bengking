import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  BackHandler,
} from "react-native";

import Toast from "react-native-toast-message";

import { SafeAreaView } from "react-native-safe-area-context";
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
  Check,
  Eye,
  EyeOff,
} from "lucide-react-native";

// Lebar konten dibatasi agar tetap proporsional di web / tablet.
// Di HP (layar < 440) nilainya sama dengan lebar layar seperti sebelumnya.
const MAX_CONTENT_WIDTH = 440;
const { width: WINDOW_WIDTH } = Dimensions.get("window");
const SCREEN_WIDTH = Math.min(WINDOW_WIDTH, MAX_CONTENT_WIDTH);
// Lebar ScrollView step form = lebar layar dikurangi padding kiri+kanan
// phaseContainer (20+20). Harus sama dengan lebar aktual stepScroll.
const FORM_PAGE_WIDTH = SCREEN_WIDTH - 40;

const MIN_PASSWORD_LENGTH = 8; // samakan dengan backend (resetPassword minimal 8)

// Configure URL API dynamically based on environment
const API_URL = Platform.select({
  web: "http://localhost:5000",
  android: "http://10.51.2.60:5000", // khusus Emulator Android
  default: "http://10.60.194.60:5000", // Ganti dengan IP Wi-Fi laptop kamu jika pakai HP Fisik (Expo Go)
});

const ROUTES = {
  home: "/",
  login: "/Login",
  verify: "/verify",
};

// ==========================================
// HELPER TOAST
// Semua notifikasi pakai Toast (Alert.alert sering tidak muncul di web)
// ==========================================
const showToast = (type, text1, text2, visibilityTime = 4000) => {
  Toast.show({
    type, // "success" | "error" | "info"
    text1,
    text2,
    position: "top",
    visibilityTime,
    topOffset: Platform.OS === "ios" ? 60 : 40,
  });
};

// ==========================================
// KONTEN SLIDE ONBOARDING
// ==========================================
const ONBOARDING_SLIDES = [
  {
    key: "welcome",
    icon: Wrench,
    title: "Perawatan Mobil Kini Lebih Mudah.",
    description:
      "Reservasi servis kendaraan tanpa perlu antre panjang di bengkel, langsung dari genggaman tangan.",
  },
  {
    key: "vehicle",
    icon: Car,
    title: "Manajemen Kendaraan",
    description:
      "Simpan data mobil Anda untuk proses booking servis yang lebih instan kapan pun dibutuhkan.",
  },
  {
    key: "notif",
    icon: Bell,
    title: "Notifikasi WhatsApp",
    description:
      "Dapatkan pembaruan status pengerjaan mobil Anda langsung ke HP tanpa perlu bertanya ke bengkel.",
  },
  {
    key: "trust",
    icon: ShieldCheck,
    title: "Riwayat Terpercaya",
    description:
      "Pantau riwayat servis kendaraan Anda kapan saja dengan aman dan tersimpan rapi.",
  },
];

const FORM_STEPS = [
  { key: "name", label: "Nama" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "password", label: "Password" },
];

export default function RegisterOnboardingScreen() {
  const router = useRouter();

  // phase: "onboarding" -> slide intro | "register" -> form multi-step
  const [phase, setPhase] = useState("onboarding");
  const phaseFade = useRef(new Animated.Value(1)).current;

  // ------- ONBOARDING STATE -------
  const [slideIndex, setSlideIndex] = useState(0);
  const slideScrollRef = useRef(null);

  // ------- FORM STATE -------
  const [step, setStep] = useState(0);
  const stepScrollRef = useRef(null);
  const whatsappInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: "",
    whatsapp: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  // State tambahan khusus UI (efek fokus input & tampil/sembunyi password)
  const [focusedField, setFocusedField] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Fade-in animation awal
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

  // ==========================================
  // PERPINDAHAN FASE (onboarding <-> register)
  // ==========================================
  const switchPhase = (nextPhase) => {
    Animated.timing(phaseFade, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setPhase(nextPhase);
      phaseFade.setValue(0);
      Animated.timing(phaseFade, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }).start();
    });
  };

  const goToSlide = (index) => {
    slideScrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    setSlideIndex(index);
  };

  const handleNextSlide = () => {
    if (slideIndex < ONBOARDING_SLIDES.length - 1) {
      goToSlide(slideIndex + 1);
    } else {
      switchPhase("register");
    }
  };

  const handleSkipOnboarding = () => {
    switchPhase("register");
  };

  // ==========================================
  // PERPINDAHAN STEP FORM
  // ==========================================
  const goToStep = (index) => {
    stepScrollRef.current?.scrollTo({
      x: index * FORM_PAGE_WIDTH,
      animated: true,
    });
    setStep(index);
  };

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const validateStep = (index) => {
    if (index === 0 && !formData.name.trim()) {
      showToast("error", "Data Belum Lengkap", "Mohon isi nama lengkap kamu terlebih dahulu.");
      return false;
    }
    if (index === 1 && !formData.whatsapp.trim()) {
      showToast("error", "Data Belum Lengkap", "Mohon isi nomor WhatsApp aktif kamu.");
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (!validateStep(step)) return;
    if (step < FORM_STEPS.length - 1) {
      goToStep(step + 1);
    }
  };

  const handleBackStep = () => {
    if (step === 0) {
      switchPhase("onboarding");
      return;
    }
    goToStep(step - 1);
  };

  // ==========================================
  // TOMBOL BACK UNIVERSAL (panah di layar + hardware back Android)
  // ==========================================
  const handleBackPress = () => {
    if (phase === "register") {
      handleBackStep();
      return true;
    }

    // phase === "onboarding"
    if (slideIndex > 0) {
      goToSlide(slideIndex - 1);
      return true;
    }

    // Sudah di slide paling awal -> keluar dari layar ini
    router.push(ROUTES.home);
    return true;
  };

  // Registrasi ulang setiap state berubah agar tidak stale closure.
  useEffect(() => {
    if (Platform.OS !== "android") return;

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress
    );

    return () => subscription.remove();
  }, [phase, slideIndex, step]);

  // ==========================================
  // REGISTER
  // ==========================================
  const handleRegister = async () => {
    if (!formData.name.trim() || !formData.whatsapp.trim() || !formData.password) {
      showToast("error", "Data Belum Lengkap", "Mohon isi semua kolom terlebih dahulu.");
      return;
    }
    if (formData.password.length < MIN_PASSWORD_LENGTH) {
      showToast(
        "error",
        "Password Terlalu Pendek",
        `Password minimal ${MIN_PASSWORD_LENGTH} karakter.`
      );
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          whatsapp: formData.whatsapp.trim(),
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showToast(
          "success",
          "Registrasi Berhasil!",
          data.message || "Kode OTP verifikasi telah dikirim ke nomor WhatsApp kamu."
        );

        // Pakai nomor ter-normalisasi dari backend (62812...) agar cocok saat verifikasi OTP
        router.push({
          pathname: ROUTES.verify,
          params: { whatsapp: data.whatsapp || formData.whatsapp.trim() },
        });
      } else if (res.status === 409 || data.code === "WHATSAPP_ALREADY_REGISTERED") {
        // Nomor sudah terpakai -> toast + kembalikan user ke step WhatsApp
        showToast(
          "error",
          "Nomor Sudah Terdaftar",
          "Nomor HP ini sudah terdaftar. Silakan gunakan nomor lain atau masuk ke akun Anda.",
          5000
        );
        goToStep(1);
        // Fokuskan input WhatsApp setelah animasi pindah step selesai
        setTimeout(() => whatsappInputRef.current?.focus(), 350);
      } else {
        showToast("error", "Gagal Mendaftar", data.message || "Terjadi kesalahan pada sistem.");
      }
    } catch (error) {
      console.error("Register Error:", error);
      showToast(
        "error",
        "Kesalahan Jaringan",
        "Gagal terhubung ke server. Pastikan backend berjalan di port 5000."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // RENDER: ONBOARDING SLIDES
  // ==========================================
  const renderOnboarding = () => (
    <View style={styles.phaseContainer}>
      <View style={styles.onboardingTopBar}>
        <TouchableOpacity
          style={styles.skipBtn}
          activeOpacity={0.7}
          onPress={handleSkipOnboarding}
        >
          <Text style={styles.skipBtnText}>Lewati</Text>
        </TouchableOpacity>
      </View>

      <Animated.View
        style={[
          styles.logoRow,
          { opacity: fadeAnim, transform: [{ translateY: translateAnim }] },
        ]}
      >
        <View style={styles.logoIcon}>
          <Wrench size={22} color="#FFFFFF" />
        </View>
        <Text style={styles.logoText}>APEX GARAGE</Text>
      </Animated.View>

      <ScrollView
        ref={slideScrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setSlideIndex(idx);
        }}
        style={styles.slideScroll}
      >
        {ONBOARDING_SLIDES.map((slide) => {
          const SlideIcon = slide.icon;
          return (
            <View key={slide.key} style={styles.slide}>
              <View style={styles.slideIconWrap}>
                <SlideIcon size={40} color="#18181b" />
              </View>
              <Text style={styles.slideTitle}>{slide.title}</Text>
              <Text style={styles.slideDescription}>{slide.description}</Text>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.dotsRow}>
        {ONBOARDING_SLIDES.map((slide, i) => (
          <TouchableOpacity key={slide.key} onPress={() => goToSlide(i)}>
            <View style={[styles.dot, i === slideIndex && styles.dotActive]} />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.nextBtn}
        activeOpacity={0.85}
        onPress={handleNextSlide}
      >
        <Text style={styles.nextBtnText}>
          {slideIndex === ONBOARDING_SLIDES.length - 1 ? "Mulai Sekarang" : "Lanjut"}
        </Text>
        <ArrowRight size={16} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.loginRow}>
        <Text style={styles.loginText}>Already have an account? </Text>
        <TouchableOpacity onPress={() => router.push(ROUTES.login)}>
          <Text style={styles.loginLink}>Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ==========================================
  // RENDER: FORM MULTI-STEP
  // ==========================================
  const renderProgress = () => (
    <View style={styles.progressWrap}>
      <View style={styles.progressBarTrack}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${((step + 1) / FORM_STEPS.length) * 100}%` },
          ]}
        />
      </View>
      <View style={styles.progressStepsRow}>
        {FORM_STEPS.map((s, i) => {
          const isDone = i < step;
          const isActive = i === step;
          return (
            <View key={s.key} style={styles.progressStepItem}>
              <View
                style={[
                  styles.progressCircle,
                  isDone && styles.progressCircleDone,
                  isActive && styles.progressCircleActive,
                ]}
              >
                {isDone ? (
                  <Check size={12} color="#fff" />
                ) : (
                  <Text
                    style={[
                      styles.progressCircleText,
                      isActive && styles.progressCircleTextActive,
                    ]}
                  >
                    {i + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[styles.progressLabel, isActive && styles.progressLabelActive]}
              >
                {s.label}
              </Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.progressCaption}>
        Langkah {step + 1} dari {FORM_STEPS.length}
      </Text>
    </View>
  );

  const renderRegister = () => (
    <View style={styles.phaseContainer}>
      <View style={styles.registerTopSpacer} />

      <View style={styles.logoRow}>
        <View style={styles.logoIcon}>
          <Wrench size={22} color="#FFFFFF" />
        </View>
        <Text style={styles.logoText}>APEX GARAGE</Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Create Account</Text>
        <Text style={styles.formSubtitle}>
          Buat akun baru Anda dan temukan pengalaman terbaik bersama kami.
        </Text>

        {renderProgress()}

        <ScrollView
          ref={stepScrollRef}
          horizontal
          pagingEnabled
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={styles.stepScroll}
        >
          {/* STEP 1: NAMA */}
          <View style={styles.stepPage}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nama lengkap</Text>
              <View
                style={[
                  styles.inputWrapper,
                  focusedField === "name" && styles.inputWrapperFocused,
                ]}
              >
                <User
                  size={18}
                  color={focusedField === "name" ? "#18181b" : "#a1a1aa"}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Cth: Ardi Pratama"
                  placeholderTextColor="#a1a1aa"
                  value={formData.name}
                  onChangeText={(v) => handleChange("name", v)}
                  autoFocus={phase === "register" && step === 0}
                  onFocus={() => setFocusedField("name")}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.submitBtn}
              activeOpacity={0.85}
              onPress={handleNextStep}
            >
              <Text style={styles.submitBtnText}>Lanjut</Text>
              <ArrowRight size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* STEP 2: WHATSAPP */}
          <View style={styles.stepPage}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nomor WhatsApp aktif</Text>
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
                  ref={whatsappInputRef}
                  style={styles.input}
                  placeholder="Cth: 081234567890"
                  placeholderTextColor="#a1a1aa"
                  keyboardType="phone-pad"
                  value={formData.whatsapp}
                  onChangeText={(v) => handleChange("whatsapp", v)}
                  onFocus={() => setFocusedField("whatsapp")}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            <View style={styles.stepButtonRow}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                activeOpacity={0.7}
                onPress={() => goToStep(0)}
              >
                <Text style={styles.secondaryBtnText}>Kembali</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, { flex: 1 }]}
                activeOpacity={0.85}
                onPress={handleNextStep}
              >
                <Text style={styles.submitBtnText}>Lanjut</Text>
                <ArrowRight size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* STEP 3: PASSWORD */}
          <View style={styles.stepPage}>
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
                  style={styles.input}
                  placeholder={`Minimal ${MIN_PASSWORD_LENGTH} karakter`}
                  placeholderTextColor="#a1a1aa"
                  secureTextEntry={!showPassword}
                  value={formData.password}
                  onChangeText={(v) => handleChange("password", v)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((v) => !v)}
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

            <View style={styles.stepButtonRow}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                activeOpacity={0.7}
                onPress={() => goToStep(1)}
              >
                <Text style={styles.secondaryBtnText}>Kembali</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  { flex: 1 },
                  isLoading && styles.submitBtnDisabled,
                ]}
                activeOpacity={0.85}
                onPress={handleRegister}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.submitBtnText}>Memproses...</Text>
                  </>
                ) : (
                  <Text style={styles.submitBtnText}>Create Account</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push(ROUTES.login)}>
            <Text style={styles.loginLink}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.footerText}>
        © {new Date().getFullYear()} APEX GARAGE. All rights reserved.
      </Text>
    </View>
  );

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
            scrollEnabled={phase === "register"}
          >
            <Animated.View style={{ opacity: phaseFade }}>
              {phase === "onboarding" ? renderOnboarding() : renderRegister()}
            </Animated.View>
          </ScrollView>

          {/* FLOATING ARROW BACK */}
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

      {/* WAJIB: komponen Toast harus dirender agar Toast.show() tampil.
          Kalau <Toast /> sudah ada di app/_layout.js, HAPUS yang ini
          supaya tidak muncul dobel. */}
      <Toast />
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
  // Konten dipusatkan & dibatasi lebarnya (selaras SCREEN_WIDTH di atas)
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: "center",
  },
  phaseContainer: {
    padding: 20,
  },

  // FLOATING ARROW BACK
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
    paddingHorizontal: 20,
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
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

  // TOP BAR
  onboardingTopBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: 24,
  },
  skipBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  skipBtnText: {
    color: "#71717a",
    fontSize: 13,
    fontWeight: "600",
  },
  registerTopSpacer: {
    height: 44,
  },

  // LOGO
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 24,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#18181b",
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    color: "#18181b",
    fontWeight: "800",
    fontSize: 18,
    letterSpacing: 1.5,
  },

  // SLIDES ONBOARDING
  slideScroll: {
    marginHorizontal: -20,
  },
  slide: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 20,
    alignItems: "center",
    paddingVertical: 20,
  },
  slideIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#f4f4f5",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  slideTitle: {
    color: "#3f3f46",
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
    lineHeight: 30,
    marginBottom: 12,
  },
  slideDescription: {
    color: "#71717a",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    paddingHorizontal: 8,
  },

  // DOTS
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#e4e4e7",
  },
  dotActive: {
    width: 22,
    backgroundColor: "#18181b",
  },

  // NEXT BUTTON
  nextBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#18181b",
    height: 54,
    borderRadius: 999,
  },
  nextBtnText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },

  // PROGRESS
  progressWrap: {
    marginBottom: 24,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: "#e4e4e7",
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 14,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#18181b",
    borderRadius: 999,
  },
  progressStepsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressStepItem: {
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  progressCircle: {
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d4d4d8",
    justifyContent: "center",
    alignItems: "center",
  },
  progressCircleActive: {
    backgroundColor: "#18181b",
    borderColor: "#18181b",
  },
  progressCircleDone: {
    backgroundColor: "#52525b",
    borderColor: "#52525b",
  },
  progressCircleText: {
    color: "#a1a1aa",
    fontSize: 11,
    fontWeight: "700",
  },
  progressCircleTextActive: {
    color: "#FFFFFF",
  },
  progressLabel: {
    color: "#a1a1aa",
    fontSize: 11,
    fontWeight: "600",
  },
  progressLabelActive: {
    color: "#18181b",
  },
  progressCaption: {
    color: "#a1a1aa",
    fontSize: 11,
    textAlign: "center",
    marginTop: 10,
  },

  // FORM (flat, tanpa card; lebar halaman = FORM_PAGE_WIDTH)
  formCard: {
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  formTitle: {
    color: "#3f3f46",
    fontSize: 32,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 8,
  },
  formSubtitle: {
    color: "#71717a",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  stepScroll: {
    marginHorizontal: 0,
  },
  stepPage: {
    width: FORM_PAGE_WIDTH,
    paddingHorizontal: 0,
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
  stepButtonRow: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryBtn: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#d4d4d8",
    paddingHorizontal: 22,
    height: 54,
    borderRadius: 999,
  },
  secondaryBtnText: {
    color: "#18181b",
    fontWeight: "600",
    fontSize: 14,
  },
  submitBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#18181b",
    height: 54,
    borderRadius: 999,
  },
  submitBtnDisabled: {
    backgroundColor: "#a1a1aa",
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },

  // LOGIN / FOOTER
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#f4f4f5",
  },
  loginText: {
    color: "#71717a",
    fontSize: 13,
  },
  loginLink: {
    color: "#18181b",
    fontWeight: "700",
    fontSize: 13,
    textDecorationLine: "underline",
  },
  footerText: {
    color: "#a1a1aa",
    fontSize: 10,
    textAlign: "center",
    marginTop: 24,
  },
});