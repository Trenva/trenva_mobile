import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { registerPushToken } from "../api/push";

let initialized = false;
let registeredToken: string | null = null;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function getProjectId() {
  const fromExpoConfig = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId;
  const fromEasConfig = (Constants.easConfig as { projectId?: string } | null | undefined)?.projectId;
  return fromExpoConfig || fromEasConfig || undefined;
}

export async function registerDeviceForPushNotifications() {
  if (Platform.OS === "web") {
    console.log("[push] skip register: web platform");
    return null;
  }
  if (!Device.isDevice) {
    console.log("[push] skip register: not a physical device");
    return null;
  }

  const permission = await Notifications.getPermissionsAsync();
  let finalStatus = permission.status;
  console.log("[push] permission status (before request):", finalStatus);
  if (finalStatus !== "granted") {
    const request = await Notifications.requestPermissionsAsync();
    finalStatus = request.status;
    console.log("[push] permission status (after request):", finalStatus);
  }
  if (finalStatus !== "granted") {
    console.log("[push] skip register: permission not granted");
    return null;
  }

  const projectId = getProjectId();
  console.log("[push] resolved projectId:", projectId ?? "<none>");
  const expoToken = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  const token = expoToken.data;
  if (!token) {
    console.log("[push] failed: expo token is empty");
    return null;
  }
  console.log("[push] got expo token prefix:", token.slice(0, 24));

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
      enableVibrate: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF9F0A",
    });
  }

  try {
    const response = await registerPushToken({
      token,
      platform: Platform.OS,
      deviceName: Device.deviceName ?? undefined,
      appVersion: Constants.expoConfig?.version,
    });
    console.log("[push] backend register success:", response);
  } catch (error) {
    console.log("[push] backend register failed:", error);
    throw error;
  }

  registeredToken = token;
  return token;
}

export function initPushNotificationLifecycleHandlers(onOpenNotifications?: () => void) {
  if (initialized) return () => {};
  initialized = true;

  const responseSub = Notifications.addNotificationResponseReceivedListener(() => {
    onOpenNotifications?.();
  });

  return () => {
    responseSub.remove();
    initialized = false;
  };
}

export function getRegisteredPushToken() {
  return registeredToken;
}
