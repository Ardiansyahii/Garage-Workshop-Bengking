import React, { useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { Home, ClipboardList, PlusCircle } from "lucide-react-native";

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

// ======== DAFTAR TAB ========
// route disesuaikan dengan struktur expo-router kamu. Ubah kalau path-nya beda.
const TABS = [
  { key: "home", label: "Home", icon: Home, route: "/dashboard" },
  { key: "booking", label: "Booking", icon: PlusCircle, route: "/booking", elevated: true },
  { key: "riwayat", label: "Riwayat", icon: ClipboardList, route: "/RiwayatService" },
];

function TabButton({ tab, isActive, onPress }) {
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

  // Tombol tengah (Booking) -> "orb" kaca mengambang, ala kamera/kontrol iOS 26
  if (tab.elevated) {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={styles.elevatedWrap}
      >
        <Animated.View style={[styles.elevatedGlow, { transform: [{ scale }] }]}>
          <BlurView intensity={40} tint="light" style={styles.elevatedBlur}>
            <LinearGradient
              colors={["rgba(255,255,255,0.55)", "rgba(255,255,255,0.06)"]}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.elevatedTint} />
            <View style={styles.elevatedSpecular} />
            <Icon size={25} color="#FFFFFF" strokeWidth={2.4} />
          </BlurView>
        </Animated.View>
        <Text style={styles.elevatedLabel}>{tab.label}</Text>
      </TouchableOpacity>
    );
  }

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
          <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFillObject}>
            <LinearGradient
              colors={["rgba(255,255,255,0.35)", "rgba(255,255,255,0.02)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
          </BlurView>
        </Animated.View>

        <Icon size={22} color={isActive ? "#ff5b5b" : "#a1a1aa"} strokeWidth={isActive ? 2.4 : 2} />
        <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function BottomNavBar({ activeTab }) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const currentTab =
    activeTab || TABS.find((t) => pathname?.startsWith(t.route))?.key || "home";

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
          intensity={Platform.OS === "ios" ? 65 : 100}
          tint="dark"
          style={styles.blurContainer}
        >
          {/* Lapisan tint gelap tipis supaya kontras ikon tetap terjaga */}
          <View style={styles.darkTint} />

          {/* Specular highlight di tepi atas -> ciri khas liquid glass */}
          <LinearGradient
            colors={["rgba(255,255,255,0.30)", "rgba(255,255,255,0.0)"]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={styles.topSheen}
          />

          {/* Border tipis terang di seluruh tepi kaca */}
          <View style={styles.glassBorder} pointerEvents="none" />

          <View style={styles.innerRow}>
            {TABS.map((tab) => (
              <TabButton
                key={tab.key}
                tab={tab}
                isActive={currentTab === tab.key}
                onPress={() => handlePress(tab)}
              />
            ))}
          </View>
        </BlurView>
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
  },
  blurContainer: {
    borderRadius: 30,
    overflow: "hidden",
  },
  darkTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor:
      Platform.OS === "android" ? "rgba(9,9,11,0.82)" : "rgba(9,9,11,0.30)",
  },
  topSheen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "55%",
  },
  glassBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },
  innerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 10,
    paddingHorizontal: 8,
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
    borderColor: "rgba(255,255,255,0.25)",
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#a1a1aa",
  },
  tabLabelActive: {
    color: "#ff5b5b",
  },
  elevatedWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -26,
    gap: 4,
  },
  elevatedGlow: {
    width: 58,
    height: 58,
    borderRadius: 29,
    shadowColor: "#ef4444",
    shadowOpacity: 0.55,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  elevatedBlur: {
    flex: 1,
    borderRadius: 29,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.45)",
  },
  elevatedTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(220,38,38,0.55)",
  },
  elevatedSpecular: {
    position: "absolute",
    top: 4,
    left: 10,
    width: 20,
    height: 10,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.55)",
    transform: [{ rotate: "-20deg" }],
  },
  elevatedLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#ff5b5b",
  },
});