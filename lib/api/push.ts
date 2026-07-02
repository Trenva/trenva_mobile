import { apiClient } from "./client";
import { getAccessToken } from "../auth/tokens";

export async function registerPushToken(params: {
  token: string;
  platform?: string;
  deviceName?: string;
  appVersion?: string;
}) {
  const accessToken = await getAccessToken();
  const response = await apiClient.post("/api/push/register-token/", {
    token: params.token,
    platform: params.platform,
    device_name: params.deviceName,
    app_version: params.appVersion,
  }, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
  return response.data;
}

export async function unregisterPushToken(token: string) {
  const response = await apiClient.post("/api/push/unregister-token/", { token });
  return response.data;
}

export async function sendTestPush(title?: string, body?: string) {
  const response = await apiClient.post("/api/push/test/", { title, body });
  return response.data;
}
