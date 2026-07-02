import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { disarmSocialCallback, isSocialCallbackArmed, setAuthTokens } from "../lib/auth/tokens";
import { apiClient } from "../lib/api/client";
import { registerDeviceForPushNotifications } from "../lib/notifications/push";
import { notifyError, notifySuccess } from "../lib/ui/notify";

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ access?: string; refresh?: string; verified?: string }>();

  useEffect(() => {
    let mounted = true;

    async function completeAuthCallback() {
      console.log("[auth-callback] params=", params);
      console.log("[auth-callback] armed=", await isSocialCallbackArmed());
      
      try {
        if (params.verified === "1") {
          if (!mounted) return;
          notifySuccess("Email verified", "Your account is verified. Please log in.");
          router.replace("/(auth)/login");
          return;
        }

        const access = typeof params.access === "string" ? params.access : "";
        const refresh = typeof params.refresh === "string" ? params.refresh : "";
        if (!access || !refresh) {
          if (!mounted) return;
          notifyError("Login failed", "Missing auth callback tokens.");
          router.replace("/(auth)/login");
          return;
        }

        // Reject if no active Google login attempt armed this callback
        const armed = await isSocialCallbackArmed();
        if (!armed) {
          if (!mounted) return;
          router.replace("/(auth)/login");
          return;
        }

        // Save tokens and set auth header
        await setAuthTokens(access, refresh);
        apiClient.defaults.headers.common.Authorization = `Bearer ${access}`;

        // Disarm BEFORE navigating so logout can't replay this
        await disarmSocialCallback();

        // Register push now that tokens are saved
        try {
          await registerDeviceForPushNotifications();
        } catch {}

        if (!mounted) return;
        notifySuccess("Login successful", "Welcome back.");
        router.replace("/(tabs)");
      } catch {
        if (!mounted) return;
        notifyError("Login failed", "Unable to complete Google login.");
        router.replace("/(auth)/login");
      }
    }

    void completeAuthCallback();
    return () => {
      mounted = false;
    };
  }, [params.access, params.refresh, params.verified, router]);

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" />
    </View>
  );
}