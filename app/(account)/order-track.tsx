import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { goBackOr } from "../../lib/navigation/go-back-or";
import { BackIcon } from "../../components/ui/general-ui";
import { getOrderByOid, type ApiOrder } from "../../lib/api/shop";
import { useAppTheme } from "../../lib/theme/theme-provider";

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
  const router = useRouter();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
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
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="flex-row items-center px-3" style={{ paddingTop: Math.max(insets.top + 4, 12) }}>
        <Pressable className="h-8 w-8 items-center justify-center" hitSlop={12} onPress={() => goBackOr(router)}>
          <BackIcon />
        </Pressable>
        <Text className="flex-1 text-center text-[24px] font-medium" style={{ color: colors.text }}>Track Order</Text>
        <View className="w-8" />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 24 }}>
          <View className="rounded-[12px] border px-4 py-4" style={{ borderColor: colors.border, backgroundColor: colors.card }}>
            <Text className="text-[14px]" style={{ color: colors.textMuted }}>Order ID</Text>
            <Text className="mt-1 text-[16px] font-semibold" style={{ color: colors.text }}>{params.oid ?? "N/A"}</Text>
            <Text className="mt-3 text-[14px]" style={{ color: colors.textMuted }}>Tracking ID</Text>
            <Text className="mt-1 text-[16px] font-semibold" style={{ color: colors.text }}>
              {(order?.tracking_id as string | undefined) ?? params.trackingId ?? "Pending assignment"}
            </Text>
            <Text className="mt-3 text-[14px]" style={{ color: colors.textMuted }}>Current Status</Text>
            <Text className="mt-1 text-[16px] font-semibold" style={{ color: getStatusColor(status) }}>
              {status}
            </Text>
          </View>

          <View className="mt-5 rounded-[12px] border px-4 py-3" style={{ borderColor: colors.border, backgroundColor: colors.card }}>
            <Text className="mb-3 text-[16px] font-medium" style={{ color: colors.text }}>Delivery Timeline</Text>
            {timelineRows.map((item) => (
              <View key={item.step} className="mb-3 flex-row items-center">
                <View
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.done ? getStatusColor(item.step) : colors.border }}
                />
                <Text className={`ml-3 text-[14px] ${item.active ? "font-semibold" : ""}`} style={{ color: item.active ? colors.text : colors.textMuted }}>
                  {item.step}
                </Text>
              </View>
            ))}
            {TERMINAL_FLOW.includes(status as (typeof TERMINAL_FLOW)[number]) ? (
              <View className="mt-2 rounded-[10px] border px-3 py-2" style={{ borderColor: colors.border, backgroundColor: colors.elevated }}>
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




