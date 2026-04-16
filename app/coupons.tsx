import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { BackIcon } from "../components/ui/general-ui";
import { TabIcon } from "../components/ui/home-ui";

type Coupon = {
  id: string;
  title: string;
  subtitle: string;
  dateLine?: string;
  code: string;
};

const unusedCoupons: Coupon[] = [
  { id: "u1", title: "Enjoy $ 100 off", subtitle: "For purchases above $1000", dateLine: "Offer valid until June 10,2025", code: "yer45edf" },
  { id: "u2", title: "Enjoy $ 100 off", subtitle: "Offer valid until July 20, 2025", dateLine: "March 4,2025,8:05 am - June 10,2025,11:59 pm", code: "yer45edf" },
  { id: "u3", title: "Enjoy $ 100 off", subtitle: "Offer valid until July 24,2025", dateLine: "March 4,2025,8:05 am - June 10,2025,11:59 pm", code: "yer45edf" },
];

const expiredCoupons: Coupon[] = [
  { id: "e1", title: "$ 100.00 OFF on all items", subtitle: "For purchases above $1000", dateLine: "Offer valid until", code: "yer45edf" },
  { id: "e2", title: "$ 100.00 OFF on all items", subtitle: "For purchases above $1000", dateLine: "March 4,2025,8:05 am - April 10,2025,11:59 pm", code: "yer45edf" },
  { id: "e3", title: "$ 100.00 OFF on all items", subtitle: "For purchases above $1000", dateLine: "March 4,2025,8:05 am - May 10,2025,11:59 pm", code: "yer45edf" },
];

function HelpIcon() {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9.2} stroke="#2D2D2D" strokeWidth={1.9} />
      <Path d="M12 17H12.01" stroke="#2D2D2D" strokeWidth={1.9} strokeLinecap="round" />
      <Path d="M9.5 9.8C9.9 8.6 10.9 8 12.1 8C13.5 8 14.4 8.8 14.4 10C14.4 10.9 13.9 11.4 13.1 11.9C12.4 12.4 12.1 12.9 12.1 13.8" stroke="#2D2D2D" strokeWidth={1.9} strokeLinecap="round" />
    </Svg>
  );
}

function OrdersTabIcon({ active }: { active: boolean }) {
  const color = active ? "#FF9F0A" : "#D4A04A";
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M5 5H19V19H5V5Z" stroke={color} strokeWidth={1.8} />
      <Path d="M8 9H16M8 12H16M8 15H13" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function BottomQuickNav() {
  return (
    <View className="px-4 pb-3 pt-2">
      <View className="flex-row items-center justify-between rounded-[12px] bg-[#FAF5EF] px-7 py-4">
        <Pressable onPress={() => router.push("/(tabs)")}>
          <TabIcon routeName="index" color="#D4A04A" />
        </Pressable>
        <Pressable onPress={() => router.push("/(tabs)/cart")}>
          <TabIcon routeName="cart" color="#D4A04A" />
        </Pressable>
        <Pressable onPress={() => router.push("/(tabs)/wishlist")}>
          <TabIcon routeName="wishlist" color="#D4A04A" />
        </Pressable>
        <Pressable onPress={() => router.push("/orders")}>
          <OrdersTabIcon active />
        </Pressable>
        <Pressable onPress={() => router.push("/(tabs)/profile")}>
          <TabIcon routeName="profile" color="#D4A04A" />
        </Pressable>
      </View>
    </View>
  );
}

function CouponCard({
  item,
  expired,
}: {
  item: Coupon;
  expired?: boolean;
}) {
  const gradientId = `couponGradient-${item.id}`;

  return (
    <View className="mb-4 overflow-hidden rounded-[12px] px-3 py-3">
      <View className="absolute inset-0">
        <Svg width="100%" height="100%" viewBox="0 0 420 180" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="1" x2="1" y2="0">
              <Stop offset="0" stopColor="#F8A100" />
              <Stop offset="0.55" stopColor="#FF4B24" />
              <Stop offset="1" stopColor="#FF1642" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="420" height="180" fill={`url(#${gradientId})`} />
        </Svg>
      </View>
      <View className="relative">
        <View className="flex-row items-start justify-between">
          <View className="max-w-[72%]">
            <Text className="text-[16px] font-semibold text-white">{item.title}</Text>
            <Text className="mt-1 text-[14px] text-[#1C1C1C] underline">{item.subtitle}</Text>
          </View>
          <Pressable className="rounded-full bg-[#FFCF4A] px-4 py-2">
            <Text className="text-[14px] text-white">{expired ? "Expired" : "Use Coupon"}</Text>
          </Pressable>
        </View>

        {item.dateLine ? <Text className="mt-5 text-[14px] text-[#1C1C1C]">{item.dateLine}</Text> : null}
        {!expired ? <Text className="mt-2 text-[14px] text-[#1C1C1C]">Excludes Groceries</Text> : null}
        <Text className="mt-2 self-end text-[18px] font-medium text-[#1C1C1C]">Code: {item.code}</Text>
      </View>
    </View>
  );
}

export default function CouponsScreen() {
  const [tab, setTab] = useState<"unused" | "expired">("unused");
  const data = tab === "unused" ? unusedCoupons : expiredCoupons;

  return (
    <View className="flex-1 bg-[#F7F7F7]">
      <View className="flex-row items-center justify-between px-4 pt-3">
        <Pressable onPress={() => router.back()} className="h-8 w-8 items-center justify-center">
          <BackIcon />
        </Pressable>
        <Text className="text-center text-[24px] font-medium leading-8 text-[#2F2F2F]">Trenva{"\n"}Coupons & Deals</Text>
        <Pressable className="h-8 w-8 items-center justify-center">
          <HelpIcon />
        </Pressable>
      </View>

      <View className="mt-5 px-4">
        <View className="flex-row">
          {[
            { key: "unused", label: "Unused" },
            { key: "expired", label: "Expired" },
          ].map((t) => {
            const active = tab === (t.key as typeof tab);
            return (
              <Pressable key={t.key} onPress={() => setTab(t.key as typeof tab)} className="flex-1 items-center pb-3">
                <Text className="text-[17px] text-[#1F1F1F]">{t.label}</Text>
                {active ? <View className="mt-3 h-[3px] w-full bg-primary" /> : <View className="mt-3 h-[1px] w-full bg-[#D9D9D9]" />}
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-4">
        <View className="mt-4 flex-row gap-2">
          <View className="flex-1 rounded-2xl border border-[#6F5846] bg-white px-3">
            <TextInput placeholder="Enter coupon code" placeholderTextColor="#5E5E5E" className="py-4 text-[16px] text-[#2F2F2F]" />
          </View>
          <Pressable className="rounded-2xl bg-primary px-4 items-center justify-center">
            <Text className="text-[16px] text-white">Apply Code</Text>
          </Pressable>
        </View>

        {tab === "unused" ? (
          <View className="mt-4">
            <Text className="text-[17px] font-medium text-[#2F2F2F]">Available coupons</Text>
            <Text className="mt-1 text-[14px] leading-6 text-[#2F2F2F]">Ech order qualifies for onepromo. Discount applies to{"\n"}product price only.</Text>
          </View>
        ) : null}

        <View className="mt-3">
          {data.map((coupon) => (
            <View key={coupon.id} className="border-t border-[#D7D7D7] pt-4">
              <CouponCard item={coupon} expired={tab === "expired"} />
            </View>
          ))}
        </View>
      </ScrollView>

      <BottomQuickNav />
    </View>
  );
}
