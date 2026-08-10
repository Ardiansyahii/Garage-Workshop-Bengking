import React, { useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { Home, ClipboardList, User } from "lucide-react-native";

// expo-haptics bersifat opsional -> kalau belum ter-install, komponen tetap jalan tanpa getar
let Haptics = null;
try {
  Haptics = require("expo-haptics");
} catch (e) {
  Haptics = null;
}

// expo-linear-gradient dipakai untuk kilau/specular highlight khas liquid glass.
// Kalau belum ter-install, kita fallback ke View transparan biasa (tetap jalan).
let LinearGradient = View;
try {
  LinearGradient = require("expo-linear-gradient").LinearGradient;
} catch (e) {
  LinearGradient = View;
}

// Ukuran lingkaran tombol Home. Diameter ini yang menentukan seberapa besar
// bagian yang "nongol" keluar dari tepi atas bar.
const HOME_SIZE = 64;

// ======== TAB SAMPING (Riwayat & Profile) ========
// Home TIDAK dimasukkan ke daftar ini karena dirender terpisah sebagai
// lingkaran mengambang (lihat komponen HomeButton di bawah), supaya tidak
// ke-clip oleh overflow:hidden milik bar.
const SIDE_TABS = [
  { key: "riwayat", label: "Riwayat", icon: ClipboardList, route: "/RiwayatService" },
  { key: "profile", label: "Profile", icon: User, route: "/profile" },
];

const HOME_TAB = { key: "home", label: "Home", icon: Home, route: "/dashboard" };

function SideTabButton({ tab, isActive, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const lift = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const pillOpacity = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const pillScale = useRef(new Animated.Value(isActive ? 1 : 0.6)).current;

  useEffect(() => {
    Animated.spring(lift, {
      toValue: isActive ? 1 : 0,
      useNativeDriver: true,
      speed: 16,
      bounciness: 8,
    }).start();
    Animated.spring(pillScale, {
      toValue: isActive ? 1 : 0.6,
      useNativeDriver: true,
      speed: 16,
      bounciness: 10,
    }).start();
    Animated.timing(pillOpacity, {
      toValue: isActive ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [isActive]);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.86,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 18,
      bounciness: 9,
    }).start();
  };

  const translateY = lift.interpolate({ inputRange: [0, 1], outputRange: [0, -3] });
  const Icon = tab.icon;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={styles.tabBtn}
    >
      <Animated.View style={[styles.tabInner, { transform: [{ scale }, { translateY }] }]}>
        {/* Pil kaca yang muncul di belakang ikon saat tab aktif */}
        <Animated.View
          style={[
            styles.activePill,
            {
              opacity: pillOpacity,
              transform: [{ scale: pillScale }],
            },
          ]}
        >
          <BlurView
            intensity={30}
            tint="dark"
            experimentalBlurMethod={Platform.OS === "android" ? "dimezisBlurView" : undefined}
            style={StyleSheet.absoluteFillObject}
          >
            <View style={styles.activePillTint} />
          </BlurView>
        </Animated.View>

        <Icon size={22} color={isActive ? "#ff5b5b" : "#a1a1aa"} strokeWidth={isActive ? 2.4 : 2} />
        <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// Tombol Home -> lingkaran kaca yang mengambang DI LUAR bar (bukan child dari
// BlurView yang overflow:hidden), makanya bisa beneran keluar setengah dari
// tepi atas bar tanpa kepotong.
function HomeButton({ onPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.88,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 18,
      bounciness: 9,
    }).start();
  };

  return (
    <View style={styles.homeFloatWrap} pointerEvents="box-none">
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <Animated.View style={[styles.homeGlow, { transform: [{ scale }] }]}>
          <BlurView
            intensity={40}
            tint="dark"
            experimentalBlurMethod={Platform.OS === "android" ? "dimezisBlurView" : undefined}
            style={styles.homeBlur}
          >
            <View style={styles.homeTint} />
            <Home size={27} color="#FFFFFF" strokeWidth={2.4} />
          </BlurView>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

export default function BottomNavBar({ activeTab }) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const currentTab =
    activeTab ||
    [...SIDE_TABS, HOME_TAB].find((t) => pathname?.startsWith(t.route))?.key ||
    "home";

  const handlePress = (tab) => {
    if (Haptics?.impactAsync) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        // abaikan kalau haptics tidak didukung device
      }
    }
    if (currentTab !== tab.key) {
      router.push(tab.route);
    }
  };

  return (
    <View
      style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 10) }]}
      pointerEvents="box-none"
    >
      <View style={styles.glassShadowWrap}>
        <BlurView
          intensity={Platform.OS === "ios" ? 65 : 90}
          tint="dark"
          // WAJIB untuk Android: tanpa prop ini BlurView TIDAK benar-benar blur,
          // dia cuma jadi layer transparan datar.
          // Catatan: method native ini butuh custom dev build / EAS build,
          // TIDAK akan aktif di Expo Go biasa.
          experimentalBlurMethod={Platform.OS === "android" ? "dimezisBlurView" : undefined}
          style={styles.blurContainer}
        >
          {/* Lapisan tint gelap tipis supaya kontras ikon tetap terjaga. */}
          <View style={styles.darkTint} />

          {/* Lapisan warna halus permanen -> supaya kaca tetap terlihat "hidup" */}
          <LinearGradient
            colors={["rgba(239,68,68,0.10)", "rgba(120,120,255,0.05)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          <View style={styles.innerRow}>
            <SideTabButton
              tab={SIDE_TABS[0]}
              isActive={currentTab === SIDE_TABS[0].key}
              onPress={() => handlePress(SIDE_TABS[0])}
            />

            {/* Spacer kosong seukuran tombol Home, supaya 2 tab samping tetap
                simetris kiri-kanan walau tombol Home dirender terpisah di luar. */}
            <View style={styles.homeSpacer} />

            <SideTabButton
              tab={SIDE_TABS[1]}
              isActive={currentTab === SIDE_TABS[1].key}
              onPress={() => handlePress(SIDE_TABS[1])}
            />
          </View>
        </BlurView>

        {/* Dirender SETELAH BlurView (bukan di dalamnya) supaya tidak ke-clip
            oleh overflow:hidden milik bar -> ini yang bikin lingkarannya bisa
            beneran nongol keluar setengah dari tepi atas bar. */}
        <HomeButton onPress={() => handlePress(HOME_TAB)} />
        <Text style={styles.homeLabel}>{HOME_TAB.label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 10,
  },
  glassShadowWrap: {
    marginHorizontal: 16,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 14,
    // relative supaya HomeButton (position: absolute) bisa diposisikan
    // relatif terhadap bar ini, bukan terhadap layar.
    position: "relative",
  },
  blurContainer: {
    borderRadius: 30,
    overflow: "hidden",
  },
  darkTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor:
      Platform.OS === "android" ? "rgba(9,9,11,0.28)" : "rgba(9,9,11,0.16)",
  },
  innerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  homeSpacer: {
    width: HOME_SIZE,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  tabInner: {
    alignItems: "center",
    gap: 3,
  },
  activePill: {
    position: "absolute",
    top: -8,
    width: 52,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.30)",
  },
  activePillTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(239,68,68,0.12)",
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#a1a1aa",
  },
  tabLabelActive: {
    color: "#ff5b5b",
  },

  // ---- Tombol Home mengambang (di luar bar) ----
  homeFloatWrap: {
    position: "absolute",
    // Naik setengah tinggi lingkaran dari tepi atas bar -> setengah lingkaran
    // ada DI ATAS bar (nongol keluar), setengah lagi menutupi bar.
    top: -(HOME_SIZE / 2),
    left: 0,
    right: 0,
    alignItems: "center",
  },
  homeGlow: {
    width: HOME_SIZE,
    height: HOME_SIZE,
    borderRadius: HOME_SIZE / 2,
    shadowColor: "#ef4444",
    shadowOpacity: 0.55,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  homeBlur: {
    flex: 1,
    borderRadius: HOME_SIZE / 2,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(239,68,68,0.5)",
  },
  homeTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(220,38,38,0.55)",
  },
  homeLabel: {
    position: "absolute",
    top: HOME_SIZE / 2 + 4,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 10,
    fontWeight: "700",
    color: "#ff5b5b",
  },
});