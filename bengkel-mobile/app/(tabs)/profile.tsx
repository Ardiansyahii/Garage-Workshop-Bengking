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
import {
  ChevronLeft,
  ChevronRight,
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
  default: 'http://10.12.5.158:5000/api',
});

const STORAGE_KEYS = {
  TOKEN: 'token',
  AUTH_TOKEN: 'auth_token',
  USER: 'user',
  USER_SESSION: 'user_session',
};

const OTP_LENGTH = 4;

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

  // Menyimpan apa saja yang sedang diubah (username / password / keduanya)
  // supaya bisa ditampilkan sebagai keterangan di modal OTP.
  const [pendingChanges, setPendingChanges] = useState<PendingChanges>({
    name: false,
    password: false,
  });

  const [formName, setFormName] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formConfirmPassword, setFormConfirmPassword] = useState('');
  const [formOtp, setFormOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [toast, setToast] = useState<ToastState>({ visible: false, message: '', type: 'success' });
  const toastAnim = useRef(new Animated.Value(0)).current;

  // ---------------------------------------------------------------
  // Load user: prioritas AsyncStorage, lalu refresh dari API.
  // Tidak ada data dummy — kalau API gagal tetap pakai data lokal.
  // ---------------------------------------------------------------
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

      // Catat perubahan apa saja yang sedang diajukan, dipakai untuk
      // menampilkan keterangan di modal OTP.
      const changingName = formName.trim() !== user.name;
      const changingPassword = !!formPassword;
      setPendingChanges({ name: changingName, password: changingPassword });

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

  const handleLogout = () => {
    Alert.alert(
      'Konfirmasi Logout',
      'Apakah Anda yakin ingin keluar dari akun?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove([
              STORAGE_KEYS.TOKEN,
              STORAGE_KEYS.AUTH_TOKEN,
              STORAGE_KEYS.USER,
              STORAGE_KEYS.USER_SESSION,
            ]);
            router.replace('/');
          },
        },
      ],
      { cancelable: true },
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.red} />
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

  return (
    <View style={styles.container}>
      {/* ============ HEADER ============ */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()} activeOpacity={0.7} hitSlop={10}>
          <ChevronLeft color={COLORS.white} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.notifButton} activeOpacity={0.7}>
          <Bell color={COLORS.red} size={19} />
          <View style={styles.notifDot} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ============ AVATAR + NAME ============ */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarGlowOuter}>
            <View style={styles.avatarGlowInner}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
              </View>
            </View>
          </View>
          <Text style={styles.userName}>{user?.name || '-'}</Text>
          <Text style={styles.userSubtitle}>
            {user?.role ? capitalize(user.role) : '-'} · Apex Garage
          </Text>
        </View>

        {/* ============ PERSONAL INFORMATION ============ */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>Personal Information</Text>
          <TouchableOpacity style={styles.editLink} onPress={openEditModal} activeOpacity={0.7}>
            <Edit3 color={COLORS.red} size={14} />
            <Text style={styles.editLinkText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <InfoRow icon={<Phone color={COLORS.red} size={16} />} label="WhatsApp" value={user?.whatsapp || '-'} />
          <View style={styles.divider} />
          <InfoRow icon={<Lock color={COLORS.red} size={16} />} label="Password" value="••••••••" isLast />
        </View>

        {/* ============ ACCOUNT ACTIONS ============ */}
        <Text style={[styles.sectionLabel, { marginTop: 26 }]}>Account Actions</Text>
        <View style={styles.utilityCard}>
          <TouchableOpacity style={styles.utilityRow} onPress={openEditModal} activeOpacity={0.7}>
            <View style={styles.utilityLeft}>
              <View style={styles.utilityIconWrap}>
                <Edit3 color={COLORS.red} size={16} />
              </View>
              <Text style={styles.utilityText}>Edit Profile</Text>
            </View>
            <ChevronRight color={COLORS.red} size={18} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.utilityRow} onPress={handleLogout} activeOpacity={0.7}>
            <View style={styles.utilityLeft}>
              <View style={styles.utilityIconWrap}>
                <LogOut color={COLORS.red} size={16} />
              </View>
              <Text style={[styles.utilityText, { color: COLORS.red }]}>Log-Out</Text>
            </View>
            <ChevronRight color={COLORS.red} size={18} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ============ MODAL 1: EDIT PROFILE ============ */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeEditModal}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={closeEditModal} disabled={saving} hitSlop={10}>
                <X color={COLORS.white} size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              <FormField
                label="Username"
                icon={<UserIcon color={COLORS.textMuted} size={16} />}
                value={formName}
                onChangeText={setFormName}
                placeholder="Nama lengkap"
                error={formErrors.name}
              />
              <FormField
                label="Password Baru (opsional)"
                icon={<Lock color={COLORS.textMuted} size={16} />}
                value={formPassword}
                onChangeText={setFormPassword}
                placeholder="Kosongkan jika tidak diubah"
                secureTextEntry={!showPassword}
                error={formErrors.password}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
                    {showPassword ? (
                      <EyeOff color={COLORS.textMuted} size={16} />
                    ) : (
                      <Eye color={COLORS.textMuted} size={16} />
                    )}
                  </TouchableOpacity>
                }
              />
              {formPassword ? (
                <FormField
                  label="Konfirmasi Password"
                  icon={<Lock color={COLORS.textMuted} size={16} />}
                  value={formConfirmPassword}
                  onChangeText={setFormConfirmPassword}
                  placeholder="Ulangi password baru"
                  secureTextEntry={!showConfirmPassword}
                  error={formErrors.confirmPassword}
                  rightIcon={
                    <TouchableOpacity onPress={() => setShowConfirmPassword((v) => !v)}>
                      {showConfirmPassword ? (
                        <EyeOff color={COLORS.textMuted} size={16} />
                      ) : (
                        <Eye color={COLORS.textMuted} size={16} />
                      )}
                    </TouchableOpacity>
                  }
                />
              ) : null}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={closeEditModal}
                disabled={saving}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSubmitEdit}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <Check color={COLORS.white} size={16} />
                    <Text style={styles.saveButtonText}>Kirim OTP</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ============ MODAL 2: VERIFIKASI OTP (terpisah, kotak per digit) ============ */}
      <Modal visible={otpModalVisible} transparent animationType="fade" onRequestClose={closeOtpModal}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ShieldCheck color={COLORS.red} size={18} />
                <Text style={styles.modalTitle}>Verifikasi OTP</Text>
              </View>
              <TouchableOpacity onPress={closeOtpModal} disabled={verifying || resending} hitSlop={10}>
                <X color={COLORS.white} size={20} />
              </TouchableOpacity>
            </View>

            {/* Keterangan perubahan yang sedang diproses */}
            {pendingLabel ? (
              <View style={styles.pendingBadge}>
                <Edit3 color={COLORS.red} size={13} />
                <Text style={styles.pendingBadgeText}>Sedang mengganti {pendingLabel}</Text>
              </View>
            ) : null}

            <Text style={styles.otpHelperText}>
              Masukkan 4 digit kode OTP yang sudah dikirim ke WhatsApp {user?.whatsapp || 'Anda'}.
            </Text>

            <OtpBoxInput value={formOtp} onChange={setFormOtp} error={!!formErrors.otp} disabled={verifying} />
            {formErrors.otp ? <Text style={[styles.errorText, { textAlign: 'center' }]}>{formErrors.otp}</Text> : null}

            <TouchableOpacity onPress={handleResendOtp} disabled={resending || verifying} style={styles.resendRow}>
              {resending ? (
                <ActivityIndicator size="small" color={COLORS.red} />
              ) : (
                <Text style={styles.resendText}>Tidak menerima kode? Kirim Ulang</Text>
              )}
            </TouchableOpacity>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={closeOtpModal}
                disabled={verifying || resending}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleVerifyOtp}
                disabled={verifying || resending}
                activeOpacity={0.8}
              >
                {verifying ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <Check color={COLORS.white} size={16} />
                    <Text style={styles.saveButtonText}>Verifikasi</Text>
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
          <Text style={styles.toastText}>{toast.message}</Text>
        </Animated.View>
      )}
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
const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: string; isLast?: boolean }> = ({
  icon,
  label,
  value,
}) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIconWrap}>{icon}</View>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue} numberOfLines={1}>
      {value}
    </Text>
  </View>
);

