import type { Router } from "expo-router";
import { notifyInfo } from "./notify";

export function promptLoginRequired(router: Router, message = "Please sign in to continue.") {
  notifyInfo("Login required to continue", message);
  router.push("/(auth)/login");
}

