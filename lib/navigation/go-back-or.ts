import { Platform } from "react-native";
import type { Href } from "expo-router";

type RouterLike = {
  back: () => void;
  replace: (href: Href) => void;
};

export function goBackOr(router: RouterLike, fallback: Href = "/(tabs)") {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.replace(fallback);
    return;
  }

  router.back();
}

