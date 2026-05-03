import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import Svg, { Circle, Path } from "react-native-svg";
import { BackIcon } from "../../components/ui/general-ui";

function EyeIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M2 12C3.7 8.4 7.2 6 12 6C16.8 6 20.3 8.4 22 12C20.3 15.6 16.8 18 12 18C7.2 18 3.7 15.6 2 12Z" stroke="#2D2D2D" strokeWidth={1.8} />
      <Circle cx={12} cy={12} r={3} stroke="#2D2D2D" strokeWidth={1.8} />
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
  return (
    <View className="flex-1 bg-[#F7F7F7]">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="px-5 pt-3">
          <View className="flex-row items-center">
            <Pressable onPress={() => router.back()} className="h-8 w-8 items-center justify-center">
              <BackIcon />
            </Pressable>
          </View>

          <Text className="mt-8 text-center text-[24px] font-medium text-[#2F2F2F]">Delete Account?</Text>
          <View className="mt-3 items-center">
            <SadIcon />
          </View>

          <Text className="mt-5 text-[17px] text-[#232323]">We're truly sorry to see you go.</Text>
          <Text className="mt-4 text-[16px] leading-7 text-[#232323]">
            Deleting your Trenva account will permanently remove all your personal data, order history, saved addresses,
            followed vendors, and wishlist items. You'll also lose access to any unused wallet balance, promo codes, or
            rewards tied to your account.
          </Text>
          <Text className="mt-5 text-[16px] text-[#232323]">Before you continue, please make sure:</Text>

          <Text className="mt-4 text-[16px] leading-7 text-[#232323]">•  You've completed all orders and resolved{"\n"}   any pending issues.</Text>
          <Text className="mt-3 text-[16px] leading-7 text-[#232323]">•  You've used up any available rewards or{"\n"}   discounts.</Text>
          <Text className="mt-3 text-[16px] leading-7 text-[#232323]">•  You've saved any receipts or order details{"\n"}   you might need later.</Text>

          <Text className="mt-5 text-[16px] leading-7 text-[#232323]">
            This action is permanent and cannot be undone. If you're sure, please confirm by entering your password to
            verify it's you.
          </Text>

          <View className="mt-5 flex-row items-center rounded-2xl border border-[#6F5846] bg-white px-3">
            <TextInput placeholder="Your password" placeholderTextColor="#575757" className="flex-1 py-4 text-[16px] text-[#2F2F2F]" secureTextEntry />
            <Pressable>
              <EyeIcon />
            </Pressable>
          </View>

          <View className="mt-8">
            <Pressable className="rounded-full bg-primary py-3.5">
              <Text className="text-center text-[16px] text-white">Delete</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
