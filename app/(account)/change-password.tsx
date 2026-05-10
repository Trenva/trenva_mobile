import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { goBackOr } from "../../lib/navigation/go-back-or";
import Svg, { Circle, Path } from "react-native-svg";
import { BackIcon } from "../../components/ui/general-ui";
import { changePassword } from "../../lib/api/auth";
import { clearAuthTokens } from "../../lib/auth/tokens";
import { getApiErrorMessage, isUnauthorizedError } from "../../lib/api/errors";
import { notifyError, notifyInfo, notifySuccess } from "../../lib/ui/notify";
import { useAppTheme } from "../../lib/theme/theme-provider";

function EyeIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M2 12C3.7 8.4 7.2 6 12 6C16.8 6 20.3 8.4 22 12C20.3 15.6 16.8 18 12 18C7.2 18 3.7 15.6 2 12Z" stroke={color} strokeWidth={1.8} />
      <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function PasswordField({
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  onToggleSecure,
}: {
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  secureTextEntry: boolean;
  onToggleSecure: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <View className="mb-4 flex-row items-center rounded-2xl border px-3" style={{ borderColor: colors.border, backgroundColor: colors.card }}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        className="flex-1 py-4 text-[16px]"
        style={{ color: colors.text }}
        secureTextEntry={secureTextEntry}
      />
      <Pressable onPress={onToggleSecure}>
        <EyeIcon color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleSave() {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      notifyError("Missing fields", "Please fill all password fields.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      notifyError("Password mismatch", "New password and confirm password must match.");
      return;
    }

    try {
      setIsSubmitting(true);
      await changePassword({
        currentPassword,
        newPassword,
        confirmNewPassword,
      });
      notifySuccess("Password updated", "Password changed successfully.");
      goBackOr(router, "/(tabs)/profile");
    } catch (error) {
      if (isUnauthorizedError(error)) {
        await clearAuthTokens();
        notifyInfo("Session expired", "Please log in again.");
        router.replace("/(auth)/login");
        return;
      }
      notifyError("Change password failed", getApiErrorMessage(error, "Unable to change password right now."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView className="flex-1" style={{ backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        className="px-5"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={{ paddingTop: Math.max(insets.top + 4, 12), paddingBottom: 24 }}
      >
        <View className="flex-row items-center">
          <Pressable onPress={() => goBackOr(router)} className="h-8 w-8 items-center justify-center" hitSlop={12}>
            <BackIcon />
          </Pressable>
        </View>

        <Text className="mt-8 text-center text-[24px] font-medium" style={{ color: colors.text }}>Change Password</Text>

        <View className="mt-7">
          <PasswordField
            placeholder="Current Password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry={!showCurrent}
            onToggleSecure={() => setShowCurrent((prev) => !prev)}
          />
          <PasswordField
            placeholder="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showNew}
            onToggleSecure={() => setShowNew((prev) => !prev)}
          />
          <PasswordField
            placeholder="Confirm New Password"
            value={confirmNewPassword}
            onChangeText={setConfirmNewPassword}
            secureTextEntry={!showConfirm}
            onToggleSecure={() => setShowConfirm((prev) => !prev)}
          />
        </View>

        <View className="mt-5">
          <Pressable
            onPress={handleSave}
            disabled={isSubmitting}
            className="rounded-full py-3.5"
            style={{ backgroundColor: isSubmitting ? colors.border : colors.primary }}
          >
            <Text className="text-center text-[16px] text-white">{isSubmitting ? "Saving..." : "Save"}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}




