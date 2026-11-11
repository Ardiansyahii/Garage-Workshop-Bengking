import React, { useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Home, ClipboardList, User } from "lucide-react-native";

// expo-haptics bersifat opsional -> kalau belum ter-install, komponen tetap jalan tanpa getar
let Haptics = null;
try {
  Haptics = require("expo-haptics");
} catch (e) {
  Haptics = null;
}

// Warna konsisten dengan identitas aplikasi (putih, hitam, abu-abu)
const COLOR_ACTIVE = "#171717";
const COLOR_INACTIVE = "#9CA3AF";
const COLOR_BORDER = "#F1F1F1";

// ======== TAB SAMPING (Riwayat & Profile) ========
const SIDE_TABS = [
  { key: "riwayat", label: "Riwayat", icon: ClipboardList, route: "/RiwayatService" },
  { key: "profile", label: "Profile", icon: User, route: "/profile" },
];

const HOME_TAB = { key: "home", label: "Home", icon: Home, route: "/dashboard" };

function SideTabButton({ tab, isActive, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const activeAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(activeAnim, {
      toValue: isActive ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isActive]);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.92,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  };

  const indicatorScaleX = activeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
  const Icon = tab.icon;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={styles.tabBtn}
    >
      <Animated.View style={[styles.tabInner, { transform: [{ scale }] }]}>
        {/* Garis indikator aktif di atas ikon */}
        <Animated.View
          style={[
            styles.activeIndicator,
            { opacity: activeAnim, transform: [{ scaleX: indicatorScaleX }] },
          ]}
        />

        {/* Background abu-abu sangat muda untuk menu aktif */}
        <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
          <Icon
            size={22}
            color={isActive ? COLOR_ACTIVE : COLOR_INACTIVE}
            strokeWidth={isActive ? 2.3 : 1.9}
          />
        </View>
        <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// Tombol Home -> kini tampil sebagai tab biasa yang sejajar dengan tab lain
// (tidak lagi lingkaran mengambang), tetapi nama komponen & props tetap sama.
function HomeButton({ isActive, onPress }) {
  return <SideTabButton tab={HOME_TAB} isActive={isActive} onPress={onPress} />;
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
      style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 8) }]}
      pointerEvents="box-none"
    >
      <View style={styles.innerRow}>
        <SideTabButton
          tab={SIDE_TABS[0]}
          isActive={currentTab === SIDE_TABS[0].key}
          onPress={() => handlePress(SIDE_TABS[0])}
        />

        <HomeButton isActive={currentTab === HOME_TAB.key} onPress={() => handlePress(HOME_TAB)} />

        <SideTabButton
          tab={SIDE_TABS[1]}
          isActive={currentTab === SIDE_TABS[1].key}
          onPress={() => handlePress(SIDE_TABS[1])}
        />
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
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: COLOR_BORDER,
    paddingTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: -4 },
      },
      default: { elevation: 16 },
    }),
  },
  innerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 12,
    height: 62,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  tabInner: {
    alignItems: "center",
    gap: 2,
    minWidth: 64,
  },
  activeIndicator: {
    position: "absolute",
    top: -10,
    width: 22,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLOR_ACTIVE,
  },
  iconWrap: {
    width: 46,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  iconWrapActive: {
    backgroundColor: "#F4F4F5",
  },
  tabLabel: {
    fontSize: 10.5,
    fontWeight: "500",
    color: COLOR_INACTIVE,
  },
  tabLabelActive: {
    fontWeight: "700",
    color: COLOR_ACTIVE,
  },
});