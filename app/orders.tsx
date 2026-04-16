import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { BackIcon } from "../components/ui/general-ui";
import { TabIcon } from "../components/ui/home-ui";

type ActiveOrder = { id: string; name: string; price: string };
type CompletedOrder = { id: string; name: string; price: string };
type CancelledOrder = { id: string; name: string; price: string; orderNo: string; date: string };

const activeOrders: ActiveOrder[] = [
  { id: "a1", name: "Flower Embraided T-Shirt", price: "N 1000" },
  { id: "a2", name: "Handcrafted Rattan Basket", price: "N 200" },
  { id: "a3", name: "Handmade Teddy Decor", price: "N 400" },
  { id: "a4", name: "Textured Ceramic Vase", price: "N 800" },
  { id: "a5", name: "Flower Embraided Pillow Cover", price: "N 1000" },
];

const completedOrders: CompletedOrder[] = [
  { id: "c1", name: "Channapatna Wooden Toy", price: "N 660" },
  { id: "c2", name: "Flower Embraided T-Shirt", price: "N 700" },
  { id: "c3", name: "Cultural Music Maker", price: "N 1100" },
  { id: "c4", name: "Amber Elegance Vase", price: "N 900" },
  { id: "c5", name: "Flower Embraided T-Shirt", price: "N 1000" },
];

const cancelledOrders: CancelledOrder[] = [
  { id: "x1", name: "Sunset Ceramic Pot", price: "N 1000", orderNo: "2134", date: "02 - 05 - 2025" },
  { id: "x2", name: "Sunset Ceramic Pot", price: "N 1000", orderNo: "2134", date: "02 - 05 - 2025" },
  { id: "x3", name: "Sunset Ceramic Pot", price: "N 1000", orderNo: "2134", date: "02 - 05 - 2025" },
  { id: "x4", name: "Sunset Ceramic Pot", price: "N 1000", orderNo: "2134", date: "02 - 05 - 2025" },
];

function OrdersTabIcon({ active }: { active: boolean }) {
  const color = active ? "#FF9F0A" : "#D4A04A";
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M5 5H19V19H5V5Z" stroke={color} strokeWidth={1.8} />
      <Path d="M8 9H16M8 12H16M8 15H13" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function BottomOrdersNav() {
  return (
    <View className="px-4 pb-4 pt-2">
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
        <Pressable>
          <OrdersTabIcon active />
        </Pressable>
        <Pressable onPress={() => router.push("/(tabs)/profile")}>
          <TabIcon routeName="profile" color="#D4A04A" />
        </Pressable>
      </View>
    </View>
  );
}

function ItemArtwork({ tone }: { tone: number }) {
  const shades = ["#DCC6AA", "#C8D8CF", "#D8C3D3", "#CEC9BE"];
  return <View className="h-[92px] w-[92px]" style={{ backgroundColor: shades[tone % shades.length] }} />;
}

function ActiveCard({ item, index }: { item: ActiveOrder; index: number }) {
  return (
    <View className="border-b border-[#D7D7D7] py-4">
      <View className="flex-row items-center">
        <ItemArtwork tone={index} />
        <View className="ml-3 flex-1">
          <Text className="text-[15px] text-[#2D2D2D]">{item.name}</Text>
          <Text className="mt-2 text-[15px] text-[#2D2D2D]">{item.price}</Text>
        </View>
        <Pressable className="rounded-full bg-primary px-4 py-2">
          <Text className="text-[14px] text-white">Track Order</Text>
        </Pressable>
      </View>
    </View>
  );
}

function CompletedCard({ item, index }: { item: CompletedOrder; index: number }) {
  return (
    <View className="border-b border-[#D7D7D7] py-4">
      <View className="flex-row items-center">
        <ItemArtwork tone={index + 1} />
        <View className="ml-3 flex-1">
          <Text className="text-[15px] text-[#2D2D2D]">{item.name}</Text>
          <Text className="mt-2 text-[15px] text-[#2D2D2D]">{item.price}</Text>
        </View>
        <Pressable className="rounded-full bg-primary px-4 py-2">
          <Text className="text-[14px] text-white">Leave Review</Text>
        </Pressable>
      </View>
    </View>
  );
}

function CancelledCard({ item, index }: { item: CancelledOrder; index: number }) {
  return (
    <View className="border-b border-[#D7D7D7] py-4">
      <View className="flex-row items-center">
        <ItemArtwork tone={index + 2} />
        <View className="ml-3 flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="text-[15px] text-[#2D2D2D]">{item.name}</Text>
            <Text className="text-[15px] text-[#2D2D2D]">Order No:{item.orderNo}</Text>
          </View>
          <View className="mt-1 self-start bg-primary px-2 py-0.5">
            <Text className="text-[11px] font-semibold text-[#2D2D2D]">REFUNDED</Text>
          </View>
          <Text className="mt-1 text-[15px] text-[#3A3A3A]">On {item.date}</Text>
          <Text className="mt-1 text-[15px] text-[#2D2D2D]">{item.price}</Text>
        </View>
        <Pressable className="rounded-full bg-primary px-4 py-2">
          <Text className="text-[14px] text-white">Re - Order</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function OrdersScreen() {
  const [tab, setTab] = useState<"active" | "completed" | "cancelled">("active");

  return (
    <View className="flex-1 bg-[#F7F7F7]">
      <View className="flex-row items-center px-3 pt-3">
        <Pressable className="h-8 w-8 items-center justify-center" onPress={() => router.back()}>
          <BackIcon />
        </Pressable>
        <Text className="flex-1 text-center text-[25px] font-medium text-[#2F2F2F]">My Orders</Text>
        <View className="w-8" />
      </View>

      <View className="mt-4 px-4">
        <View className="flex-row">
          {[
            { key: "active", label: "Active" },
            { key: "completed", label: "Completed" },
            { key: "cancelled", label: "Cancelled" },
          ].map((t) => {
            const isActive = tab === (t.key as typeof tab);
            return (
              <Pressable
                key={t.key}
                onPress={() => setTab(t.key as typeof tab)}
                className="flex-1 items-center pb-3"
              >
                <Text className={`text-[17px] ${isActive ? "font-medium text-[#2D2D2D]" : "text-[#222222]"}`}>
                  {t.label}
                </Text>
                {isActive ? <View className="mt-3 h-[3px] w-full bg-primary" /> : <View className="mt-3 h-[1px] w-full bg-[#D9D9D9]" />}
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-4">
        <View className="pt-1">
          {tab === "active" && activeOrders.map((item, index) => <ActiveCard key={item.id} item={item} index={index} />)}
          {tab === "completed" && completedOrders.map((item, index) => <CompletedCard key={item.id} item={item} index={index} />)}
          {tab === "cancelled" && cancelledOrders.map((item, index) => <CancelledCard key={item.id} item={item} index={index} />)}
        </View>
      </ScrollView>

      <BottomOrdersNav />
    </View>
  );
}
