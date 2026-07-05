import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import * as SecureStore from "expo-secure-store";

export type ThemePreference = "light" | "dark" | "system";
export type ThemeMode = "light" | "dark";

type ThemeColors = {
  background: string;
  card: string;
  elevated: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  success: string;
  successSoft: string;
  error: string;
  errorSoft: string;
  info: string;
  infoSoft: string;
};

type ThemeContextValue = {
  preference: ThemePreference;
  mode: ThemeMode;
  colors: ThemeColors;
  setPreference: (next: ThemePreference) => Promise<void>;
};

const STORAGE_KEY = "theme-preference-v1";

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getWebStorage(): Storage | null {
  if (typeof globalThis === "undefined" || !("localStorage" in globalThis)) return null;
  return globalThis.localStorage;
}

async function loadStoredPreference(): Promise<ThemePreference | null> {
  const webStorage = getWebStorage();
  if (webStorage) {
    const stored = webStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
    return null;
  }

  try {
    const stored = await SecureStore.getItemAsync(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
  } catch {
    // Ignore storage errors and fall back to default.
  }
  return null;
}

async function persistPreference(next: ThemePreference): Promise<void> {
  const webStorage = getWebStorage();
  if (webStorage) {
    webStorage.setItem(STORAGE_KEY, next);
    return;
  }
  await SecureStore.setItemAsync(STORAGE_KEY, next);
}

function colorsForMode(mode: ThemeMode): ThemeColors {
  if (mode === "dark") {
    return {
      background: "#111315",
      card: "#1A1D21",
      elevated: "#242931",
      text: "#F3F4F6",
      textMuted: "#B5BBC5",
      border: "#303743",
      primary: "#FF9F0A",
      success: "#4ADE80",
      successSoft: "#193125",
      error: "#F87171",
      errorSoft: "#3A1D1D",
      info: "#60A5FA",
      infoSoft: "#1B2A3E",
    };
  }

  return {
    background: "#F8F9FA",
    card: "#FFFFFF",
    elevated: "#F3F4F6",
    text: "#2D2D2D",
    textMuted: "#6B7280",
    border: "#E5E7EB",
    primary: "#FF9F0A",
    success: "#3AB26F",
    successSoft: "#EAF9F0",
    error: "#E35D5D",
    errorSoft: "#FDEEEE",
    info: "#5C8EF2",
    infoSoft: "#EEF4FF",
  };
}

export function AppThemeProvider({
  children,
  forcedMode,
}: {
  children: ReactNode;
  forcedMode?: ThemeMode;
}) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("light");

  useEffect(() => {
    let mounted = true;
    async function loadPreference() {
      try {
        const stored = await loadStoredPreference();
        if (!mounted) return;
        if (stored) {
          setPreferenceState(stored);
        }
      } catch {
        // Keep default preference.
      }
    }
    void loadPreference();
    return () => {
      mounted = false;
    };
  }, []);

  const resolvedMode: ThemeMode = preference === "system" ? (systemScheme === "dark" ? "dark" : "light") : preference;
  const mode: ThemeMode = forcedMode ?? resolvedMode;
  const colors = useMemo(() => colorsForMode(mode), [mode]);

  async function setPreference(next: ThemePreference) {
    setPreferenceState(next);
    try {
      await persistPreference(next);
    } catch {
      // Ignore storage failures and keep in-memory preference.
    }
  }

  const value = useMemo(
    () => ({ preference, mode, colors, setPreference }),
    [preference, mode, colors],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used within AppThemeProvider");
  }
  return context;
}
