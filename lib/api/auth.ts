import axios from "axios";
import { API_BASE_URL } from "./config";
import { apiClient } from "./client";
import { setAuthTokens } from "../auth/tokens";

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
};

type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

export type UserProfile = {
  id?: number;
  username?: string;
  email?: string;
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
    `${API_BASE_URL}/api/auth/token/`,
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
  const response = await axios.post(`${API_BASE_URL}/api/auth/register/`, payload, {
    timeout: 15000,
  });
  return response.data;
}

export async function checkEmailExists(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const response = await axios.get(`${API_BASE_URL}/api/check-email/`, {
      params: { email: normalizedEmail },
      timeout: 10000,
    });
    const value = response.data as { exists?: boolean; email_exists?: boolean };
    return Boolean(value.exists ?? value.email_exists);
  } catch {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/check-email/`,
        { email: normalizedEmail },
        { timeout: 10000 },
      );
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
  try {
    const response = await apiClient.patch<UserProfile>("/api/user/profile/", payload);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 405) {
      const response = await apiClient.put<UserProfile>("/api/user/profile/", payload);
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
