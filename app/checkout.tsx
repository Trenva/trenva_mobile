import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import Svg, { Circle, Rect } from "react-native-svg";
import { BackIcon, BellDarkIcon } from "../components/ui/general-ui";

function CardIcon() {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={11} fill="#2D2D2D" />
      <Rect x={6} y={8.5} width={12} height={7} rx={1.8} stroke="#F1F1F1" strokeWidth={1.3} />
      <Rect x={8} y={11} width={5} height={1.2} rx={0.6} fill="#F1F1F1" />
    </Svg>
  );
}

export default function CheckoutScreen() {
  return (
    <View className="flex-1 bg-[#F7F7F7]">
      <View className="flex-row items-center justify-between px-4 pb-2 pt-3">
        <Pressable onPress={() => router.back()} className="h-8 w-8 items-center justify-center">
          <BackIcon />
        </Pressable>
        <Text className="text-[24px] font-medium text-[#2F2F2F]">Check out</Text>
        <BellDarkIcon />
      </View>

      <View className="px-5">
        <View className="mb-7 mt-1 flex-row gap-2">
          <View className="h-[4px] flex-1 rounded-full bg-[#EAEAEA]" />
          <View className="h-[4px] flex-1 rounded-full bg-[#EAEAEA]" />
          <View className="h-[4px] flex-1 rounded-full bg-primary" />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="px-4">
        <Text className="text-[16px] font-medium text-[#343434]">Order Review</Text>

        <View className="mt-2 flex-row items-center bg-[#F2F2F2] px-3 py-2">
          <View className="h-[78px] w-[92px] bg-[#D5D5D5]" />
          <View className="ml-2 flex-1">
            <Text className="text-[16px] text-[#2F2F2F]">Flower Embraided T-Shirt</Text>
            <Text className="mt-2 text-[30px] text-[#2F2F2F]">N 1000</Text>
          </View>
        </View>

        <View className="mt-5 flex-row items-center justify-between">
          <Text className="text-[16px] font-medium text-[#343434]">Deliver to</Text>
          <Pressable onPress={() => router.push("/address")}>
            <Text className="text-[13px] text-[#333333] underline">Edit</Text>
          </Pressable>
        </View>
        <View className="mt-2 border border-[#E4E4E4] bg-white px-3 py-3 shadow-sm">
          <Text className="text-[18px] text-[#2F2F2F]">Home</Text>
          <Text className="text-[14px] text-[#9E9E9E]">46, Johnson Street , Karur - 639001</Text>
        </View>

        <View className="mt-5 flex-row items-center justify-between">
          <Text className="text-[16px] font-medium text-[#343434]">Payment method</Text>
          <Pressable onPress={() => router.push("/payments")}>
            <Text className="text-[13px] text-[#333333] underline">Edit</Text>
          </Pressable>
        </View>
        <View className="mt-2 flex-row items-center gap-3 border border-[#E4E4E4] bg-white px-3 py-4 shadow-sm">
          <CardIcon />
          <Text className="text-[18px] text-[#2F2F2F]">Card</Text>
        </View>

        <View className="mt-4 border-t border-[#D5D5D5] pt-3">
          <Text className="text-[16px] font-medium text-[#343434]">Price Details</Text>
          <View className="mt-4 gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-[16px] text-[#343434]">Price (1 Items)</Text>
              <Text className="text-[16px] text-[#343434]">N 1150</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-[16px] text-[#343434]">Discount</Text>
              <Text className="text-[16px] text-[#343434]">N 250</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-[16px] text-[#343434]">Delivery Charges</Text>
              <Text className="text-[16px] text-[#343434]">N 100</Text>
            </View>
          </View>

          <View className="mt-4 border-t border-[#8E8E8E] pt-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-[18px] font-medium text-[#2F2F2F]">Total Amount</Text>
              <Text className="text-[18px] font-medium text-[#2F2F2F]">N 1000</Text>
            </View>
          </View>
        </View>

        <View className="mb-10 mt-6">
          <Pressable onPress={() => router.push("/payment-success")} className="rounded-full bg-primary py-3.5">
            <Text className="text-center text-[16px] font-medium text-white">Make Payment</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
