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
import {
  ChevronLeft,
  ChevronRight,
  Bell,
  User as UserIcon,
  Mail,
  Phone,
  Lock,
  Edit3,
  LogOut,
  X,
  Eye,
  EyeOff,
  Check,
} from 'lucide-react-native';

// =====================================================================
// CONFIG — sesuaikan dengan environment backend Apex Garage kamu
// =====================================================================
const API_BASE_URL = 'http://10.0.2.2:5000/api'; // Android emulator -> localhost backend
// iOS simulator: 'http://localhost:5000/api'
// Device fisik / production: ganti dengan domain backend kamu

const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
};

// =====================================================================
// TYPES — mengikuti payload backend
// =====================================================================
interface UserData {
  id: number;
  name: string;
  whatsapp: string;
  email?: string | null;
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

// =====================================================================
// MAIN COMPONENT
// =====================================================================
const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formWhatsapp, setFormWhatsapp] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formConfirmPassword, setFormConfirmPassword] = useState('');
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
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);

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

  const openEditModal = () => {
    if (!user) return;
    setFormName(user.name || '');
    setFormEmail(user.email || '');
    setFormWhatsapp(user.whatsapp || '');
    setFormPassword('');
    setFormConfirmPassword('');
    setFormErrors({});
    setModalVisible(true);
  };

  const closeEditModal = () => {
    if (saving) return;
    setModalVisible(false);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formName.trim()) errors.name = 'Nama wajib diisi';
    if (!formWhatsapp.trim() || !/^[0-9+]{9,15}$/.test(formWhatsapp.trim())) {
      errors.whatsapp = 'Nomor WhatsApp tidak valid';
    }
    if (formEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail.trim())) {
      errors.email = 'Format email tidak valid';
    }
    if (formPassword) {
      if (formPassword.length < 8) errors.password = 'Password minimal 8 karakter';
      if (formPassword !== formConfirmPassword) errors.confirmPassword = 'Konfirmasi password tidak sama';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Password di-hash di BACKEND (bcrypt), frontend hanya kirim plaintext lewat HTTPS.
  const handleSave = async () => {
    if (!validateForm() || !user) return;
    try {
      setSaving(true);
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);

      const payload: Record<string, string> = {
        name: formName.trim(),
        whatsapp: formWhatsapp.trim(),
      };
      if (formEmail.trim()) payload.email = formEmail.trim();
      if (formPassword) payload.password = formPassword;

      const res = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Gagal memperbarui profile');
      }

      const updatedUser: UserData = data.user;
      setUser(updatedUser);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      setModalVisible(false);
      showToast('Profile berhasil diperbarui', 'success');
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan, silakan coba lagi', 'error');
    } finally {
      setSaving(false);
    }
  };

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
            await AsyncStorage.multiRemove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER]);
            if (navigation?.reset) {
              navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
            } else if (navigation?.navigate) {
              navigation.navigate('Login');
            }
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
          <InfoRow icon={<Mail color={COLORS.red} size={16} />} label="Email" value={user?.email || 'Belum diatur'} />
          <View style={styles.divider} />
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

      {/* ============ EDIT PROFILE MODAL ============ */}
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
                label="Nama"
                icon={<UserIcon color={COLORS.textMuted} size={16} />}
                value={formName}
                onChangeText={setFormName}
                placeholder="Nama lengkap"
                error={formErrors.name}
              />
              <FormField
                label="Email"
                icon={<Mail color={COLORS.textMuted} size={16} />}
                value={formEmail}
                onChangeText={setFormEmail}
                placeholder="contoh@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                error={formErrors.email}
              />
              <FormField
                label="Nomor WhatsApp"
                icon={<Phone color={COLORS.textMuted} size={16} />}
                value={formWhatsapp}
                onChangeText={setFormWhatsapp}
                placeholder="08xxxxxxxxxx"
                keyboardType="phone-pad"
                error={formErrors.whatsapp}
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
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <Check color={COLORS.white} size={16} />
                    <Text style={styles.saveButtonText}>Simpan Perubahan</Text>
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

  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
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