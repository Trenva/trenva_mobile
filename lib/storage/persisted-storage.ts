// lib/storage/persisted-storage.ts
import * as SecureStore from "expo-secure-store";
import type { StateStorage } from "zustand/middleware";

// Shared storage adapter for zustand's `persist` middleware. Mirrors the
// pattern in lib/theme/theme-provider.tsx: SecureStore on native, localStorage
// on web. Used by any store that needs to survive app reloads/refreshes.
function getWebStorage(): Storage | null {
  if (typeof globalThis === "undefined" || !("localStorage" in globalThis)) return null;
  return globalThis.localStorage;
}

export const persistedStorage: StateStorage = {
  getItem: async (name) => {
    const webStorage = getWebStorage();
    if (webStorage) return webStorage.getItem(name);
    try {
      return await SecureStore.getItemAsync(name);
    } catch {
      return null;
    }
  },
  setItem: async (name, value) => {
    const webStorage = getWebStorage();
    if (webStorage) {
      webStorage.setItem(name, value);
      return;
    }
    try {
      await SecureStore.setItemAsync(name, value);
    } catch {
      // Ignore storage failures and keep the in-memory value.
    }
  },
  removeItem: async (name) => {
    const webStorage = getWebStorage();
    if (webStorage) {
      webStorage.removeItem(name);
      return;
    }
    try {
      await SecureStore.deleteItemAsync(name);
    } catch {
      // Ignore storage failures.
    }
  },
};