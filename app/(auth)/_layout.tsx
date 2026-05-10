import { Stack } from "expo-router";
import { AppThemeProvider } from "../../lib/theme/theme-provider";

export default function AuthLayout() {
  return (
    <AppThemeProvider forcedMode="light">
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
      </Stack>
    </AppThemeProvider>
  );
}
