import { useState } from "react";
import * as Linking from "expo-linking";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  AuthCard,
  AuthField,
  AuthHeader,
  Checkbox,
  Divider,
  EyeIcon,
  GoogleButton,
  PrimaryButton,
} from "../../components/ui/auth-ui";
import { getApiErrorMessage } from "../../lib/api/errors";
import { buildGoogleSocialLoginUrl, login } from "../../lib/api/auth";
import { armSocialCallback } from "../../lib/auth/tokens";
import { registerDeviceForPushNotifications } from "../../lib/notifications/push";
import { notifyError, notifySuccess } from "../../lib/ui/notify";

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  async function handleLogin() {
    if (isSubmitting) {
      return;
    }

    if (!email.trim() || !password.trim()) {
      notifyError("Missing fields", "Please enter your email/username and password.");
      return;
    }

    try {
      setIsSubmitting(true);
      await login({
        usernameOrEmail: email.trim(),
        password,
      });
      try {
        await registerDeviceForPushNotifications();
      } catch {}
      notifySuccess("Login successful", "Welcome back.");
      router.replace("/(tabs)");
    } catch (error) {
      notifyError("Login failed", getApiErrorMessage(error, "Unable to sign in right now."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    if (isGoogleSubmitting) return;
    try {
      setIsGoogleSubmitting(true);
      await armSocialCallback();
      const loginUrl = buildGoogleSocialLoginUrl();
      await Linking.openURL(loginUrl);
    } catch {
      notifyError("Google sign-in failed", "Unable to open Google sign-in right now.");
    } finally {
      setIsGoogleSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-100"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
    >
      <StatusBar style="light" />
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={{ flexGrow: 1, paddingBottom: Math.max(insets.bottom + 140, 180) }}
      >
        <AuthHeader
          title={"Sign in to your\nAccount"}
          subtitle="Enter your email and password to log in"
        />

        <AuthCard>
          <GoogleButton title={isGoogleSubmitting ? "Opening Google..." : "Continue with Google"} onPress={() => void handleGoogleLogin()} />
          <Divider text="Or login with" />

          <AuthField
            value={email}
            onChangeText={setEmail}
            placeholder="akbeth@gmail.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <AuthField
            value={password}
            onChangeText={setPassword}
            placeholder="*******"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            rightIcon={
              <Pressable onPress={() => setShowPassword((value) => !value)}>
                <EyeIcon open={showPassword} />
              </Pressable>
            }
          />

          <View className="mb-6 flex-row items-center justify-between">
            <Checkbox
              checked={rememberMe}
              onPress={() => setRememberMe((value) => !value)}
              label="Remember me"
            />

            <Pressable onPress={() => router.push("/forgot-password")}>
              <Text className="text-[15px] font-semibold leading-5 text-primary">
                Forgot Password ?
              </Text>
            </Pressable>
          </View>

          <PrimaryButton title={isSubmitting ? "Logging in..." : "Log In"} onPress={handleLogin} />

          <View className="mt-4 px-2">
            <Text className="text-center text-[12px] leading-5 text-gray-500">
              By continuing, you agree to our{" "}
              <Text
                className="font-semibold text-primary"
                onPress={() => router.push({ pathname: "/help-content", params: { type: "terms" } })}
              >
                Terms of Use
              </Text>
              {" "}and{" "}
              <Text
                className="font-semibold text-primary"
                onPress={() => router.push({ pathname: "/help-content", params: { type: "privacy" } })}
              >
                Privacy Policy
              </Text>
              .
            </Text>
          </View>

          <View className="mt-[22px] flex-row items-center justify-center gap-1.5">
            <Text className="text-[15px] leading-5 text-gray-500">
              Don&apos;t have an account?
            </Text>
            <Pressable onPress={() => router.push("/(auth)/signup")}>
              <Text className="text-[15px] font-bold leading-5 text-primary">
                Sign Up
              </Text>
            </Pressable>
          </View>
        </AuthCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
