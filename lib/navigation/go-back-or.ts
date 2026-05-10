import { Platform } from "react-native";
import type { Href } from "expo-router";

type RouterLike = {
  back: () => void;
  replace: (href: Href) => void;
  canGoBack?: () => boolean;
};

export function goBackOr(router: RouterLike, fallback: Href = "/(tabs)") {
  const canGoBack = typeof router.canGoBack === "function" ? router.canGoBack() : false;

  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.replace(fallback);
    return;
  }

  if (canGoBack) {
    router.back();
    return;
  }

  router.replace(fallback);
}
