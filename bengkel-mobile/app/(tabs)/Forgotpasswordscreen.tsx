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
} from "lucide-react-native";

// Samakan dengan API_URL di LoginScreen/RegisterScreen kamu
const API_URL = Platform.select({
  web: "http://localhost:5000",
  android: "http://10.12.5.158:5000",
  default: "http://10.12.5.158:5000",
});

// ====================================================================
// Endpoint yang diasumsikan ada di backend (sesuaikan kalau beda):
//   POST /api/auth/forgot-password   { whatsapp }              -> kirim OTP
//   POST /api/auth/reset-password    { whatsapp, otp, password } -> ganti password
// ====================================================================

const ROUTES = {
  login: "/Login",
};

const OTP_LENGTH = 4;

type Step = "phone" | "reset";

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("phone");
  const [whatsapp, setWhatsapp] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ---------------------------------------------------------------
  // STEP 1: minta OTP dikirim ke WhatsApp
  // ---------------------------------------------------------------
  const requestOtp = async (): Promise<boolean> => {
    const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
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
      setStep("reset");
      Alert.alert("OTP Terkirim", "Kode OTP sudah dikirim ke WhatsApp Anda.");
    } catch (err: any) {
      Alert.alert("Gagal", err.message || "Terjadi kesalahan, silakan coba lagi.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setIsResending(true);
      await requestOtp();
      setOtp("");
      Alert.alert("OTP Terkirim", "Kode OTP baru sudah dikirim.");
    } catch (err: any) {
      Alert.alert("Gagal", err.message || "Gagal mengirim ulang OTP.");
    } finally {
      setIsResending(false);
    }
  };

  // ---------------------------------------------------------------
  // STEP 2: verifikasi OTP + set password baru
  // ---------------------------------------------------------------
  const validateReset = () => {
    const next: Record<string, string> = {};
    if (!/^[0-9]{4}$/.test(otp.trim())) next.otp = "OTP harus terdiri dari 4 angka";
    if (!password) next.password = "Password baru wajib diisi";
    else if (password.length < 8) next.password = "Password minimal 8 karakter";
    if (password !== confirmPassword) next.confirmPassword = "Konfirmasi password tidak sama";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleResetPassword = async () => {
    if (!validateReset()) return;
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

      Alert.alert(
        "Berhasil",
        "Password Anda berhasil diperbarui. Silakan login dengan password baru.",
        [{ text: "Oke", onPress: () => router.replace(ROUTES.login) }],
      );
    } catch (err: any) {
      setErrors({ otp: err.message || "Kode OTP tidak valid" });
      Alert.alert("Gagal", err.message || "Terjadi kesalahan, silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step === "reset") {
      setStep("phone");
      setErrors({});
      return;
    }
    router.back();
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
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <ArrowLeft size={14} color="#a1a1aa" />
            <Text style={styles.backBtnText}>
              {step === "reset" ? "Ubah Nomor WhatsApp" : "Kembali ke Login"}
            </Text>
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
            Lupa{"\n"}Kata <Text style={{ color: "#ef4444" }}>Sandi?</Text>
          </Text>

          <Text style={styles.heroSubtitle}>
            {step === "phone"
              ? "Masukkan nomor WhatsApp yang terdaftar, kami akan mengirimkan kode OTP untuk reset password."
              : "Masukkan kode OTP yang dikirim ke WhatsApp Anda, lalu buat password baru."}
          </Text>
        </View>

        {/* FORM CARD */}
        <View style={styles.formCard}>
          {step === "phone" ? (
            <>
              <Text style={styles.formTitle}>Verifikasi Nomor</Text>
              <Text style={styles.formSubtitle}>
                Kode OTP akan dikirim via WhatsApp ke nomor ini.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>NOMOR WHATSAPP</Text>
                <View style={[styles.inputWrapper, errors.whatsapp ? styles.inputWrapperError : null]}>
                  <Phone size={16} color="#71717a" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Cth: 081234567890"
                    placeholderTextColor="#52525b"
                    keyboardType="phone-pad"
                    value={whatsapp}
                    onChangeText={setWhatsapp}
                  />
                </View>
                {errors.whatsapp ? <Text style={styles.errorText}>{errors.whatsapp}</Text> : null}
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, isSendingOtp && styles.disabledBtn]}
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
            </>
          ) : (
            <>
              <View style={styles.stepBadge}>
                <ShieldCheck size={13} color="#ef4444" />
                <Text style={styles.stepBadgeText}>OTP dikirim ke {whatsapp}</Text>
              </View>

              <Text style={styles.formTitle}>Buat Password Baru</Text>
              <Text style={styles.formSubtitle}>
                Masukkan 4 digit kode OTP dan password baru Anda.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>KODE OTP</Text>
                <OtpBoxInput value={otp} onChange={setOtp} error={!!errors.otp} disabled={isSubmitting} />
                {errors.otp ? <Text style={[styles.errorText, { textAlign: "center" }]}>{errors.otp}</Text> : null}

                <TouchableOpacity
                  onPress={handleResendOtp}
                  disabled={isResending || isSubmitting}
                  style={styles.resendRow}
                >
                  {isResending ? (
                    <ActivityIndicator size="small" color="#ef4444" />
                  ) : (
                    <Text style={styles.resendText}>Tidak menerima kode? Kirim Ulang</Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>PASSWORD BARU</Text>
                <View style={[styles.inputWrapper, errors.password ? styles.inputWrapperError : null]}>
                  <Lock size={16} color="#71717a" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Minimal 8 karakter"
                    placeholderTextColor="#52525b"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                    {showPassword ? (
                      <EyeOff size={16} color="#71717a" />
                    ) : (
                      <Eye size={16} color="#71717a" />
                    )}
                  </TouchableOpacity>
                </View>
                {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>KONFIRMASI PASSWORD</Text>
                <View style={[styles.inputWrapper, errors.confirmPassword ? styles.inputWrapperError : null]}>
                  <Lock size={16} color="#71717a" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Ulangi password baru"
                    placeholderTextColor="#52525b"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword((v) => !v)} hitSlop={8}>
                    {showConfirmPassword ? (
                      <EyeOff size={16} color="#71717a" />
                    ) : (
                      <Eye size={16} color="#71717a" />
                    )}
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, isSubmitting && styles.disabledBtn]}
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
                    <Text style={styles.submitBtnText}>Simpan Password Baru</Text>
                    <ArrowRight size={16} color="#FFFFFF" />
                  </View>
                )}
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
    </SafeAreaView>
  );
}

