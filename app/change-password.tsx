import { Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import Svg, { Circle, Path } from "react-native-svg";
import { BackIcon } from "../components/ui/general-ui";

function EyeIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M2 12C3.7 8.4 7.2 6 12 6C16.8 6 20.3 8.4 22 12C20.3 15.6 16.8 18 12 18C7.2 18 3.7 15.6 2 12Z" stroke="#2D2D2D" strokeWidth={1.8} />
      <Circle cx={12} cy={12} r={3} stroke="#2D2D2D" strokeWidth={1.8} />
    </Svg>
  );
}

function PasswordField({ placeholder }: { placeholder: string }) {
  return (
    <View className="mb-9 flex-row items-center rounded-2xl border border-[#6F5846] bg-white px-3">
      <TextInput placeholder={placeholder} placeholderTextColor="#575757" className="flex-1 py-4 text-[16px] text-[#2F2F2F]" secureTextEntry />
      <Pressable>
        <EyeIcon />
      </Pressable>
    </View>
  );
}

export default function ChangePasswordScreen() {
  return (
    <View className="flex-1 bg-[#F7F7F7] px-5 pt-3">
      <View className="flex-row items-center">
        <Pressable onPress={() => router.back()} className="h-8 w-8 items-center justify-center">
          <BackIcon />
        </Pressable>
      </View>

      <Text className="mt-10 text-center text-[24px] font-medium text-[#2F2F2F]">Change Password</Text>

      <View className="mt-10">
        <PasswordField placeholder="Current Password" />
        <PasswordField placeholder="New Password" />
        <PasswordField placeholder="Confirm New Password" />
      </View>

      <View className="mt-8">
        <Pressable onPress={() => router.push("/verification-code")} className="rounded-full bg-primary py-3.5">
          <Text className="text-center text-[16px] text-white">Save</Text>
        </Pressable>
      </View>
    </View>
  );
}
