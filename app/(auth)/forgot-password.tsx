import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { goBackOr } from "../../lib/navigation/go-back-or";
import { AuthCard, AuthField, AuthHeader, PrimaryButton } from "../../components/ui/auth-ui";
import { requestPasswordReset } from "../../lib/api/auth";
import { getApiErrorMessage } from "../../lib/api/errors";
import { notifyError } from "../../lib/ui/notify";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      notifyError("Missing email", "Please enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      notifyError("Invalid email", "Please enter a valid email address.");
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await requestPasswordReset({ email: normalizedEmail });
      Alert.alert(
        "Email sent",
        result?.message ?? "If this email exists, a password reset link has been sent.",
        [{ text: "OK", onPress: () => goBackOr(router, "/(auth)/login") }],
      );
    } catch (error) {
      notifyError("Reset request failed", getApiErrorMessage(error, "Unable to request password reset right now."));
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
          title={"Forgot Password"}
          subtitle="Enter your email and we’ll send you a reset link."
          showBack
          onBackPress={() => goBackOr(router, "/(auth)/login")}
        />

        <AuthCard>
          <AuthField
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <PrimaryButton title={isSubmitting ? "Sending..." : "Send reset link"} onPress={handleSubmit} />

          <View className="mt-5 items-center">
            <Pressable onPress={() => goBackOr(router, "/(auth)/login")}>
              <Text className="text-[15px] font-semibold text-primary">Back to Login</Text>
            </Pressable>
          </View>
        </AuthCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
