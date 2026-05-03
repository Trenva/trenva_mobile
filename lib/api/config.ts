import Constants from "expo-constants";

const extraApiUrl = (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl;

export const API_BASE_URL = extraApiUrl ?? "https://trenva.store/ng";

