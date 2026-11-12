import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import BottomNavBar from "../../components/Bottomnavbar";
import {
  Bell,
  User as UserIcon,
  Phone,
  Lock,
  Edit3,
  LogOut,
  X,
  Eye,
  EyeOff,
  Check,
  ShieldCheck,
} from 'lucide-react-native';

// =====================================================================
// CONFIG — sesuaikan dengan environment backend Apex Garage kamu
// =====================================================================
const API_BASE_URL = Platform.select({
  web: 'http://localhost:5000/api',
  android: 'http://10.12.5.158:5000/api',
  default: 'http://10.60.194.60:5000/api',
});

const STORAGE_KEYS = {
  TOKEN: 'token',
  AUTH_TOKEN: 'auth_token',
  USER: 'user',
  USER_SESSION: 'user_session',
};

const OTP_LENGTH = 4;

// Palet sama dengan halaman Forgot Password / Dashboard / Booking
const COLORS = {
  white: '#FFFFFF',
  ink: '#18181b',
  text: '#3f3f46',
  sub: '#71717a',
  mute: '#a1a1aa',
  bg: '#f4f4f5',
  line: '#e4e4e7',
  line2: '#d4d4d8',
  err: '#dc2626',
  errBg: '#fef2f2',
};

// =====================================================================
// TYPES — mengikuti payload backend
// =====================================================================
interface UserData {
  id: number;
  name: string;
  whatsapp: string;
  role: string;
  bengkel_id: number | null;
}

interface ProfileScreenProps {
  navigation?: any;
}

type ToastType = 'success' | 'error';
interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
}

interface PendingChanges {
  name: boolean;
  password: boolean;
}

