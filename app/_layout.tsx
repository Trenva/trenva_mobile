import "../global.css";
import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { AppToast } from "../components/ui/app-toast";
import { getAccessToken } from "../lib/auth/tokens";
import { AppThemeProvider, useAppTheme } from "../lib/theme/theme-provider";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });
  const segments = useSegments();
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function guardRoutes() {
      const token = await getAccessToken();
      if (!mounted) return;

      const topLevel = segments[0] ?? "";
      const isAuthGroup = topLevel === "(auth)";
      const isProtectedGroup =
        topLevel === "(tabs)" ||
        topLevel === "(account)" ||
        topLevel === "(checkout-flow)" ||
        topLevel === "(support)";

      if (!token && isProtectedGroup) {
        router.replace("/(auth)/login");
      } else if (token && isAuthGroup) {
        router.replace("/(tabs)");
      }

      setIsCheckingAuth(false);
    }

    void guardRoutes();
    return () => {
      mounted = false;
    };
  }, [router, segments]);

  if (!fontsLoaded || isCheckingAuth) {
    return null;
  }

  return (
    <AppThemeProvider>
      <SafeAreaProvider>
        <LayoutContent />
      </SafeAreaProvider>
    </AppThemeProvider>
  );
}

function LayoutContent() {
  const { mode } = useAppTheme();

  return (
    <>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }} />
      <AppToast />
    </>
  );
}
