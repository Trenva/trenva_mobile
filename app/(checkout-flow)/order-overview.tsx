import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { BackIcon, BellDarkIcon } from "../../components/ui/general-ui";
import { HeartOutlineIcon, TabIcon } from "../../components/ui/home-ui";
import { formatMoney, getOrders } from "../../lib/api/shop";
import { useCheckoutStore } from "../../store/checkout-store";

function SuccessBadgeIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke="#FF9F0A" strokeWidth={2} />
      <Path
        d="M10.8 6.8L8.6 10V15C8.6 16.2 9.6 17.2 10.8 17.2H15.5C16.7 17.2 17.7 16.2 17.7 15V10.5C17.7 9.3 16.7 8.3 15.5 8.3H13.3L13.8 7C14.3 5.7 13.6 4.6 12.6 4.5C11.8 4.4 11.2 5 10.8 6.8Z"
        fill="#FF9F0A"
      />
    </Svg>
  );
}

function RecommendationCard() {
  return (
    <Pressable
      onPress={() => router.push({ pathname: "/product/[slug]", params: { slug: "product-name", name: "Product Name", price: "N 1200" } })}
      className="mr-3 w-[150px] overflow-hidden rounded-[6px] bg-white shadow-sm"
    >
      <View className="relative h-[110px] bg-[#E8E8E8]">
        <View className="absolute right-3 top-3">
          <HeartOutlineIcon color="#FF9F0A" size={20} />
        </View>
      </View>
      <View className="px-2.5 pb-3 pt-3">
        <Text className="text-[12px] font-medium text-[#333333]">Product Name</Text>
        <Text className="mt-1 text-[14px] font-medium text-[#222222]">N 1200</Text>
        <Text className="mt-1 text-[9px] text-[#A7A7A7]">* 4.5 - 123 Reviews</Text>
      </View>
    </Pressable>
  );
}

function BottomQuickNav() {
  const items = [
    { routeName: "index", path: "/(tabs)" as const },
    { routeName: "categories", path: "/(tabs)/categories" as const },
    { routeName: "cart", path: "/(tabs)/cart" as const },
    { routeName: "wishlist", path: "/(tabs)/wishlist" as const },
    { routeName: "profile", path: "/(tabs)/profile" as const },
  ];

  return (
    <View className="px-4 pb-4 pt-2">
      <View className="flex-row items-center justify-between rounded-[12px] bg-[#FAF5EF] px-7 py-4">
        {items.map((item) => (
          <Pressable key={item.routeName} onPress={() => router.push(item.path)}>
            <TabIcon routeName={item.routeName} color="#FF9F0A" />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function OrderOverviewScreen() {
  const params = useLocalSearchParams<{ orderId?: string; total?: string; items?: string }>();
  const lastOrderId = useCheckoutStore((state) => state.lastOrderId);
  const [orderDate, setOrderDate] = useState<string | null>(null);
  const activeOrderId = params.orderId || lastOrderId || "N/A";
  const totalAmount = Number(params.total ?? 0);
  const itemCount = Number(params.items ?? 0);

  useEffect(() => {
    let mounted = true;
    async function loadOrderDate() {
      try {
        const orders = await getOrders();
        const found = orders.find((order) => order.oid === activeOrderId);
        if (!mounted) return;
        if (found?.order_date) {
          const date = new Date(found.order_date);
          setOrderDate(Number.isNaN(date.getTime()) ? null : date.toLocaleDateString());
        }
      } catch {
        if (!mounted) return;
        setOrderDate(null);
      }
    }
    if (activeOrderId && activeOrderId !== "N/A") {
      void loadOrderDate();
    }
    return () => {
      mounted = false;
    };
  }, [activeOrderId]);

  const estDeliveryRange = useMemo(() => {
    const base = new Date();
    const start = new Date(base);
    const end = new Date(base);
    start.setDate(base.getDate() + 3);
    end.setDate(base.getDate() + 10);
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  }, []);

  return (
    <View className="flex-1 bg-[#F7F7F7]">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        <View className="px-4 pt-3">
          <View className="mb-4 flex-row items-center justify-between">
            <Pressable className="h-8 w-8 items-center justify-center" onPress={() => router.back()}>
              <BackIcon />
            </Pressable>
            <BellDarkIcon />
          </View>

          <Text className="text-[24px] font-medium text-[#2E2E2E]">Order Overview</Text>

          <View className="mt-4 rounded-[10px] border border-[#7C6240] bg-white px-4 py-4">
            <View className="items-center">
              <SuccessBadgeIcon />
              <Text className="mt-3 text-[16px] font-medium text-[#333333]">Payment Has Been Confirmed</Text>
              <Text className="mt-1 text-center text-[13px] text-[#666666]">Order ID: {activeOrderId}</Text>
              {orderDate ? <Text className="mt-1 text-center text-[12px] text-[#8A8A8A]">Date: {orderDate}</Text> : null}
            </View>

            <View className="mt-4 flex-row justify-between">
              <View>
                <Text className="text-[14px] text-[#444444]">Total *{itemCount || 1}</Text>
                <Text className="mt-1 text-[20px] font-medium text-[#2F2F2F]">{formatMoney(totalAmount)}</Text>
              </View>
              <View>
                <Text className="text-[14px] text-[#444444]">Est. Delivery</Text>
                <Text className="mt-1 text-[20px] font-medium text-[#2F2F2F]">{estDeliveryRange}</Text>
              </View>
            </View>
          </View>

          <View className="mb-4 mt-7 flex-row items-center justify-between">
            <Text className="text-[16px] font-medium text-primary">Recommendations</Text>
            <Text className="text-[14px] text-[#27272A] underline">More</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <RecommendationCard />
            <RecommendationCard />
            <RecommendationCard />
          </ScrollView>

          <Pressable onPress={() => router.replace("/(tabs)")} className="mt-8 rounded-full bg-primary py-3.5">
            <Text className="text-center text-[16px] font-medium text-white">Homepage</Text>
          </Pressable>
        </View>
      </ScrollView>

      <BottomQuickNav />
    </View>
  );
}
