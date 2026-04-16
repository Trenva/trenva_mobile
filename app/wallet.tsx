import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { BackIcon } from "../components/ui/general-ui";

type Transaction = {
  id: string;
  title: string;
  time: string;
  amount: string;
  positive?: boolean;
};

const transactions: Transaction[] = [
  { id: "t1", title: "Purchase of Office Pins", time: "Today, 17:45 PM", amount: "- $26.65" },
  { id: "t2", title: "Withdrawn to account", time: "March 10, 13:00 PM", amount: "- $46.40" },
  { id: "t3", title: "Funded wallet", time: "March 02, 07:30 AM", amount: "+ $170.10", positive: true },
];

function DownIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9L12 15L18 9" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DownDarkIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9L12 15L18 9" stroke="#606060" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function WalletScreen() {
  return (
    <View className="flex-1 bg-[#F7F7F7]">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 26 }}>
        <View className="flex-row items-center px-3 pt-3">
          <Pressable className="h-8 w-8 items-center justify-center" onPress={() => router.back()}>
            <BackIcon />
          </Pressable>
          <Text className="flex-1 text-center text-[24px] font-medium text-[#2F2F2F]">Trenva Wallet</Text>
          <View className="w-8" />
        </View>

        <View className="px-5 pt-8">
          <Text className="text-[34px] font-semibold text-primary">Your Balance</Text>

          <View className="mt-5 overflow-hidden rounded-[18px] px-4 py-4">
            <View className="absolute inset-0">
              <Svg width="100%" height="100%" viewBox="0 0 420 220" preserveAspectRatio="none">
                <Defs>
                  <LinearGradient id="walletCardGradient" x1="0" y1="1" x2="1" y2="0">
                    <Stop offset="0" stopColor="#F8A100" />
                    <Stop offset="0.6" stopColor="#F99B66" />
                    <Stop offset="1" stopColor="#EC7FA1" />
                  </LinearGradient>
                </Defs>
                <Rect x="0" y="0" width="420" height="220" fill="url(#walletCardGradient)" />
              </Svg>
            </View>
            <View className="relative">
            <Text className="text-[12px] text-white">March 23, 2025</Text>
            <View className="mt-3 flex-row items-center justify-between">
              <Text className="text-[42px] font-semibold text-white">$21,860.02</Text>
              <View className="flex-row items-center gap-1">
                <Text className="text-[22px] font-semibold text-white">USD</Text>
                <DownIcon />
              </View>
            </View>
            <Text className="mt-4 text-[13px] text-white">For refunds, rewards and shopping credits.</Text>
            </View>
          </View>

          <Pressable className="mt-8 rounded-[12px] bg-primary py-3.5">
            <Text className="text-center text-[16px] text-white">Withdraw</Text>
          </Pressable>

          <View className="mt-8 border-b border-dashed border-[#797979]" />
          <View className="flex-row items-center justify-between border-b border-[#8F8F8F] py-3">
            <View>
              <Text className="text-[18px] font-semibold text-primary">PIN</Text>
              <Text className="-mt-1 text-[18px] text-[#161337]">●●●●</Text>
            </View>
            <Pressable>
              <Text className="text-[18px] font-semibold text-primary">Change PIN</Text>
            </Pressable>
          </View>

          <View className="mt-8 flex-row items-center justify-between">
            <Text className="text-[18px] font-semibold text-primary">Activities</Text>
            <Pressable className="flex-row items-center gap-1">
              <Text className="text-[12px] text-[#6A6A6A]">Weekly</Text>
              <DownDarkIcon />
            </Pressable>
          </View>

          <View className="mt-6 flex-row items-end justify-between px-4">
            {[68, 34, 50, 62, 30].map((height, index) => (
              <View key={`${height}-${index}`} className="items-center">
                <View className="h-[20px] w-[20px] rounded-full border-[5px] border-primary bg-[#F7F7F7]" />
                <View className="w-[12px] rounded-full bg-primary" style={{ height }} />
              </View>
            ))}
          </View>
          <View className="mt-3 flex-row justify-between px-4">
            {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => (
              <Text key={day} className="w-[44px] text-center text-[14px] text-[#2F2F2F]">
                {day}
              </Text>
            ))}
          </View>

          <View className="mt-12 flex-row items-center justify-between">
            <Text className="text-[18px] font-semibold text-primary">Recent transactions</Text>
            <Pressable>
              <Text className="text-[12px] text-[#6A6A6A] underline">Show more</Text>
            </Pressable>
          </View>

          <View className="mt-6 gap-5">
            {transactions.map((transaction) => (
              <View key={transaction.id} className="flex-row items-center">
                <View className="h-10 w-10 rounded-full bg-[#D7D7D7]" />
                <View className="ml-4 flex-1">
                  <Text className="text-[16px] font-semibold text-[#303030]">{transaction.title}</Text>
                  <Text className="text-[13px] text-[#9A9A9A]">{transaction.time}</Text>
                </View>
                <Text className={`text-[18px] font-medium ${transaction.positive ? "text-[#1EB959]" : "text-[#EE3C3C]"}`}>
                  {transaction.amount}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