// =====================================================================
// MAIN COMPONENT
// =====================================================================
const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal edit profile (username / password)
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modal verifikasi OTP (terpisah dari modal edit)
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  // Perubahan yang sedang diajukan (ditampilkan sebagai badge di modal OTP)
  const [pendingChanges, setPendingChanges] = useState<PendingChanges>({ name: false, password: false });

  const [formName, setFormName] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formConfirmPassword, setFormConfirmPassword] = useState('');
  const [formOtp, setFormOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [toast, setToast] = useState<ToastState>({ visible: false, message: '', type: 'success' });
  const toastAnim = useRef(new Animated.Value(0)).current;

  // Load user: prioritas AsyncStorage, lalu refresh dari API.
  const loadUser = useCallback(async () => {
    try {
      setLoading(true);
      const storedUser = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      const token =
        (await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)) ||
        (await AsyncStorage.getItem(STORAGE_KEYS.TOKEN));

      if (storedUser) setUser(JSON.parse(storedUser));

      if (token) {
        const res = await fetch(`${API_BASE_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data?.success && data?.user) {
          setUser(data.user);
          await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
        }
      }
    } catch (err) {
      console.warn('Gagal memuat profile dari API, menggunakan data lokal:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ visible: true, message, type });
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(toastAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setToast((t) => ({ ...t, visible: false })));
  };

  // ---------------------------------------------------------------
  // Modal Edit Profile
  // ---------------------------------------------------------------
  const openEditModal = () => {
    if (!user) return;
    setFormName(user.name || '');
    setFormPassword('');
    setFormConfirmPassword('');
    setFormOtp('');
    setFormErrors({});
    setModalVisible(true);
  };

  const closeEditModal = () => {
    if (saving) return;
    setModalVisible(false);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formName.trim()) errors.name = 'Username wajib diisi';
    if (formName.trim() === user?.name && !formPassword) {
      errors.name = 'Masukkan username atau password baru';
    }
    if (formPassword) {
      if (formPassword.length < 8) errors.password = 'Password minimal 8 karakter';
      if (formPassword !== formConfirmPassword) errors.confirmPassword = 'Konfirmasi password tidak sama';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Kirim request OTP ke backend (dipakai saat submit form edit & saat resend)
  const requestOtp = async (): Promise<boolean> => {
    const token =
      (await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)) ||
      (await AsyncStorage.getItem(STORAGE_KEYS.TOKEN));

    const otpRes = await fetch(`${API_BASE_URL}/users/profile/request-update-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: formName.trim() !== user?.name ? formName.trim() : undefined,
        password: formPassword || undefined,
      }),
    });
    const otpData = await otpRes.json();
    if (!otpRes.ok || !otpData?.success) {
      throw new Error(otpData?.message || 'Gagal mengirim OTP');
    }
    return true;
  };

  // Submit form edit -> minta OTP -> tutup modal edit, buka modal OTP
  const handleSubmitEdit = async () => {
    if (!validateForm() || !user) return;
    try {
      setSaving(true);
      setPendingChanges({ name: formName.trim() !== user.name, password: !!formPassword });

      await requestOtp();
      setFormOtp('');
      setFormErrors({});
      setModalVisible(false);
      setOtpModalVisible(true);
      showToast('OTP sudah dikirim ke WhatsApp Anda', 'success');
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan, silakan coba lagi', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------
  // Modal Verifikasi OTP
  // ---------------------------------------------------------------
  const closeOtpModal = () => {
    if (verifying || resending) return;
    setOtpModalVisible(false);
    setFormOtp('');
    setFormErrors({});
  };

  const handleResendOtp = async () => {
    try {
      setResending(true);
      await requestOtp();
      setFormOtp('');
      showToast('OTP baru sudah dikirim', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal mengirim ulang OTP', 'error');
    } finally {
      setResending(false);
    }
  };

  const handleVerifyOtp = useCallback(async () => {
    if (!/^[0-9]{4}$/.test(formOtp.trim())) {
      setFormErrors({ otp: 'OTP harus terdiri dari 4 angka' });
      return;
    }
    try {
      setVerifying(true);
      const token =
        (await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)) ||
        (await AsyncStorage.getItem(STORAGE_KEYS.TOKEN));

      const res = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ otp: formOtp.trim() }),
      });
      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Kode OTP tidak valid');
      }

      const updatedUser: UserData = data.user;
      setUser(updatedUser);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));

      setOtpModalVisible(false);
      setFormOtp('');
      setFormPassword('');
      setFormConfirmPassword('');
      showToast('Profile berhasil diperbarui', 'success');
    } catch (err: any) {
      setFormErrors({ otp: err.message || 'Kode OTP tidak valid' });
      showToast(err.message || 'Terjadi kesalahan, silakan coba lagi', 'error');
    } finally {
      setVerifying(false);
    }
  }, [formOtp]);

  // Auto-verify begitu 4 digit sudah terisi semua
  useEffect(() => {
    if (otpModalVisible && formOtp.length === OTP_LENGTH && !verifying && !resending) {
      handleVerifyOtp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formOtp, otpModalVisible]);

  // Proses logout yang sebenarnya (dipakai web & native)
  const performLogout = async () => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.TOKEN,
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.USER,
        STORAGE_KEYS.USER_SESSION,
      ]);
    } catch (err) {
      console.warn('Gagal menghapus sesi lokal:', err);
    } finally {
      router.replace('/');
    }
  };

  const handleLogout = () => {
    // Alert.alert dengan tombol tidak berfungsi di React Native Web
    if (Platform.OS === 'web') {
      const confirmed =
        typeof window !== 'undefined' && window.confirm('Apakah Anda yakin ingin keluar dari akun?');
      if (confirmed) performLogout();
      return;
    }

    Alert.alert(
      'Konfirmasi Logout',
      'Apakah Anda yakin ingin keluar dari akun?',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Keluar', style: 'destructive', onPress: performLogout },
      ],
      { cancelable: true },
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.ink} />
        <BottomNavBar activeTab="profile" />
      </View>
    );
  }

  const pendingLabel =
    pendingChanges.name && pendingChanges.password
      ? 'Username & Password'
      : pendingChanges.name
      ? 'Username'
      : pendingChanges.password
      ? 'Password'
      : null;

  const eye = (visible: boolean, toggle: () => void) => (
    <TouchableOpacity onPress={toggle} hitSlop={8}>
      {visible ? <EyeOff color={COLORS.sub} size={18} /> : <Eye color={COLORS.sub} size={18} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ============ HEADER ============ */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profil</Text>
          <TouchableOpacity style={styles.notifButton} activeOpacity={0.7}>
            <Bell color={COLORS.ink} size={18} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>

        {/* ============ AVATAR + NAMA ============ */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
          </View>
          <Text style={styles.userName}>{user?.name || '-'}</Text>
          <View style={styles.badge}>
            <ShieldCheck color={COLORS.ink} size={14} />
            <Text style={styles.badgeText}>{user?.role ? capitalize(user.role) : '-'} · Apex Garage</Text>
          </View>
        </View>

        {/* ============ INFORMASI AKUN ============ */}
        <InfoField label="Nomor WhatsApp" icon={<Phone color={COLORS.mute} size={18} />} value={user?.whatsapp || '-'} />
        <InfoField label="Password" icon={<Lock color={COLORS.mute} size={18} />} value="••••••••" />

        {/* ============ AKSI ============ */}
        <TouchableOpacity style={styles.primaryBtn} onPress={openEditModal} activeOpacity={0.85}>
          <Edit3 color={COLORS.white} size={16} />
          <Text style={styles.primaryBtnText}>Edit Profil</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <LogOut color={COLORS.err} size={16} />
          <Text style={styles.logoutBtnText}>Keluar</Text>
        </TouchableOpacity>

        <Text style={styles.copyright}>© {new Date().getFullYear()} APEX GARAGE. System Access.</Text>
      </ScrollView>

      {/* ============ MODAL 1: EDIT PROFILE ============ */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeEditModal}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profil</Text>
              <TouchableOpacity onPress={closeEditModal} disabled={saving} hitSlop={10}>
                <X color={COLORS.sub} size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              <FormField
                label="Username"
                icon={<UserIcon size={18} />}
                value={formName}
                onChangeText={setFormName}
                placeholder="Nama lengkap"
                error={formErrors.name}
              />
              <FormField
                label="Password Baru (opsional)"
                icon={<Lock size={18} />}
                value={formPassword}
                onChangeText={setFormPassword}
                placeholder="Kosongkan jika tidak diubah"
                secureTextEntry={!showPassword}
                error={formErrors.password}
                rightIcon={eye(showPassword, () => setShowPassword((v) => !v))}
              />
              {formPassword ? (
                <FormField
                  label="Konfirmasi Password"
                  icon={<Lock size={18} />}
                  value={formConfirmPassword}
                  onChangeText={setFormConfirmPassword}
                  placeholder="Ulangi password baru"
                  secureTextEntry={!showConfirmPassword}
                  error={formErrors.confirmPassword}
                  rightIcon={eye(showConfirmPassword, () => setShowConfirmPassword((v) => !v))}
                />
              ) : null}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={closeEditModal} disabled={saving} activeOpacity={0.7}>
                <Text style={styles.cancelBtnText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn, saving && styles.disabledBtn]}
                onPress={handleSubmitEdit}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <Check color={COLORS.white} size={16} />
                    <Text style={styles.saveBtnText}>Kirim OTP</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ============ MODAL 2: VERIFIKASI OTP ============ */}
      <Modal visible={otpModalVisible} transparent animationType="fade" onRequestClose={closeOtpModal}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Verifikasi OTP</Text>
              <TouchableOpacity onPress={closeOtpModal} disabled={verifying || resending} hitSlop={10}>
                <X color={COLORS.sub} size={20} />
              </TouchableOpacity>
            </View>

            {pendingLabel ? (
              <View style={[styles.badge, { marginBottom: 12 }]}>
                <Edit3 color={COLORS.ink} size={13} />
                <Text style={styles.badgeText}>Sedang mengganti {pendingLabel}</Text>
              </View>
            ) : null}

            <Text style={styles.otpHelperText}>
              Masukkan 4 digit kode OTP yang sudah dikirim ke WhatsApp {user?.whatsapp || 'Anda'}.
            </Text>

            <OtpBoxInput value={formOtp} onChange={setFormOtp} error={!!formErrors.otp} disabled={verifying} />
            {formErrors.otp ? <Text style={[styles.errorText, { textAlign: 'center' }]}>{formErrors.otp}</Text> : null}

            <TouchableOpacity onPress={handleResendOtp} disabled={resending || verifying} style={styles.resendRow}>
              {resending ? (
                <ActivityIndicator size="small" color={COLORS.ink} />
              ) : (
                <Text style={styles.resendText}>
                  Tidak menerima kode? <Text style={styles.resendHighlight}>Kirim Ulang</Text>
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={closeOtpModal}
                disabled={verifying || resending}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn, (verifying || resending) && styles.disabledBtn]}
                onPress={handleVerifyOtp}
                disabled={verifying || resending}
                activeOpacity={0.85}
              >
                {verifying ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <Check color={COLORS.white} size={16} />
                    <Text style={styles.saveBtnText}>Verifikasi</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ============ TOAST ============ */}
      {toast.visible && (
        <Animated.View
          style={[
            styles.toast,
            toast.type === 'error' ? styles.toastError : styles.toastSuccess,
            {
              opacity: toastAnim,
              transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            },
          ]}
        >
          <Text style={[styles.toastText, toast.type === 'error' && { color: COLORS.err }]}>{toast.message}</Text>
        </Animated.View>
      )}
      <BottomNavBar activeTab="profile" />
    </View>
  );
};

