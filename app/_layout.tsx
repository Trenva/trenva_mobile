import "../global.css";
import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AppToast } from "../components/ui/app-toast";
import { getAccessToken } from "../lib/auth/tokens";

export default function RootLayout() {
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

  if (isCheckingAuth) {
    return null;
  }

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(account)" />
        <Stack.Screen name="(checkout-flow)" />
        <Stack.Screen name="(support)" />
        <Stack.Screen name="(discover)" />
        <Stack.Screen name="category" />
        <Stack.Screen name="product" />
      </Stack>
      <AppToast />
    </>
  );
}