// =====================================================================
// Kotak OTP terpisah per digit (4 kotak), auto-focus & backspace ke kotak sebelumnya.
// =====================================================================
interface OtpBoxInputProps {
  value: string;
  onChange: (v: string) => void;
  error?: boolean;
  disabled?: boolean;
}

const OtpBoxInput: React.FC<OtpBoxInputProps> = ({ value, onChange, error, disabled }) => {
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] || "");

  const handleChangeDigit = (text: string, index: number) => {
    const clean = text.replace(/[^0-9]/g, "");

    if (!clean) {
      const next = digits.slice();
      next[index] = "";
      onChange(next.join(""));
      return;
    }

    if (clean.length > 1) {
      const pasted = clean.slice(0, OTP_LENGTH).split("");
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

  const handleKeyPress = (e: any, index: number) => {
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
          style={[styles.otpBox, error ? styles.otpBoxError : null, digit ? styles.otpBoxFilled : null]}
          value={digit}
          onChangeText={(t) => handleChangeDigit(t, i)}
          onKeyPress={(e) => handleKeyPress(e, i)}
          keyboardType="number-pad"
          maxLength={i === 0 ? OTP_LENGTH : 1}
          editable={!disabled}
          selectTextOnFocus
          textAlign="center"
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    flexGrow: 1,
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

  stepBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "rgba(220,38,38,0.14)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  stepBadgeText: {
    color: "#ef4444",
    fontSize: 11.5,
    fontWeight: "700",
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
    gap: 8,
  },
  inputWrapperError: {
    borderColor: "#ef4444",
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
  errorText: {
    color: "#ef4444",
    fontSize: 11,
    marginTop: 5,
  },

  // Kotak-kotak OTP
  otpBoxRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: 4,
    marginBottom: 4,
  },
  otpBox: {
    width: 52,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#27272a",
    backgroundColor: "#18181b",
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  otpBoxFilled: {
    borderColor: "#ef4444",
  },
  otpBoxError: {
    borderColor: "#ef4444",
    backgroundColor: "rgba(220,38,38,0.14)",
  },

  resendRow: {
    alignItems: "center",
    marginTop: 12,
    paddingVertical: 4,
  },
  resendText: {
    color: "#ef4444",
    fontSize: 12,
    fontWeight: "600",
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