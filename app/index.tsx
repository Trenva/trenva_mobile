import { useEffect } from "react";
import { Image, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { getAccessToken } from "../lib/auth/tokens";
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const cartLogo = require("../assets/cart-logo.png");
const nameLogo = require("../assets/name-logo.png");

export default function SplashScreen() {
  const router = useRouter();
  const cartOpacity = useSharedValue(1);
  const cartScale = useSharedValue(0.72);
  const logoOpacity = useSharedValue(0);
  const backgroundProgress = useSharedValue(0);

  useEffect(() => {
    cartScale.value = withSequence(
      withTiming(0.72, {
        duration: 450,
        easing: Easing.out(Easing.quad),
      }),
      withTiming(1.2, {
        duration: 550,
        easing: Easing.out(Easing.cubic),
      })
    );

    cartOpacity.value = withDelay(
      1050,
      withTiming(0, {
        duration: 160,
        easing: Easing.inOut(Easing.quad),
      })
    );

    logoOpacity.value = withDelay(
      1180,
      withTiming(1, {
        duration: 220,
        easing: Easing.out(Easing.quad),
      })
    );

    backgroundProgress.value = withDelay(
      2200,
      withTiming(1, {
        duration: 320,
        easing: Easing.inOut(Easing.quad),
      })
    );

    const timer = setTimeout(() => {
      void (async () => {
        const token = await getAccessToken();
        if (token) {
          router.replace("/(tabs)");
          return;
        }
        router.replace("/(auth)/onboarding");
      })();
    }, 3100);

    return () => clearTimeout(timer);
  }, [backgroundProgress, cartOpacity, cartScale, logoOpacity, router]);

  const containerStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      backgroundProgress.value,
      [0, 1],
      ["#000000", "#FF9B00"]
    ),
  }));

  const cartStyle = useAnimatedStyle(() => ({
    opacity: cartOpacity.value,
    transform: [{ scale: cartScale.value }],
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <StatusBar style="light" />

      <Animated.View style={[styles.centered, cartStyle]}>
        <Image source={cartLogo} style={styles.cartLogo} resizeMode="contain" />
      </Animated.View>

      <Animated.View style={[styles.centered, logoStyle]}>
        <Image source={nameLogo} style={styles.nameLogo} resizeMode="contain" />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000",
  },
  centered: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  cartLogo: {
    width: 60,
    height: 58,
  },
  nameLogo: {
    width: 450,
    height: 200,
  },
});