interface FormFieldProps {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
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
  keyboardType,
  autoCapitalize,
  error,
  rightIcon,
}) => (
  <View style={styles.fieldWrapper}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
      {icon}
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
      {rightIcon}
    </View>
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
  </View>
);

// Kotak OTP terpisah per digit (4 kotak), dengan auto-focus & backspace ke kotak sebelumnya.
interface OtpBoxInputProps {
  value: string;
  onChange: (v: string) => void;
  error?: boolean;
  disabled?: boolean;
}

const OtpBoxInput: React.FC<OtpBoxInputProps> = ({ value, onChange, error, disabled }) => {
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] || '');

  const handleChangeDigit = (text: string, index: number) => {
    const clean = text.replace(/[^0-9]/g, '');

    if (!clean) {
      const next = digits.slice();
      next[index] = '';
      onChange(next.join(''));
      return;
    }

    // Kalau user paste beberapa digit sekaligus ke satu kotak
    if (clean.length > 1) {
      const pasted = clean.slice(0, OTP_LENGTH).split('');
      const next = digits.slice();
      pasted.forEach((d, i) => {
        if (index + i < OTP_LENGTH) next[index + i] = d;
      });
      onChange(next.join(''));
      const lastFilled = Math.min(index + pasted.length, OTP_LENGTH - 1);
      inputRefs.current[lastFilled]?.focus();
      return;
    }

    const next = digits.slice();
    next[index] = clean;
    onChange(next.join(''));
    if (index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
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

// =====================================================================
// THEME — black background, improved glowing red accent
// =====================================================================
const COLORS = {
  bg: '#08080A',
  card: '#131316',
  cardAlt: '#17171B',
  border: 'rgba(255,255,255,0.06)',
  red: '#FF3B4E',
  redSoft: 'rgba(255,59,78,0.14)',
  redGlow: 'rgba(255,59,78,0.35)',
  white: '#F5F5F7',
  text: '#EDEDEF',
  textMuted: '#8A8A93',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg },

  header: {
    paddingTop: Platform.OS === 'ios' ? 54 : 40,
    paddingBottom: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { color: COLORS.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  notifButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.redSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 6,
    right: 7,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.red,
  },

  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },

  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatarGlowOuter: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: COLORS.redGlow,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.red,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 22,
    elevation: 12,
  },
  avatarGlowInner: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.red,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: COLORS.red, fontSize: 30, fontWeight: '700' },
  userName: { fontSize: 21, fontWeight: '700', color: COLORS.white, marginTop: 16 },
  userSubtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionLabel: { fontSize: 15, fontWeight: '700', color: COLORS.white },
  editLink: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  editLinkText: { color: COLORS.red, fontWeight: '700', fontSize: 13.5 },

  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, gap: 12 },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.redSoft,
    borderWidth: 1,
    borderColor: 'rgba(255,59,78,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: { fontSize: 13.5, color: COLORS.textMuted, flex: 1 },
  infoValue: { fontSize: 14, color: COLORS.text, fontWeight: '600', maxWidth: 170, textAlign: 'right' },
  divider: { height: 1, backgroundColor: COLORS.border },

  utilityCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  utilityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15 },
  utilityLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  utilityIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.redSoft,
    borderWidth: 1,
    borderColor: 'rgba(255,59,78,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  utilityText: { fontSize: 14.5, fontWeight: '600', color: COLORS.text },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'center', paddingHorizontal: 18 },
  modalCard: {
    backgroundColor: COLORS.cardAlt,
    borderRadius: 22,
    padding: 20,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: COLORS.white },

  // Badge keterangan "sedang mengganti username/password"
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.redSoft,
    borderWidth: 1,
    borderColor: 'rgba(255,59,78,0.3)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  pendingBadgeText: { color: COLORS.red, fontSize: 12.5, fontWeight: '700' },

  otpHelperText: { fontSize: 13, color: COLORS.textMuted, marginBottom: 18, lineHeight: 18 },

  // Kotak-kotak OTP
  otpBoxRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 6,
  },
  otpBox: {
    width: 54,
    height: 58,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '700',
  },
  otpBoxFilled: { borderColor: COLORS.red },
  otpBoxError: { borderColor: COLORS.red, backgroundColor: '#2A0E12' },

  resendRow: { alignItems: 'center', marginTop: 14, marginBottom: 4, paddingVertical: 6 },
  resendText: { color: COLORS.red, fontSize: 13, fontWeight: '600' },

  fieldWrapper: { marginBottom: 14 },
  fieldLabel: { fontSize: 12.5, fontWeight: '600', color: COLORS.textMuted, marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.3,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: COLORS.card,
  },
  inputError: { borderColor: COLORS.red },
  input: { flex: 1, paddingVertical: 11, fontSize: 14, color: COLORS.white },
  errorText: { color: COLORS.red, fontSize: 11.5, marginTop: 4 },

  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 13,
  },
  cancelButton: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  cancelButtonText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  saveButton: {
    backgroundColor: COLORS.red,
    shadowColor: COLORS.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  saveButtonText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },

  // Toast
  toast: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
  },
  toastSuccess: { backgroundColor: COLORS.cardAlt, borderColor: 'rgba(255,59,78,0.4)' },
  toastError: { backgroundColor: '#2A0E12', borderColor: COLORS.red },
  toastText: { color: COLORS.white, fontWeight: '600', fontSize: 13.5, textAlign: 'center' },
});

export default ProfileScreen;