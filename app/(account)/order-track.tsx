import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { BackIcon } from "../../components/ui/general-ui";
import { getOrderByOid, type ApiOrder } from "../../lib/api/shop";

const ORDER_FLOW = ["Placed", "Confirmed", "Paid", "Processing", "Shipped", "Delivered"] as const;
const TERMINAL_FLOW = ["Canceled", "Refunded"] as const;

function normalizeStatus(status?: string | null) {
  const value = String(status ?? "").trim().toLowerCase();
  if (value === "canceled" || value === "cancelled") return "Canceled";
  if (value === "refunded") return "Refunded";
  if (value === "placed") return "Placed";
  if (value === "confirmed") return "Confirmed";
  if (value === "paid") return "Paid";
  if (value === "processing") return "Processing";
  if (value === "shipped") return "Shipped";
  if (value === "delivered") return "Delivered";
  return "Placed";
}

function getStatusColor(status: string) {
  if (status === "Delivered") return "#16A34A";
  if (status === "Shipped") return "#2563EB";
  if (status === "Processing") return "#7C3AED";
  if (status === "Paid") return "#0EA5E9";
  if (status === "Confirmed") return "#0F766E";
  if (status === "Placed") return "#FF9F0A";
  if (status === "Canceled") return "#DC2626";
  if (status === "Refunded") return "#B45309";
  return "#FF9F0A";
}

export default function OrderTrackScreen() {
  const params = useLocalSearchParams<{ oid?: string; status?: string; trackingId?: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState<ApiOrder | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!params.oid) {
        setIsLoading(false);
        return;
      }
      try {
        const data = await getOrderByOid(params.oid);
        if (!mounted) return;
        setOrder(data);
      } catch {
        if (!mounted) return;
        setOrder(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [params.oid]);

  const status = normalizeStatus((order?.product_status as string | undefined) ?? params.status);
  const currentIndex = ORDER_FLOW.indexOf(status as (typeof ORDER_FLOW)[number]);

  const timelineRows = useMemo(
    () =>
      ORDER_FLOW.map((step, index) => ({
        step,
        done: currentIndex >= index && currentIndex !== -1,
        active: currentIndex === index,
      })),
    [currentIndex],
  );

  return (
    <View className="flex-1 bg-[#F7F7F7]">
      <View className="flex-row items-center px-3 pt-3">
        <Pressable className="h-8 w-8 items-center justify-center" onPress={() => router.back()}>
          <BackIcon />
        </Pressable>
        <Text className="flex-1 text-center text-[24px] font-medium text-[#2F2F2F]">Track Order</Text>
        <View className="w-8" />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#FF9B00" />
        </View>
      ) : (
        <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 24 }}>
          <View className="rounded-[12px] border border-[#E2E2E2] bg-white px-4 py-4">
            <Text className="text-[14px] text-[#666]">Order ID</Text>
            <Text className="mt-1 text-[16px] font-semibold text-[#2D2D2D]">{params.oid ?? "N/A"}</Text>
            <Text className="mt-3 text-[14px] text-[#666]">Tracking ID</Text>
            <Text className="mt-1 text-[16px] font-semibold text-[#2D2D2D]">
              {(order?.tracking_id as string | undefined) ?? params.trackingId ?? "Pending assignment"}
            </Text>
            <Text className="mt-3 text-[14px] text-[#666]">Current Status</Text>
            <Text className="mt-1 text-[16px] font-semibold" style={{ color: getStatusColor(status) }}>
              {status}
            </Text>
          </View>

          <View className="mt-5 rounded-[12px] border border-[#E2E2E2] bg-white px-4 py-3">
            <Text className="mb-3 text-[16px] font-medium text-[#2D2D2D]">Delivery Timeline</Text>
            {timelineRows.map((item) => (
              <View key={item.step} className="mb-3 flex-row items-center">
                <View
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.done ? getStatusColor(item.step) : "#D1D1D1" }}
                />
                <Text className={`ml-3 text-[14px] ${item.active ? "font-semibold text-[#2D2D2D]" : "text-[#6B6B6B]"}`}>
                  {item.step}
                </Text>
              </View>
            ))}
            {TERMINAL_FLOW.includes(status as (typeof TERMINAL_FLOW)[number]) ? (
              <View className="mt-2 rounded-[10px] border border-[#F2D3D3] bg-[#FFF4F4] px-3 py-2">
                <Text className="text-[13px] font-medium" style={{ color: getStatusColor(status) }}>
                  Terminal Status: {status}
                </Text>
              </View>
            ) : null}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
