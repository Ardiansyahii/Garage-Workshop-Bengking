import React, { useState, useRef } from "react";
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
  Platform,
  Modal,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Wrench,
  Phone,
  Lock,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  X,
} from "lucide-react-native";

// Samakan dengan API_URL di LoginScreen/RegisterScreen kamu
const API_URL = Platform.select({
  web: "http://localhost:5000",
  android: "http://10.12.5.158:5000",
  default: "http://10.60.194.60:5000",
});

// ====================================================================
// Endpoint yang diasumsikan ada di backend (sesuaikan kalau beda):
//   POST /api/auth/request-reset-otp { whatsapp }              -> kirim OTP
//   POST /api/auth/reset-password    { whatsapp, otp, password } -> ganti password
// ====================================================================

const ROUTES = {
  login: "/Login",
};

const OTP_LENGTH = 4;

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [whatsapp, setWhatsapp] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  // State tambahan khusus UI (efek fokus pada input)
  const [focusedField, setFocusedField] = useState(null);

  // ---------------------------------------------------------------
  // STEP 1: minta OTP dikirim ke WhatsApp
  // ---------------------------------------------------------------
  const requestOtp = async () => {
    const res = await fetch(`${API_URL}/api/auth/request-reset-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ whatsapp }),
    });
    const data = await res.json();
    if (!res.ok || !data?.success) {
      throw new Error(data?.message || "Gagal mengirim OTP");
    }
    return true;
  };

  const handleRequestOtp = async () => {
    if (!whatsapp.trim()) {
      setErrors({ whatsapp: "Nomor WhatsApp wajib diisi" });
      return;
    }
    setErrors({});
    try {
      setIsSendingOtp(true);
      await requestOtp();
      setOtp("");
      setOtpSent(true); // tetap di step "phone", tapi sekarang kotak OTP muncul di bawah
      Alert.alert("OTP Terkirim", "Kode OTP sudah dikirim ke WhatsApp Anda.");
    } catch (err) {
      Alert.alert("Gagal", err.message || "Terjadi kesalahan, silakan coba lagi.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleChangeNumber = () => {
    setOtpSent(false);
    setOtp("");
    setErrors({});
  };

  const handleResendOtp = async () => {
    try {
      setIsResending(true);
      await requestOtp();
      setOtp("");
      Alert.alert("OTP Terkirim", "Kode OTP baru sudah dikirim.");
    } catch (err) {
      Alert.alert("Gagal", err.message || "Gagal mengirim ulang OTP.");
    } finally {
      setIsResending(false);
    }
  };

  // ---------------------------------------------------------------
  // Validasi OTP (format saja di sini) lalu buka modal password baru.
  // Verifikasi OTP yang sesungguhnya (ke server) dilakukan bersamaan
  // dengan submit password baru di modal, karena backend hanya
  // punya satu endpoint reset-password yang menerima whatsapp+otp+password.
  // ---------------------------------------------------------------
  const handleVerifyOtpStep = () => {
    if (!/^[0-9]{4}$/.test(otp.trim())) {
      setErrors({ otp: "OTP harus terdiri dari 4 angka" });
      return;
    }
    setErrors({});
    setShowPasswordModal(true);
  };

  // ---------------------------------------------------------------
  // MODAL: set password baru (mengirim otp + password ke server)
  // ---------------------------------------------------------------
  const validatePassword = () => {
    const next = {};
    if (!password) next.password = "Password baru wajib diisi";
    else if (password.length < 8) next.password = "Password minimal 8 karakter";
    if (password !== confirmPassword) next.confirmPassword = "Konfirmasi password tidak sama";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleResetPassword = async () => {
    if (!validatePassword()) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsapp, otp: otp.trim(), password }),
      });
      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Kode OTP tidak valid");
      }

      setShowPasswordModal(false);
      setPassword("");
      setConfirmPassword("");
      router.replace(ROUTES.login);
    } catch (err) {
      // Kalau OTP ternyata ditolak server, tutup modal & tampilkan error di kolom OTP
      Alert.alert("Gagal", err.message || "Terjadi kesalahan, silakan coba lagi.", [
        {
          text: "Oke",
          onPress: () => {
            setShowPasswordModal(false);
            setErrors({ otp: err.message || "Kode OTP tidak valid" });
          },
        },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    setPassword("");
    setConfirmPassword("");
    setErrors({});
  };

  const handleBack = () => {
    router.back();
  };

  const stepSubtitle = otpSent
    ? "Masukkan 4 digit kode OTP yang dikirim ke WhatsApp Anda."
    : "Jangan khawatir! Masukkan nomor WhatsApp yang terdaftar. Kami akan mengirimkan kode OTP untuk membantu Anda mengatur ulang kata sandi.";

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
            onPress={handleBack}
          >
            <ArrowLeft size={14} color="#52525b" />
            <Text style={styles.backBtnText}>Kembali ke Login</Text>
          </TouchableOpacity>
        </View>

        {/* SECTION INFORMASI */}
        <View style={styles.infoSection}>
          <View style={styles.brandRow}>
            <View style={styles.brandIcon}>
              <Wrench size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.brandText}>BENGKELKU</Text>
          </View>

          {/* Ikon ilustrasi gembok */}
          <View style={styles.lockCircle}>
            <Lock size={34} color="#18181b" />
          </View>

          <Text style={styles.heroTitle}>Lupa Kata Sandi?</Text>

          <Text style={styles.heroSubtitle}>{stepSubtitle}</Text>
        </View>

        {/* FORM — nomor WhatsApp + kode OTP di halaman yang sama */}
        <View style={styles.formCard}>
          {/* NOMOR WHATSAPP */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nomor WhatsApp</Text>
            <View
              style={[
                styles.inputWrapper,
                focusedField === "whatsapp" && styles.inputWrapperFocused,
                errors.whatsapp ? styles.inputWrapperError : null,
                otpSent && styles.inputWrapperLocked,
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
                value={whatsapp}
                onChangeText={setWhatsapp}
                editable={!otpSent}
                onFocus={() => setFocusedField("whatsapp")}
                onBlur={() => setFocusedField(null)}
              />
              {otpSent ? (
                <TouchableOpacity onPress={handleChangeNumber} hitSlop={8}>
                  <Text style={styles.changeNumberText}>Ubah</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            {errors.whatsapp ? <Text style={styles.errorText}>{errors.whatsapp}</Text> : null}
          </View>

          {!otpSent ? (
            <TouchableOpacity
              style={[styles.submitBtn, isSendingOtp && styles.disabledBtn]}
              activeOpacity={0.85}
              onPress={handleRequestOtp}
              disabled={isSendingOtp}
            >
              {isSendingOtp ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.submitBtnText}>Mengirim OTP...</Text>
                </View>
              ) : (
                <View style={styles.loadingRow}>
                  <Text style={styles.submitBtnText}>Kirim Kode OTP</Text>
                  <ArrowRight size={16} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <>
              {/* KODE OTP — muncul di bawah nomor WhatsApp setelah OTP terkirim */}
              <View style={styles.stepBadge}>
                <ShieldCheck size={14} color="#18181b" />
                <Text style={styles.stepBadgeText}>OTP dikirim ke {whatsapp}</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { textAlign: "center" }]}>Kode OTP</Text>
                <OtpBoxInput value={otp} onChange={setOtp} error={!!errors.otp} disabled={isSubmitting} />
                {errors.otp ? <Text style={[styles.errorText, { textAlign: "center" }]}>{errors.otp}</Text> : null}

                <TouchableOpacity
                  onPress={handleResendOtp}
                  disabled={isResending || isSubmitting}
                  style={styles.resendRow}
                >
                  {isResending ? (
                    <ActivityIndicator size="small" color="#18181b" />
                  ) : (
                    <Text style={styles.resendText}>
                      Tidak menerima kode?{" "}
                      <Text style={styles.resendHighlight}>Kirim Ulang</Text>
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.submitBtn}
                activeOpacity={0.85}
                onPress={handleVerifyOtpStep}
              >
                <View style={styles.loadingRow}>
                  <Text style={styles.submitBtnText}>Verifikasi</Text>
                  <ArrowRight size={16} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </>
          )}

          {/* FOOTER LINK */}
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.linkContainer}
            onPress={() => router.replace(ROUTES.login)}
          >
            <Text style={styles.linkText}>
              Sudah ingat password?{" "}
              <Text style={styles.highlightText}>Login di sini</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* COPYRIGHT */}
        <Text style={styles.copyrightText}>
          © {new Date().getFullYear()} BENGKELKU. System Access.
        </Text>
      </ScrollView>

      {/* MODAL — Buat Password Baru (muncul setelah OTP terverifikasi) */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="fade"
        onRequestClose={handleClosePasswordModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={[styles.stepBadge, { marginBottom: 0 }]}>
                <ShieldCheck size={14} color="#18181b" />
                <Text style={styles.stepBadgeText}>OTP terverifikasi</Text>
              </View>
              <TouchableOpacity onPress={handleClosePasswordModal} hitSlop={8}>
                <X size={20} color="#71717a" />
              </TouchableOpacity>
            </View>

            <Text style={styles.formTitle}>Buat Password Baru</Text>
            <Text style={styles.formSubtitle}>Masukkan password baru Anda.</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password baru</Text>
              <View
                style={[
                  styles.inputWrapper,
                  focusedField === "password" && styles.inputWrapperFocused,
                  errors.password ? styles.inputWrapperError : null,
                ]}
              >
                <Lock
                  size={18}
                  color={focusedField === "password" ? "#18181b" : "#a1a1aa"}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Minimal 8 karakter"
                  placeholderTextColor="#a1a1aa"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                  {showPassword ? (
                    <EyeOff size={18} color="#71717a" />
                  ) : (
                    <Eye size={18} color="#71717a" />
                  )}
                </TouchableOpacity>
              </View>
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Konfirmasi password</Text>
              <View
                style={[
                  styles.inputWrapper,
                  focusedField === "confirmPassword" && styles.inputWrapperFocused,
                  errors.confirmPassword ? styles.inputWrapperError : null,
                ]}
              >
                <Lock
                  size={18}
                  color={focusedField === "confirmPassword" ? "#18181b" : "#a1a1aa"}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Ulangi password baru"
                  placeholderTextColor="#a1a1aa"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onFocus={() => setFocusedField("confirmPassword")}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword((v) => !v)} hitSlop={8}>
                  {showConfirmPassword ? (
                    <EyeOff size={18} color="#71717a" />
                  ) : (
                    <Eye size={18} color="#71717a" />
                  )}
                </TouchableOpacity>
              </View>
              {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
            </View>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn]}
                activeOpacity={0.7}
                onPress={handleClosePasswordModal}
                disabled={isSubmitting}
              >
                <Text style={styles.modalCancelBtnText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalConfirmBtn, isSubmitting && styles.disabledBtn]}
                activeOpacity={0.85}
                onPress={handleResetPassword}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.submitBtnText}>Menyimpan...</Text>
                  </View>
                ) : (
                  <View style={styles.loadingRow}>
                    <Text style={styles.submitBtnText}>Simpan</Text>
                    <ArrowRight size={16} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// =====================================================================
// Kotak OTP terpisah per digit (4 kotak), auto-focus & backspace ke kotak sebelumnya.
// Setiap kotak hanya menerima 1 digit (mirip desain modal "Verifikasi OTP").
// =====================================================================
const OtpBoxInput = ({ value, onChange, error, disabled }) => {
  const inputRefs = useRef([]);
  const [focusedIndex, setFocusedIndex] = useState(null);
  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] || "");

  const handleChangeDigit = (text, index) => {
    const clean = text.replace(/[^0-9]/g, "");

    if (!clean) {
      const next = digits.slice();
      next[index] = "";
      onChange(next.join(""));
      return;
    }

    if (clean.length > 1) {
      // menangani paste beberapa digit sekaligus
      const pasted = clean.slice(0, OTP_LENGTH - index).split("");
      const next = digits.slice();
      pasted.forEach((d, i) => {
        if (index + i < OTP_LENGTH) next[index + i] = d;
      });
      onChange(next.join(""));
      const lastFilled = Math.min(index + pasted.length, OTP_LENGTH - 1);
      inputRefs.current[lastFilled]?.focus();
      return;
    }

    const next = digits.slice();
    next[index] = clean;
    onChange(next.join(""));
    if (index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.otpBoxRow}>
      {digits.map((digit, i) => (
        <TextInput
          key={i}
          ref={(ref) => {
            inputRefs.current[i] = ref;
          }}
          style={[
            styles.otpBox,
            digit ? styles.otpBoxFilled : null,
            focusedIndex === i ? styles.otpBoxFocused : null,
            error ? styles.otpBoxError : null,
          ]}
          value={digit}
          onChangeText={(t) => handleChangeDigit(t, i)}
          onKeyPress={(e) => handleKeyPress(e, i)}
          onFocus={() => setFocusedIndex(i)}
          onBlur={() => setFocusedIndex((prev) => (prev === i ? null : prev))}
          keyboardType="number-pad"
          maxLength={1}
          editable={!disabled}
          selectTextOnFocus
          textAlign="center"
        />
      ))}
    </View>
  );
};

const webNoOutline = Platform.select({
  web: { outlineStyle: "none" },
  default: {},
});

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
    marginTop: 8,
    marginBottom: 28,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
  },
  brandIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#18181b",
    justifyContent: "center",
    alignItems: "center",
  },
  brandText: {
    color: "#18181b",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  lockCircle: {
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
    fontSize: 32,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 10,
  },
  heroSubtitle: {
    color: "#71717a",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 340,
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
    fontSize: 13,
    marginBottom: 20,
  },

  stepBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "center",
    backgroundColor: "#f4f4f5",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 14,
    marginBottom: 18,
  },
  stepBadgeText: {
    color: "#18181b",
    fontSize: 12,
    fontWeight: "600",
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
    gap: 8,
  },
  inputWrapperFocused: {
    backgroundColor: "#FFFFFF",
    borderColor: "#18181b",
  },
  inputWrapperLocked: {
    opacity: 0.75,
  },
  inputWrapperError: {
    backgroundColor: "#fef2f2",
    borderColor: "#dc2626",
  },
  inputIcon: {
    marginRight: 2,
  },
  changeNumberText: {
    color: "#18181b",
    fontSize: 12,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  textInput: {
    flex: 1,
    color: "#18181b",
    fontSize: 14,
    paddingVertical: 14,
    ...webNoOutline,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 12,
    marginTop: 6,
  },

  // Kotak-kotak OTP (terpisah per digit)
  otpBoxRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: 4,
    marginBottom: 4,
  },
  otpBox: {
    width: 56,
    height: 60,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "transparent",
    backgroundColor: "#f4f4f5",
    color: "#18181b",
    fontSize: 22,
    fontWeight: "700",
    ...webNoOutline,
  },
  otpBoxFilled: {
    borderColor: "#d4d4d8",
  },
  otpBoxFocused: {
    backgroundColor: "#FFFFFF",
    borderColor: "#18181b",
  },
  otpBoxError: {
    borderColor: "#dc2626",
    backgroundColor: "#fef2f2",
  },

  resendRow: {
    alignItems: "center",
    marginTop: 14,
    paddingVertical: 4,
  },
  resendText: {
    color: "#71717a",
    fontSize: 13,
  },
  resendHighlight: {
    color: "#18181b",
    fontWeight: "700",
    textDecorationLine: "underline",
  },

  submitBtn: {
    backgroundColor: "#18181b",
    height: 54,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
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

  // MODAL — Buat Password Baru
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 24,
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalActionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#d4d4d8",
    height: 52,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  modalCancelBtnText: {
    color: "#18181b",
    fontWeight: "600",
    fontSize: 14,
  },
  modalConfirmBtn: {
    flex: 1,
    backgroundColor: "#18181b",
    height: 52,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },
});