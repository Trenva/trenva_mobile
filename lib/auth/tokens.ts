import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "trenva_access_token";
const REFRESH_TOKEN_KEY = "trenva_refresh_token";
const ACCESS_TOKEN_WEB_KEY = "trenva_access_token_web";
const REFRESH_TOKEN_WEB_KEY = "trenva_refresh_token_web";

function getWebStorage() {
  if (typeof globalThis === "undefined" || !("localStorage" in globalThis)) {
    return null;
  }
  return globalThis.localStorage;
}

export async function getAccessToken() {
  try {
    const secureToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    if (secureToken) return secureToken;
    return getWebStorage()?.getItem(ACCESS_TOKEN_WEB_KEY) ?? null;
  } catch {
    return getWebStorage()?.getItem(ACCESS_TOKEN_WEB_KEY) ?? null;
  }
}

export async function getRefreshToken() {
  try {
    const secureToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    if (secureToken) return secureToken;
    return getWebStorage()?.getItem(REFRESH_TOKEN_WEB_KEY) ?? null;
  } catch {
    return getWebStorage()?.getItem(REFRESH_TOKEN_WEB_KEY) ?? null;
  }
}

export async function setAuthTokens(accessToken: string, refreshToken: string) {
  const storage = getWebStorage();
  storage?.setItem(ACCESS_TOKEN_WEB_KEY, accessToken);
  storage?.setItem(REFRESH_TOKEN_WEB_KEY, refreshToken);

  try {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  } catch {
    // Web storage is already updated above.
  }
}

export async function clearAuthTokens() {
  const storage = getWebStorage();
  storage?.removeItem(ACCESS_TOKEN_WEB_KEY);
  storage?.removeItem(REFRESH_TOKEN_WEB_KEY);

  try {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    ]);
  } catch {
    // Web storage is already cleared above.
  }
}
