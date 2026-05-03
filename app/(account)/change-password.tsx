import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import Svg, { Circle, Path } from "react-native-svg";
import { BackIcon } from "../../components/ui/general-ui";
import { changePassword } from "../../lib/api/auth";
import { clearAuthTokens } from "../../lib/auth/tokens";
import { getApiErrorMessage, isUnauthorizedError } from "../../lib/api/errors";
import { notifyError, notifyInfo, notifySuccess } from "../../lib/ui/notify";

function EyeIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M2 12C3.7 8.4 7.2 6 12 6C16.8 6 20.3 8.4 22 12C20.3 15.6 16.8 18 12 18C7.2 18 3.7 15.6 2 12Z" stroke="#2D2D2D" strokeWidth={1.8} />
      <Circle cx={12} cy={12} r={3} stroke="#2D2D2D" strokeWidth={1.8} />
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
  return (
    <View className="mb-9 flex-row items-center rounded-2xl border border-[#6F5846] bg-white px-3">
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#575757"
        className="flex-1 py-4 text-[16px] text-[#2F2F2F]"
        secureTextEntry={secureTextEntry}
      />
      <Pressable onPress={onToggleSecure}>
        <EyeIcon />
      </Pressable>
    </View>
  );
}

export default function ChangePasswordScreen() {
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
      router.back();
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
    <View className="flex-1 bg-[#F7F7F7] px-5 pt-3">
      <View className="flex-row items-center">
        <Pressable onPress={() => router.back()} className="h-8 w-8 items-center justify-center">
          <BackIcon />
        </Pressable>
      </View>

      <Text className="mt-10 text-center text-[24px] font-medium text-[#2F2F2F]">Change Password</Text>

      <View className="mt-10">
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

      <View className="mt-8">
        <Pressable
          onPress={handleSave}
          disabled={isSubmitting}
          className={`rounded-full py-3.5 ${isSubmitting ? "bg-[#B9A89A]" : "bg-primary"}`}
        >
          <Text className="text-center text-[16px] text-white">{isSubmitting ? "Saving..." : "Save"}</Text>
        </Pressable>
      </View>
    </View>
  );
}
