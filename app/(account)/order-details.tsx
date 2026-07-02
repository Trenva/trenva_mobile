import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Linking, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackIcon } from "../../components/ui/general-ui";
import { CachedImage, ProductCardImage } from "../../components/ui/cached-image";
import { goBackOr } from "../../lib/navigation/go-back-or";
import { formatMoney, getOrderByOid, resolveProductCardImageUrl, type ApiOrder } from "../../lib/api/shop";
import { useAppTheme } from "../../lib/theme/theme-provider";

type ApiKwikpikTrackingDataEntry = NonNullable<ApiOrder["kwikpik_tracking_data"]>[string];
type OrderItem = NonNullable<ApiOrder["items"]>[number];

function getOrderItemSlug(item: OrderItem) {
  const rawSlug = item.id ?? item.pid ?? item.product;
  const slug = rawSlug !== undefined && rawSlug !== null ? String(rawSlug).trim() : "";
  return slug.length > 0 ? slug : null;
}

const ICON_HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 } as const;

function DetailRow({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();
  return (
    <View className="mb-2 flex-row items-start justify-between gap-3">
      <Text className="text-[13px]" style={{ color: colors.textMuted }}>{label}</Text>
      <Text className="max-w-[62%] text-right text-[13px]" style={{ color: colors.text }}>
        {value || "—"}
      </Text>
    </View>
  );
}

export default function OrderDetailsScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { oid } = useLocalSearchParams<{ oid?: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [order, setOrder] = useState<ApiOrder | null>(null);

  async function loadOrder() {
    if (!oid) {
      setOrder(null);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }
    try {
      const data = await getOrderByOid(oid);
      setOrder(data);
    } catch {
      setOrder(null);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    void loadOrder();
  }, [oid]);

  const orderDate = useMemo(
    () => (order?.order_date ? new Date(order.order_date).toLocaleString() : ""),
    [order?.order_date],
  );

  const itemCount = order?.items?.length ?? 0;
  const payable = Number(order?.price ?? 0);

  const kwikpikTrackingEntries = useMemo(() => {
    if (!order?.kwikpik_tracking_data) return [] as Array<[string, ApiKwikpikTrackingDataEntry]>;
    return Object.entries(order.kwikpik_tracking_data) as Array<[string, ApiKwikpikTrackingDataEntry]>;
  }, [order]);

  function getKwikpikStatusLabel(status?: string | null) {
    const value = String(status ?? "").toUpperCase();
    switch (value) {
      case "PENDING":
        return "⏳ Pending";
      case "PICKED_UP":
        return "📦 Picked Up";
      case "IN_TRANSIT":
        return "🚚 In Transit";
      case "OUT_FOR_DELIVERY":
        return "🚛 Out for Delivery";
      case "DELIVERED":
        return "✅ Delivered";
      default:
        return status ?? "Pending";
    }
  }

  function getKwikpikStatusColor(status?: string | null) {
    const value = String(status ?? "").toUpperCase();
    switch (value) {
      case "PENDING":
        return "#856404";
      case "PICKED_UP":
      case "IN_TRANSIT":
      case "OUT_FOR_DELIVERY":
        return "#004085";
      case "DELIVERED":
        return "#155724";
      default:
        return colors.textMuted;
    }
  }

  const hasKwikpikTracking = Boolean(order?.kwikpik_tracking_data && Object.keys(order.kwikpik_tracking_data).length) || Boolean(order?.kwikpik_tracking_id);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              void loadOrder();
            }}
          />
        }
      >
        <View className="flex-row items-center px-3 pb-3" style={{ paddingTop: Math.max(insets.top + 4, 12) }}>
          <Pressable className="h-8 w-8 items-center justify-center" onPress={() => goBackOr(router)} hitSlop={ICON_HIT_SLOP}>
            <BackIcon />
          </Pressable>
          <Text className="flex-1 text-center text-[24px] font-medium" style={{ color: colors.text }}>Order Details</Text>
          <View className="w-8" />
        </View>

        {isLoading ? (
          <View className="pt-12">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : !order ? (
          <View className="px-5 py-10">
            <Text className="text-center text-[14px]" style={{ color: colors.textMuted }}>
              Order not found.
            </Text>
          </View>
        ) : (
          <View className="px-4 pb-8">
            <View className="rounded-xl border p-4" style={{ borderColor: colors.border, backgroundColor: colors.card }}>
              <DetailRow label="Order Number" value={order.oid ?? ""} />
              <DetailRow label="Status" value={String(order.product_status ?? "Placed")} />
              <DetailRow label="Payment Method" value={String(order.payment_method ?? "N/A")} />
              <DetailRow label="Paid" value={order.paid_status ? "Yes" : "No"} />
              <DetailRow label="Coupon Used" value={order.coupon_used ? "Yes" : "No"} />
              <DetailRow label="Order Date" value={orderDate} />
              <DetailRow label="Kwikpik Tracking ID" value={order.kwikpik_tracking_id ?? "Not available"} />
              <DetailRow label="Delivery Address" value={String(order.address ?? "N/A")} />
              <DetailRow label="Delivery Method" value={String(order.delivery_method ?? "N/A")} />
              <DetailRow label="Items" value={String(itemCount)} />
              <DetailRow label="Total" value={formatMoney(payable)} />
            </View>

            {hasKwikpikTracking ? (
              <View className="mt-5 rounded-xl border p-4" style={{ borderColor: colors.border, backgroundColor: colors.card }}>
                <Text className="text-[16px] font-semibold" style={{ color: colors.text }}>Kwikpik Delivery Tracking</Text>
                {kwikpikTrackingEntries.length > 0 ? (
                  kwikpikTrackingEntries.map(([vendorId, trackingInfo]) => (
                    <View key={vendorId} className="mt-4 rounded-2xl border p-3" style={{ borderColor: colors.border, backgroundColor: colors.background }}>
                      <Text className="text-[14px] font-semibold" style={{ color: colors.text }}>
                        Vendor {vendorId}
                      </Text>
                      <View className="mt-3 flex-row items-center justify-between">
                        <Text className="text-[13px]" style={{ color: colors.textMuted }}>Tracking ID</Text>
                        <Text className="text-[13px] font-semibold" style={{ color: colors.text }}>
                          {trackingInfo?.tracking_id ?? "Pending"}
                        </Text>
                      </View>
                      {trackingInfo?.tracking_id ? (
                        <Pressable
                          onPress={() => Linking.openURL(`https://kwikpik.io/live-tracking?q=${trackingInfo.tracking_id}`)}
                          className="mt-2 rounded-full bg-primary px-3 py-2"
                        >
                          <Text className="text-[13px] font-medium text-white">Track on Kwikpik</Text>
                        </Pressable>
                      ) : null}
                      <View className="mt-3 flex-row items-center justify-between">
                        <Text className="text-[13px]" style={{ color: colors.textMuted }}>Status</Text>
                        <Text className="text-[13px] font-semibold" style={{ color: getKwikpikStatusColor(trackingInfo?.live_status ?? trackingInfo?.status) }}>
                          {getKwikpikStatusLabel(trackingInfo?.live_status ?? trackingInfo?.status)}
                        </Text>
                      </View>
                      {trackingInfo?.rider_name ? (
                        <View className="mt-3 flex-row items-center justify-between">
                          <Text className="text-[13px]" style={{ color: colors.textMuted }}>Rider</Text>
                          <Text className="text-[13px] font-semibold" style={{ color: colors.text }}>
                            {trackingInfo.rider_name}
                          </Text>
                        </View>
                      ) : null}
                      {trackingInfo?.rider_phone ? (
                        <Pressable
                          onPress={() => Linking.openURL(`tel:${trackingInfo.rider_phone}`)}
                          className="mt-2 rounded-full border px-3 py-2"
                          style={{ borderColor: colors.primary }}
                        >
                          <Text className="text-[13px] font-medium" style={{ color: colors.primary }}>
                            Call Rider
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>
                  ))
                ) : (
                  <View className="mt-4 rounded-2xl border p-3" style={{ borderColor: colors.border, backgroundColor: colors.background }}>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-[13px]" style={{ color: colors.textMuted }}>Tracking ID</Text>
                      <Text className="text-[13px] font-semibold" style={{ color: colors.text }}>
                        {order.kwikpik_tracking_id ?? "Pending"}
                      </Text>
                    </View>
                    {order.kwikpik_tracking_id ? (
                      <Pressable
                        onPress={() => Linking.openURL(`https://kwikpik.io/live-tracking?q=${order.kwikpik_tracking_id}`)}
                        className="mt-2 rounded-full bg-primary px-3 py-2"
                      >
                        <Text className="text-[13px] font-medium text-white">Track on Kwikpik</Text>
                      </Pressable>
                    ) : null}
                    <View className="mt-3 flex-row items-center justify-between">
                      <Text className="text-[13px]" style={{ color: colors.textMuted }}>Status</Text>
                      <Text className="text-[13px] font-semibold" style={{ color: getKwikpikStatusColor(order.kwikpik_tracking?.status || order.kwikpik_tracking?.live_status) }}>
                        {getKwikpikStatusLabel(order.kwikpik_tracking?.status || order.kwikpik_tracking?.live_status)}
                      </Text>
                    </View>
                    {order.kwikpik_tracking?.rider_name ? (
                      <View className="mt-3 flex-row items-center justify-between">
                        <Text className="text-[13px]" style={{ color: colors.textMuted }}>Rider</Text>
                        <Text className="text-[13px] font-semibold" style={{ color: colors.text }}>
                          {order.kwikpik_tracking.rider_name}
                        </Text>
                      </View>
                    ) : null}
                    {order.kwikpik_tracking?.rider_phone ? (
                      <Pressable
                        onPress={() => Linking.openURL(`tel:${order.kwikpik_tracking?.rider_phone}`)}
                        className="mt-2 rounded-full border px-3 py-2"
                        style={{ borderColor: colors.primary }}
                      >
                        <Text className="text-[13px] font-medium" style={{ color: colors.primary }}>
                          Call Rider
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                )}
              </View>
            ) : null}

            <Text className="mt-5 text-[16px] font-medium" style={{ color: colors.text }}>Items in this order</Text>
            <View className="mt-2">
              {(order.items ?? []).map((item, index) => {
                const itemImageUri = resolveProductCardImageUrl(item.image);
                const productSlug = getOrderItemSlug(item);
                return (
                  <Pressable
                    key={`${item.id ?? index}-${productSlug ?? "unknown"}`}
                    onPress={() => {
                      if (!productSlug) return;
                      router.push({ pathname: "/product/[slug]", params: { slug: item.product_ref, name: item.product_name, price: item.price }, });
                    }}
                    className="mb-2 overflow-hidden rounded-xl border"
                    style={{ borderColor: colors.border, backgroundColor: colors.card }}
                    android_ripple={{ color: colors.border }}
                  >
                    <View className="flex-row items-center p-3">
                      <View className="h-[74px] w-[88px] overflow-hidden rounded-md" style={{ backgroundColor: colors.elevated }}>
                        {itemImageUri ? <ProductCardImage uri={itemImageUri} className="h-full w-full" /> : null}
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="text-[14px]" style={{ color: colors.text }}>
                          {item.product_name ?? item.item ?? "Product"}
                        </Text>
                        <Text className="mt-1 text-[12px]" style={{ color: colors.textMuted }}>
                          Qty: {item.qty ?? 1}
                        </Text>
                        <Text className="mt-1 text-[12px]" style={{ color: colors.textMuted }}>
                          Color: {item.product_color ?? "Default"} • Size: {item.product_size ?? "Default"}
                        </Text>
                        <Text className="mt-1 text-[15px] font-medium" style={{ color: colors.text }}>
                          {formatMoney(item.total ?? item.price)}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
