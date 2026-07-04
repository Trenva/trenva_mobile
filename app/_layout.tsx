import "../global.css";
import { lazy, Suspense, useEffect, useState } from "react";
import { Platform, View } from "react-native";
import { Stack } from "expo-router";
import { useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { enableScreens } from "react-native-screens";
import { useFonts } from "expo-font";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { AppToast } from "../components/ui/app-toast";
const TawkChatBubble = lazy(() => import("../components/chat/TawkChatBubble.native"));
import { fetchProfile, type UserProfile } from "../lib/api/auth";
import { getAccessToken } from "../lib/auth/tokens";
import { AppThemeProvider, useAppTheme } from "../lib/theme/theme-provider";
import { initPushNotificationLifecycleHandlers, registerDeviceForPushNotifications } from "../lib/notifications/push";

if (Platform.OS === "android" && Number(Platform.Version) <= 25) {
  enableScreens(false);
}

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

      // Never interfere with the auth-callback screen — it handles its own logic
      const isCallbackScreen = segments.some((s) => s === "auth-callback");
      if (isCallbackScreen) {
        setIsCheckingAuth(false);
        return;
      }

      const topLevel = segments[0] ?? "";
      const isAuthGroup = topLevel === "(auth)";
      const isProtectedGroup =
        topLevel === "(account)" ||
        topLevel === "(checkout-flow)";

      if (!token && isProtectedGroup) {
        router.replace("/(auth)/login");
      } else if (token && isAuthGroup) {
        router.replace("/(tabs)");
      }

      if (token) {
        void registerDeviceForPushNotifications();
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
  const router = useRouter();
  const segments = useSegments();
  const [chatUser, setChatUser] = useState<{ name?: string; email?: string }>({});
  const showChatBubble = shouldShowChatBubble(segments);
  const chatBottomOffset = segments[0] === "(tabs)" ? 82 : 24;

  useEffect(() => {
    const dispose = initPushNotificationLifecycleHandlers(() => {
      router.push("/notifications");
    });
    return dispose;
  }, [router]);

  useEffect(() => {
    let mounted = true;

    async function loadChatUser() {
      const token = await getAccessToken();
      if (!token) {
        if (mounted) setChatUser({});
        return;
      }

      try {
        const profile = await fetchProfile();
        if (!mounted) return;
        setChatUser({
          name: getProfileDisplayName(profile),
          email: typeof profile.email === "string" ? profile.email : undefined,
        });
      } catch {
        if (mounted) setChatUser({});
      }
    }

    void loadChatUser();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View className="flex-1">
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }} />
      <AppToast />
      {showChatBubble ? (
        <Suspense fallback={null}>
          <TawkChatBubble bottomOffset={chatBottomOffset} userName={chatUser.name} userEmail={chatUser.email} />
        </Suspense>
      ) : null}
    </View>
  );
}

function shouldShowChatBubble(segments: string[]) {
  const topLevel = segments[0] ?? "";
  if (topLevel === "(auth)" || topLevel === "(checkout-flow)") return false;
  if (segments.some((segment) => segment === "auth-callback")) return false;
  return true;
}

function getProfileDisplayName(profile: UserProfile) {
  const firstName = typeof profile.first_name === "string" ? profile.first_name : "";
  const lastName = typeof profile.last_name === "string" ? profile.last_name : "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  if (fullName) return fullName;
  return typeof profile.username === "string" ? profile.username : undefined;
}