// =====================================================================
// HELPERS
// =====================================================================
const getInitials = (name?: string) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : parts[0].slice(0, 2).toUpperCase();
};

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// =====================================================================
// SUB COMPONENTS
// =====================================================================
// Kolom info read-only (gaya input Forgot Password)
const InfoField: React.FC<{ label: string; icon: React.ReactNode; value: string }> = ({ label, icon, value }) => (
  <View style={styles.fieldWrapper}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={styles.inputWrapper}>
      {icon}
      <Text style={styles.infoValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  </View>
);

interface FormFieldProps {
  label: string;
  icon: React.ReactElement;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  error?: string;
  rightIcon?: React.ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  error,
  rightIcon,
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputWrapper, focused && styles.inputFocused, error ? styles.inputError : null]}>
        {React.cloneElement(icon, { color: focused ? COLORS.ink : COLORS.mute })}
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.mute}
          secureTextEntry={secureTextEntry}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {rightIcon}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

// Kotak OTP terpisah per digit (4 kotak), dengan auto-focus & backspace ke kotak sebelumnya.
interface OtpBoxInputProps {
  value: string;
  onChange: (v: string) => void;
  error?: boolean;
  disabled?: boolean;
}

const OtpBoxInput: React.FC<OtpBoxInputProps> = ({ value, onChange, error, disabled }) => {
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] || '');

  const handleChangeDigit = (text: string, index: number) => {
    const clean = text.replace(/[^0-9]/g, '');

    if (!clean) {
      const next = digits.slice();
      next[index] = '';
      onChange(next.join(''));
      return;
    }

    // Paste beberapa digit sekaligus ke satu kotak
    if (clean.length > 1) {
      const pasted = clean.slice(0, OTP_LENGTH).split('');
      const next = digits.slice();
      pasted.forEach((d, i) => {
        if (index + i < OTP_LENGTH) next[index + i] = d;
      });
      onChange(next.join(''));
      inputRefs.current[Math.min(index + pasted.length, OTP_LENGTH - 1)]?.focus();
      return;
    }

    const next = digits.slice();
    next[index] = clean;
    onChange(next.join(''));
    if (index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
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
          maxLength={i === 0 ? OTP_LENGTH : 1}
          editable={!disabled}
          selectTextOnFocus
          textAlign="center"
        />
      ))}
    </View>
  );
};

