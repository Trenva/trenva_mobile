import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { goBackOr } from "../../lib/navigation/go-back-or";
import { AuthCard, AuthField, AuthHeader, EyeIcon, PrimaryButton } from "../../components/ui/auth-ui";
import { getApiErrorMessage } from "../../lib/api/errors";
import { resetPasswordWithToken } from "../../lib/api/auth";
import { notifyError, notifySuccess } from "../../lib/ui/notify";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ token?: string }>();
  const token = useMemo(() => String(params.token ?? "").trim(), [params.token]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!token) {
      notifyError("Invalid link", "Reset token is missing or invalid.");
      return;
    }
    if (!password || !confirmPassword) {
      notifyError("Missing fields", "Please fill both password fields.");
      return;
    }
    if (password.length < 8) {
      notifyError("Weak password", "Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      notifyError("Password mismatch", "Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await resetPasswordWithToken({
        token,
        newPassword: password,
        confirmPassword,
      });
      notifySuccess("Password reset successful", result?.message ?? "You can now log in with your new password.");
      router.replace("/(auth)/login");
    } catch (error) {
      notifyError("Reset failed", getApiErrorMessage(error, "Unable to reset password right now."));
    } finally {
      setIsSubmitting(false);
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
        contentContainerStyle={{ flexGrow: 1, paddingBottom: Math.max(insets.bottom + 120, 160) }}
      >
        <AuthHeader
          title="Reset Password"
          subtitle="Set a new password for your account."
          showBack
          onBackPress={() => goBackOr(router, "/(auth)/login")}
        />

        <AuthCard>
          <AuthField
            label="New Password"
            value={password}
            onChangeText={setPassword}
            placeholder="********"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            rightIcon={
              <Pressable onPress={() => setShowPassword((value) => !value)}>
                <EyeIcon open={showPassword} />
              </Pressable>
            }
          />

          <AuthField
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="********"
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            rightIcon={
              <Pressable onPress={() => setShowConfirmPassword((value) => !value)}>
                <EyeIcon open={showConfirmPassword} />
              </Pressable>
            }
          />

          <PrimaryButton title={isSubmitting ? "Resetting..." : "Reset Password"} onPress={handleSubmit} />
          {!token ? (
            <View className="mt-4">
              <Text className="text-center text-[13px] text-red-500">Invalid reset link. Please request a new one.</Text>
            </View>
          ) : null}
        </AuthCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

