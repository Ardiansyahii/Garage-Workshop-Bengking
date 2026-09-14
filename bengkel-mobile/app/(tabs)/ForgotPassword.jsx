import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Check, Lock, Phone, Send } from "lucide-react-native";

const API_URL = Platform.select({
  web: "http://localhost:5000",
  android: "http://10.12.5.158:5000",
  default: "http://10.12.5.158:5000",
});

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [whatsapp, setWhatsapp] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestOtp = async () => {
    if (!whatsapp.trim()) {
      Alert.alert("Data Belum Lengkap", "Masukkan nomor WhatsApp akun Anda.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/request-reset-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsapp: whatsapp.trim() }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Gagal mengirim OTP.");
      }

      setOtpSent(true);
      Alert.alert("OTP Terkirim", "Periksa pesan WhatsApp Anda.");
    } catch (error) {
      Alert.alert("Gagal", error.message || "Tidak dapat mengirim OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!/^[0-9]{4}$/.test(otp.trim())) {
      Alert.alert("OTP Tidak Valid", "Masukkan OTP 4 digit dari WhatsApp.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Password Tidak Valid", "Password baru minimal 8 karakter.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Konfirmasi Salah", "Konfirmasi password tidak sama.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whatsapp: whatsapp.trim(),
          otp: otp.trim(),
          password,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Gagal mengubah password.");
      }

      Alert.alert("Berhasil", data.message, [
        { text: "Login", onPress: () => router.replace("/Login") },
      ]);
    } catch (error) {
      Alert.alert("Gagal", error.message || "Tidak dapat mengubah password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={16} color="#a1a1aa" />
          <Text style={styles.backText}>Kembali ke Login</Text>
        </TouchableOpacity>

        <View style={styles.brandIcon}>
          <Lock size={24} color="#fff" />
        </View>
        <Text style={styles.title}>Lupa Password?</Text>
        <Text style={styles.subtitle}>
          Masukkan nomor WhatsApp terdaftar. Kami akan mengirim kode OTP untuk membuat password baru.
        </Text>

        <View style={styles.card}>
          <Field
            label="NOMOR WHATSAPP"
            icon={<Phone size={17} color="#71717a" />}
            value={whatsapp}
            onChangeText={setWhatsapp}
            placeholder="Cth: 081234567890"
            keyboardType="phone-pad"
            editable={!otpSent}
          />

          {!otpSent ? (
            <Button
              label="Kirim Kode OTP"
              icon={<Send size={16} color="#fff" />}
              onPress={handleRequestOtp}
              loading={isLoading}
            />
          ) : (
            <>
              <Field
                label="KODE OTP"
                icon={<Lock size={17} color="#71717a" />}
                value={otp}
                onChangeText={setOtp}
                placeholder="Masukkan 4 digit OTP"
                keyboardType="number-pad"
              />
              <Field
                label="PASSWORD BARU"
                icon={<Lock size={17} color="#71717a" />}
                value={password}
                onChangeText={setPassword}
                placeholder="Minimal 8 karakter"
                secureTextEntry
              />
              <Field
                label="KONFIRMASI PASSWORD"
                icon={<Lock size={17} color="#71717a" />}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Ulangi password baru"
                secureTextEntry
              />
              <Button
                label="Simpan Password Baru"
                icon={<Check size={16} color="#fff" />}
                onPress={handleResetPassword}
                loading={isLoading}
              />
              <TouchableOpacity onPress={handleRequestOtp} disabled={isLoading}>
                <Text style={styles.resendText}>Kirim ulang OTP</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, icon, ...props }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        {icon}
        <TextInput {...props} style={styles.input} placeholderTextColor="#52525b" />
      </View>
    </View>
  );
}

function Button({ label, icon, onPress, loading }) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress} disabled={loading}>
      {loading ? <ActivityIndicator color="#fff" /> : icon}
      {!loading && <Text style={styles.buttonText}>{label}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  content: { flexGrow: 1, padding: 24, justifyContent: "center" },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginBottom: 44,
  },
  backText: { color: "#a1a1aa", fontSize: 12, fontWeight: "600" },
  brandIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#dc2626",
    marginBottom: 18,
  },
  title: { color: "#fff", fontSize: 30, fontWeight: "900", marginBottom: 8 },
  subtitle: { color: "#a1a1aa", fontSize: 13, lineHeight: 20, marginBottom: 26 },
  card: {
    backgroundColor: "#09090b",
    borderColor: "#27272a",
    borderWidth: 1,
    borderRadius: 22,
    padding: 20,
  },
  field: { marginBottom: 16 },
  label: { color: "#a1a1aa", fontSize: 10, fontWeight: "700", letterSpacing: 1, marginBottom: 7 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#27272a",
    backgroundColor: "#18181b",
  },
  input: { flex: 1, color: "#fff", fontSize: 14, paddingVertical: 13 },
  button: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    backgroundColor: "#dc2626",
    marginTop: 6,
  },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  resendText: { color: "#ef4444", textAlign: "center", fontSize: 12, fontWeight: "700", marginTop: 18 },
});
