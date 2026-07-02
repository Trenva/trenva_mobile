import axios from "axios";
import * as Linking from "expo-linking";
import { API_BASE_URL } from "./config";
import { apiClient } from "./client";
import { isSocialCallbackArmed, setAuthTokens } from "../auth/tokens";

type LoginPayload = {
  usernameOrEmail: string;
  password: string;
};

type RegisterPayload = {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  bio: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  phone_number?: string;
};

type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

type PasswordResetRequestPayload = {
  email: string;
};

type PasswordResetConfirmPayload = {
  token: string;
  newPassword: string;
  confirmPassword: string;
};

export type UserProfile = {
  id?: number;
  username?: string;
  email?: string;
  image?: string;
  profile_image?: string;
  avatar?: string;
  photo?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  phone_number?: string;
  gender?: string;
  date_of_birth?: string;
  dob?: string;
  [key: string]: unknown;
};

export async function login(payload: LoginPayload) {
  const response = await axios.post(
    `${API_BASE_URL}/api/mobile-auth/token/`,
    {
      email: payload.usernameOrEmail,
      username: payload.usernameOrEmail,
      password: payload.password,
    },
    { timeout: 15000 },
  );

  const access = response.data?.access as string | undefined;
  const refresh = response.data?.refresh as string | undefined;

  if (!access || !refresh) {
    throw new Error("Login response did not include tokens.");
  }

  await setAuthTokens(access, refresh);
  apiClient.defaults.headers.common.Authorization = `Bearer ${access}`;
  return response.data;
}

export async function register(payload: RegisterPayload) {
  const response = await axios.post(`${API_BASE_URL}/api/mobile-auth/register/`, payload, {
    timeout: 15000,
  });
  return response.data;
}

export async function checkEmailExists(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/check-email/`,
      { email: normalizedEmail },
      { timeout: 10000 },
    );
    const value = response.data as { exists?: boolean; email_exists?: boolean };
    return Boolean(value.exists ?? value.email_exists);
  } catch {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/check-email/`, {
        params: { email: normalizedEmail },
        timeout: 10000,
      });
      const value = response.data as { exists?: boolean; email_exists?: boolean };
      return Boolean(value.exists ?? value.email_exists);
    } catch {
      return false;
    }
  }
}

export async function fetchProfile() {
  const response = await apiClient.get<UserProfile>("/api/user/profile/");
  return response.data;
}

export async function updateProfile(payload: Partial<UserProfile>) {
  const safePayload: Partial<UserProfile> = { ...payload };
  delete safePayload.email;
  delete safePayload.gender;

  try {
    const response = await apiClient.patch<UserProfile>("/api/user/profile/", safePayload);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 405) {
      const response = await apiClient.put<UserProfile>("/api/user/profile/", safePayload);
      return response.data;
    }
    throw error;
  }
}

export async function changePassword(payload: ChangePasswordPayload) {
  const response = await apiClient.post("/api/user/change-password/", {
    current_password: payload.currentPassword,
    old_password: payload.currentPassword,
    new_password: payload.newPassword,
    confirm_password: payload.confirmNewPassword,
    confirm_new_password: payload.confirmNewPassword,
  });
  return response.data;
}

export async function requestPasswordReset(payload: PasswordResetRequestPayload) {
  const response = await axios.post(
    `${API_BASE_URL}/api/auth/password-reset/`,
    { email: payload.email.trim().toLowerCase() },
    { timeout: 15000 },
  );
  return response.data as { success?: boolean; message?: string; error?: string };
}

export async function resetPasswordWithToken(payload: PasswordResetConfirmPayload) {
  const response = await axios.post(
    `${API_BASE_URL}/api/auth/password-reset-mobile-confirm/`,
    {
      token: payload.token,
      new_password: payload.newPassword,
      confirm_password: payload.confirmPassword,
    },
    { timeout: 15000 },
  );
  return response.data as { success?: boolean; message?: string; error?: string };
}

type SocialBridgeTokens = { access: string; refresh: string };

async function ensurePushRegistrationAfterAuth() {
  const { registerDeviceForPushNotifications } = await import("../notifications/push");
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const token = await registerDeviceForPushNotifications();
      console.log("[auth-social] push register attempt", attempt, "token?", Boolean(token));
      if (token) return true;
    } catch (error) {
      lastError = error;
      console.log("[auth-social] push register failed attempt", attempt, error);
    }
    await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
  }
  if (lastError) {
    throw lastError;
  }
  return false;
}

function parseSocialBridgeUrl(url: string): SocialBridgeTokens | null {
  const parsed = Linking.parse(url);
  const path = (parsed.path ?? "").replace(/^\/+/, "");
  const host = (parsed.hostname ?? "").replace(/^\/+/, "");
  const routeKey = path || host;
  if (routeKey !== "auth-callback") return null;
  const params = parsed.queryParams ?? {};
  const access = typeof params.access === "string" ? params.access : "";
  const refresh = typeof params.refresh === "string" ? params.refresh : "";
  if (!access || !refresh) return null;
  return { access, refresh };
}

export async function consumeSocialBridgeUrl(url: string) {
  // Only process URLs that look like our auth callback
  const tokens = parseSocialBridgeUrl(url);
  if (!tokens) return false;

  // Reject replayed deep links — must have been armed by an active Google login attempt
  const armed = await isSocialCallbackArmed();
  if (!armed) return false;

  await setAuthTokens(tokens.access, tokens.refresh);
  apiClient.defaults.headers.common.Authorization = `Bearer ${tokens.access}`;
  try {
    await ensurePushRegistrationAfterAuth();
  } catch (error) {
    console.log("[auth-social] push registration gave up", error);
  }
  return true;
}

export function buildGoogleSocialLoginUrl() {
  const callback = "trenva:///auth-callback";
  const rootBase = API_BASE_URL.endsWith("/ng") ? API_BASE_URL.slice(0, -3) : API_BASE_URL;
  return `${rootBase}/ng/api/auth/mobile-google-login/?mobile_callback=${encodeURIComponent(callback)}`;
}