// =====================================================================
// STYLES
// =====================================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white },

  scrollContent: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 54 : 40,
    paddingBottom: 120,
  },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  headerTitle: { color: COLORS.ink, fontSize: 22, fontWeight: '900' },
  notifButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: { position: 'absolute', top: 9, right: 10, width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.err },

  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.line,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  avatarText: { color: COLORS.ink, fontSize: 30, fontWeight: '800' },
  userName: { color: COLORS.text, fontSize: 26, fontWeight: '900', textAlign: 'center', marginBottom: 10 },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  badgeText: { color: COLORS.ink, fontSize: 12, fontWeight: '600' },

  fieldWrapper: { marginBottom: 16 },
  fieldLabel: { color: COLORS.text, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 54,
    paddingHorizontal: 16,
    backgroundColor: COLORS.bg,
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderRadius: 16,
  },
  inputFocused: { backgroundColor: COLORS.white, borderColor: COLORS.ink },
  inputError: { backgroundColor: COLORS.errBg, borderColor: COLORS.err },
  input: { flex: 1, color: COLORS.ink, fontSize: 14, paddingVertical: 14 },
  infoValue: { flex: 1, color: COLORS.ink, fontSize: 14, fontWeight: '600' },
  errorText: { color: COLORS.err, fontSize: 12, marginTop: 6 },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 54,
    borderRadius: 999,
    backgroundColor: COLORS.ink,
    marginTop: 8,
  },
  primaryBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '600' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 54,
    borderRadius: 999,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line2,
    marginTop: 12,
  },
  logoutBtnText: { color: COLORS.err, fontSize: 15, fontWeight: '600' },
  copyright: { color: COLORS.mute, fontSize: 10, textAlign: 'center', marginTop: 24 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', paddingHorizontal: 20 },
  modalCard: { width: '100%', maxWidth: 420, alignSelf: 'center', backgroundColor: COLORS.white, borderRadius: 28, padding: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { color: COLORS.ink, fontSize: 22, fontWeight: '800' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  modalBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 52, borderRadius: 999 },
  cancelBtn: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line2 },
  cancelBtnText: { color: COLORS.ink, fontSize: 14, fontWeight: '600' },
  saveBtn: { backgroundColor: COLORS.ink },
  saveBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '600' },
  disabledBtn: { backgroundColor: COLORS.mute },

  otpHelperText: { color: COLORS.sub, fontSize: 13, lineHeight: 19, marginBottom: 18 },
  otpBoxRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginVertical: 4 },
  otpBox: {
    width: 56,
    height: 60,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: COLORS.bg,
    color: COLORS.ink,
    fontSize: 22,
    fontWeight: '700',
  },
  otpBoxFilled: { borderColor: COLORS.line2 },
  otpBoxFocused: { backgroundColor: COLORS.white, borderColor: COLORS.ink },
  otpBoxError: { backgroundColor: COLORS.errBg, borderColor: COLORS.err },
  resendRow: { alignItems: 'center', marginTop: 14, marginBottom: 8, paddingVertical: 4 },
  resendText: { color: COLORS.sub, fontSize: 13 },
  resendHighlight: { color: COLORS.ink, fontWeight: '700', textDecorationLine: 'underline' },

  // Toast
  toast: { position: 'absolute', bottom: 110, left: 20, right: 20, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 18, borderWidth: 1 },
  toastSuccess: { backgroundColor: COLORS.white, borderColor: COLORS.line2 },
  toastError: { backgroundColor: COLORS.errBg, borderColor: COLORS.err },
  toastText: { color: COLORS.ink, fontWeight: '600', fontSize: 13.5, textAlign: 'center' },
});

export default ProfileScreen;