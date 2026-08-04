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
  Dimensions,
  BackHandler,
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
  Check,
} from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
// Lebar ScrollView step form = lebar layar dikurangi padding kiri+kanan
// phaseContainer (20+20). Ini HARUS sama dengan lebar aktual stepScroll
// (marginHorizontal -22 pada stepScroll membatalkan padding formCard 22+22,
// jadi lebarnya balik ke lebar phaseContainer, bukan SCREEN_WIDTH penuh).
const FORM_PAGE_WIDTH = SCREEN_WIDTH - 40;

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
  const [formData, setFormData] = useState({
    name: "",
    whatsapp: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

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
      Alert.alert("Data Belum Lengkap", "Mohon isi nama lengkap kamu terlebih dahulu.");
      return false;
    }
    if (index === 1 && !formData.whatsapp.trim()) {
      Alert.alert("Data Belum Lengkap", "Mohon isi nomor WhatsApp aktif kamu.");
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
  // TOMBOL BACK UNIVERSAL (dipakai oleh panah di layar
  // maupun tombol back hardware Android)
  // ==========================================
  const handleBackPress = () => {
    if (phase === "register") {
      handleBackStep();
      return true; // sudah ditangani, jangan keluar app / pop route
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

  // Dengarkan tombol back fisik/gesture Android.
  // Registrasi ulang setiap phase/slideIndex/step berubah agar
  // closure selalu memakai state terbaru (hindari stale closure).
  useEffect(() => {
    if (Platform.OS !== "android") return;

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress
    );

    return () => subscription.remove();
  }, [phase, slideIndex, step]);

  const handleRegister = async () => {
    if (!formData.name || !formData.whatsapp || !formData.password) {
      Alert.alert("Data Belum Lengkap", "Mohon isi semua kolom terlebih dahulu.");
      return;
    }
    if (formData.password.length < 6) {
      Alert.alert("Password Terlalu Pendek", "Password minimal 6 karakter.");
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
        Alert.alert(
          "Registrasi Berhasil!",
          data.message || "Kode OTP verifikasi telah dikirim ke nomor WhatsApp kamu."
        );

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
      {/* TOMBOL LEWATI (tombol back sudah ada sebagai floating arrow) */}
      <View style={styles.onboardingTopBar}>
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkipOnboarding}>
          <Text style={styles.skipBtnText}>Lewati</Text>
        </TouchableOpacity>
      </View>

      {/* LOGO */}
      <Animated.View
        style={[
          styles.logoRow,
          { opacity: fadeAnim, transform: [{ translateY: translateAnim }] },
        ]}
      >
        <View style={styles.logoIcon}>
          <Wrench size={22} color="#FFFFFF" />
        </View>
        <Text style={styles.logoText}>
          BENGKEL<Text style={{ color: "#dc2626" }}>KU</Text>
        </Text>
      </Animated.View>

      {/* SLIDE SWIPEABLE */}
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
                <SlideIcon size={44} color="#ef4444" />
              </View>
              <Text style={styles.slideTitle}>{slide.title}</Text>
              <Text style={styles.slideDescription}>{slide.description}</Text>
            </View>
          );
        })}
      </ScrollView>

      {/* DOTS INDICATOR */}
      <View style={styles.dotsRow}>
        {ONBOARDING_SLIDES.map((slide, i) => (
          <TouchableOpacity key={slide.key} onPress={() => goToSlide(i)}>
            <View
              style={[styles.dot, i === slideIndex && styles.dotActive]}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* TOMBOL LANJUT */}
      <TouchableOpacity style={styles.nextBtn} onPress={handleNextSlide}>
        <Text style={styles.nextBtnText}>
          {slideIndex === ONBOARDING_SLIDES.length - 1
            ? "Mulai Sekarang"
            : "Lanjut"}
        </Text>
        <ArrowRight size={16} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.loginRow}>
        <Text style={styles.loginText}>Sudah punya akun? </Text>
        <TouchableOpacity onPress={() => router.push(ROUTES.login)}>
          <Text style={styles.loginLink}>Masuk di sini</Text>
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
                style={[
                  styles.progressLabel,
                  isActive && styles.progressLabelActive,
                ]}
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
        <Text style={styles.logoText}>
          BENGKEL<Text style={{ color: "#dc2626" }}>KU</Text>
        </Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Buat Akun Pelanggan</Text>
        <Text style={styles.formSubtitle}>
          Lengkapi identitas diri untuk mulai menggunakan layanan.
        </Text>

        {renderProgress()}

        {/* STEP CONTAINER (SCROLL DIKUNCI, DIGERAKKAN VIA TOMBOL) */}
        <ScrollView
          ref={stepScrollRef}
          horizontal
          pagingEnabled
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          style={styles.stepScroll}
        >
          {/* STEP 1: NAMA */}
          <View style={styles.stepPage}>
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
                  autoFocus={phase === "register" && step === 0}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleNextStep}>
              <Text style={styles.submitBtnText}>Lanjut</Text>
              <ArrowRight size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* STEP 2: WHATSAPP */}
          <View style={styles.stepPage}>
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

            <View style={styles.stepButtonRow}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => goToStep(0)}
              >
                <Text style={styles.secondaryBtnText}>Kembali</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, { flex: 1 }]}
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
              <Text style={styles.inputLabel}>PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <Lock size={16} color="#71717a" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Minimal 6 karakter"
                  placeholderTextColor="#52525b"
                  secureTextEntry
                  value={formData.password}
                  onChangeText={(v) => handleChange("password", v)}
                />
              </View>
            </View>

            <View style={styles.stepButtonRow}>
              <TouchableOpacity
                style={styles.secondaryBtn}
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
                onPress={handleRegister}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.submitBtnText}>Memproses...</Text>
                  </>
                ) : (
                  <Text style={styles.submitBtnText}>Daftar Sekarang</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

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
    </View>
  );

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
            scrollEnabled={phase === "register"}
          >
            <Animated.View style={{ opacity: phaseFade }}>
              {phase === "onboarding" ? renderOnboarding() : renderRegister()}
            </Animated.View>
          </ScrollView>

          {/* FLOATING ARROW BACK — selalu tampil, aman dari notch/status bar
              di semua device (iOS, Android, web) karena berada di dalam SafeAreaView */}
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
    flexGrow: 1,
    paddingBottom: 40,
  },
  phaseContainer: {
    padding: 20,
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
    fontSize: 12,
    fontWeight: "700",
  },
  registerTopSpacer: {
    height: 44, // ruang kosong biar konten tidak tertutup floating back button
  },

  // LOGO
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 24,
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
    borderRadius: 24,
    backgroundColor: "rgba(9, 9, 11, 0.85)",
    borderWidth: 1,
    borderColor: "#27272a",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  slideTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    lineHeight: 28,
    marginBottom: 12,
  },
  slideDescription: {
    color: "#a1a1aa",
    fontSize: 13,
    lineHeight: 20,
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
    backgroundColor: "#3f3f46",
  },
  dotActive: {
    width: 22,
    backgroundColor: "#dc2626",
  },

  // NEXT BUTTON
  nextBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#dc2626",
    paddingVertical: 15,
    borderRadius: 12,
  },
  nextBtnText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },

  // PROGRESS (FORM MULTI-STEP)
  progressWrap: {
    marginBottom: 20,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: "#27272a",
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 14,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#dc2626",
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
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
    justifyContent: "center",
    alignItems: "center",
  },
  progressCircleActive: {
    backgroundColor: "#dc2626",
    borderColor: "#dc2626",
  },
  progressCircleDone: {
    backgroundColor: "#16a34a",
    borderColor: "#16a34a",
  },
  progressCircleText: {
    color: "#71717a",
    fontSize: 11,
    fontWeight: "700",
  },
  progressCircleTextActive: {
    color: "#FFFFFF",
  },
  progressLabel: {
    color: "#71717a",
    fontSize: 10,
    fontWeight: "600",
  },
  progressLabelActive: {
    color: "#e4e4e7",
  },
  progressCaption: {
    color: "#52525b",
    fontSize: 10,
    textAlign: "center",
    marginTop: 10,
  },

  // FORM CARD
  formCard: {
    backgroundColor: "rgba(9, 9, 11, 0.85)",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 24,
    padding: 22,
    overflow: "hidden",
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
  stepScroll: {
    marginHorizontal: -22,
  },
  stepPage: {
    width: FORM_PAGE_WIDTH, // harus sama persis dengan lebar aktual stepScroll
    paddingHorizontal: 22,
  },
  inputGroup: {
    marginBottom: 20,
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
  stepButtonRow: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryBtn: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  secondaryBtnText: {
    color: "#a1a1aa",
    fontWeight: "700",
    fontSize: 13,
  },
  submitBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#dc2626",
    paddingVertical: 15,
    borderRadius: 12,
  },
  submitBtnDisabled: {
    backgroundColor: "#27272a",
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },

  // LOGIN / FOOTER
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