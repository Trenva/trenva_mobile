import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
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
import { login } from "../../lib/api/auth";
import { notifyError, notifySuccess } from "../../lib/ui/notify";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      notifySuccess("Login successful", "Welcome back.");
      router.replace("/(tabs)");
    } catch (error) {
      notifyError("Login failed", getApiErrorMessage(error, "Unable to sign in right now."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-100"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style="light" />
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 28 }}
      >
        <AuthHeader
          title={"Sign in to your\nAccount"}
          subtitle="Enter your email and password to log in"
        />

        <AuthCard>
          <GoogleButton title="Continue with Google" />
          <Divider text="Or login with" />

          <AuthField
            value={email}
            onChangeText={setEmail}
            placeholder="Loisbceket@gmail.com"
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

            <Pressable>
              <Text className="text-[15px] font-semibold leading-5 text-primary">
                Forgot Password ?
              </Text>
            </Pressable>
          </View>

          <PrimaryButton title={isSubmitting ? "Logging in..." : "Log In"} onPress={handleLogin} />

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
