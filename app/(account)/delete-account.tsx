import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { goBackOr } from "../../lib/navigation/go-back-or";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";
import { BackIcon } from "../../components/ui/general-ui";
import { useState } from "react";
import { useAppTheme } from "../../lib/theme/theme-provider";

function EyeIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M2 12C3.7 8.4 7.2 6 12 6C16.8 6 20.3 8.4 22 12C20.3 15.6 16.8 18 12 18C7.2 18 3.7 15.6 2 12Z" stroke={color} strokeWidth={1.8} />
      <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function SadIcon() {
  return (
    <Svg width={90} height={90} viewBox="0 0 100 100" fill="none">
      <Circle cx={50} cy={50} r={46} fill="#F4D34E" />
      <Path d="M30 38C33 34 38 34 42 38" stroke="#6B4F1A" strokeWidth={5} strokeLinecap="round" />
      <Path d="M58 38C61 34 66 34 70 38" stroke="#6B4F1A" strokeWidth={5} strokeLinecap="round" />
      <Path d="M36 66C42 56 58 56 64 66" stroke="#6B4F1A" strokeWidth={5} strokeLinecap="round" />
      <Path d="M70 68C74 72 77 79 73 83C69 87 61 83 58 76C56 71 62 66 70 68Z" fill="#4EA6F2" />
    </Svg>
  );
}

export default function DeleteAccountScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[0]} contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="px-5 pb-3" style={{ paddingTop: Math.max(insets.top + 4, 12), backgroundColor: colors.background }}>
          <View className="flex-row items-center">
            <Pressable onPress={() => goBackOr(router)} className="h-8 w-8 items-center justify-center">
              <BackIcon />
            </Pressable>
          </View>

          <Text className="mt-8 text-center text-[24px] font-medium" style={{ color: colors.text }}>Delete Account?</Text>
          <View className="mt-3 items-center">
            <SadIcon />
          </View>

          <Text className="mt-5 text-[17px]" style={{ color: colors.text }}>We're truly sorry to see you go.</Text>
          <Text className="mt-4 text-[16px] leading-7" style={{ color: colors.text }}>
            Deleting your Trenva account will permanently remove all your personal data, order history, saved addresses,
            followed vendors, and wishlist items. You'll also lose access to any unused wallet balance, promo codes, or
            rewards tied to your account.
          </Text>
          <Text className="mt-5 text-[16px]" style={{ color: colors.text }}>Before you continue, please make sure:</Text>

          <Text className="mt-4 text-[16px] leading-7" style={{ color: colors.textMuted }}>•  You've completed all orders and resolved{"\n"}   any pending issues.</Text>
          <Text className="mt-3 text-[16px] leading-7" style={{ color: colors.textMuted }}>•  You've used up any available rewards or{"\n"}   discounts.</Text>
          <Text className="mt-3 text-[16px] leading-7" style={{ color: colors.textMuted }}>•  You've saved any receipts or order details{"\n"}   you might need later.</Text>

          <Text className="mt-5 text-[16px] leading-7" style={{ color: colors.text }}>
            This action is permanent and cannot be undone. If you're sure, please confirm by entering your password to
            verify it's you.
          </Text>

          <View className="mt-5 flex-row items-center rounded-2xl border px-3" style={{ borderColor: colors.border, backgroundColor: colors.card }}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              placeholderTextColor={colors.textMuted}
              className="flex-1 py-4 text-[16px]"
              style={{ color: colors.text }}
              secureTextEntry={!showPassword}
            />
            <Pressable onPress={() => setShowPassword((prev) => !prev)}>
              <EyeIcon color={colors.textMuted} />
            </Pressable>
          </View>

          <View className="mt-8">
            <Pressable onPress={() => router.push("/customer-support")} className="rounded-full bg-primary py-3.5">
              <Text className="text-center text-[16px] text-white">Continue</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}



