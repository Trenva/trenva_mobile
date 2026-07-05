import { Fragment, useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { goBackOr } from "../../lib/navigation/go-back-or";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { BackIcon, BellDarkIcon } from "../../components/ui/general-ui";
import { HeartOutlineIcon, TabIcon } from "../../components/ui/home-ui";
import { ProductCardImage, prefetchImageUris } from "../../components/ui/cached-image";
import { type ApiProduct, formatMoney, getFeaturedProductsPage, getOrders, resolveProductCardImageUrl } from "../../lib/api/shop";
import { useCheckoutStore } from "../../store/checkout-store";
import { useAppTheme } from "../../lib/theme/theme-provider";

function CheckIcon({ size = 28, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 13l4 4L19 7" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function StarIcon({ size = 10, color = "#FFB800" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.5l2.9 6.1 6.6.7-4.9 4.5 1.3 6.6L12 17l-5.9 3.4 1.3-6.6-4.9-4.5 6.6-.7L12 2.5z"
        fill={color}
      />
    </Svg>
  );
}

function BagIcon({ size = 14, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 8h12l-1 12H7L6 8z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path d="M9 8V6a3 3 0 016 0v2" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

function TruckIcon({ size = 14, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 7h11v9H3z" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
      <Path d="M14 10h4l3 3v3h-7z" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
      <Path d="M7 19a1.6 1.6 0 100-3.2A1.6 1.6 0 007 19zM17.5 19a1.6 1.6 0 100-3.2 1.6 1.6 0 000 3.2z" fill={color} />
    </Svg>
  );
}

function SuccessBadge({ color }: { color: string }) {
  return (
    <View className="items-center justify-center" style={{ height: 96, width: 96 }}>
      <View
        className="absolute"
        style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: color, opacity: 0.12 }}
      />
      <View
        className="items-center justify-center"
        style={{
          width: 68,
          height: 68,
          borderRadius: 34,
          backgroundColor: color,
          shadowColor: color,
          shadowOpacity: 0.35,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4,
        }}
      >
        <CheckIcon size={30} />
      </View>
    </View>
  );
}

function OrderTimeline({ colors }: { colors: ReturnType<typeof useAppTheme>["colors"] }) {
  const steps = ["Placed", "Processing", "Shipped", "Delivered"];
  return (
    <View className="mt-5 flex-row items-start">
      {steps.map((step, i) => (
        <Fragment key={step}>
          <View className="items-center" style={{ width: 56 }}>
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: i === 0 ? colors.primary : "transparent",
                borderWidth: i === 0 ? 0 : 1.5,
                borderColor: colors.textMuted,
              }}
            />
            <Text
              className="mt-1.5 text-center text-[10px]"
              style={{ color: i === 0 ? colors.text : colors.textMuted, fontWeight: i === 0 ? "600" : "400" }}
            >
              {step}
            </Text>
          </View>
          {i < steps.length - 1 ? (
            <View style={{ flex: 1, height: 1.5, backgroundColor: colors.elevated, marginTop: 5 }} />
          ) : null}
        </Fragment>
      ))}
    </View>
  );
}

function RecommendationCard({
  product,
  colors,
  onPress,
}: {
  product: ApiProduct;
  colors: ReturnType<typeof useAppTheme>["colors"];
  onPress: () => void;
}) {
  const price = formatMoney(product.price);
  const imageUrl = resolveProductCardImageUrl(product.image);
  const rating = Number(product.average_rating ?? 0);
  return (
    <Pressable
      onPress={onPress}
      className="mr-3 w-[152px] overflow-hidden rounded-[14px]"
      style={{
        backgroundColor: colors.card,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
      }}
    >
      <View className="relative h-[130px] overflow-hidden" style={{ backgroundColor: colors.elevated }}>
        {imageUrl ? <ProductCardImage uri={imageUrl} className="h-full w-full" /> : null}
        <View
          className="absolute right-2.5 top-2.5 h-7 w-7 items-center justify-center rounded-full"
          style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
        >
          <HeartOutlineIcon color="#fff" size={16} />
        </View>
        {rating > 0 ? (
          <View
            className="absolute bottom-2.5 left-2.5 flex-row items-center gap-1 rounded-full px-2 py-1"
            style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
          >
            <StarIcon size={9} />
            <Text className="text-[10px] font-medium text-white">{rating.toFixed(1)}</Text>
          </View>
        ) : null}
      </View>
      <View className="px-3 pb-3 pt-2.5">
        <Text className="text-[12.5px] font-medium" style={{ color: colors.text }} numberOfLines={1}>
          {product.title}
        </Text>
        <Text className="mt-1 text-[14.5px] font-semibold" style={{ color: colors.text }}>
          {price}
        </Text>
      </View>
    </Pressable>
  );
}

function BottomQuickNav({
  colors,
  onNavigate,
}: {
  colors: ReturnType<typeof useAppTheme>["colors"];
  onNavigate: (path: "/(tabs)" | "/(tabs)/categories" | "/(tabs)/cart" | "/(tabs)/wishlist" | "/(tabs)/profile") => void;
}) {
  const items = [
    { routeName: "index", path: "/(tabs)" as const },
    { routeName: "categories", path: "/(tabs)/categories" as const },
    { routeName: "cart", path: "/(tabs)/cart" as const },
    { routeName: "wishlist", path: "/(tabs)/wishlist" as const },
    { routeName: "profile", path: "/(tabs)/profile" as const },
  ];

  return (
    <View className="px-4 pb-4 pt-2">
      <View
        className="flex-row items-center justify-between rounded-[18px] px-7 py-4"
        style={{
          backgroundColor: colors.card,
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -2 },
          elevation: 6,
        }}
      >
        {items.map((item) => (
          <Pressable key={item.routeName} onPress={() => onNavigate(item.path)} hitSlop={8}>
            <TabIcon routeName={item.routeName} color={colors.primary} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function OrderOverviewScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ orderId?: string; total?: string; items?: string }>();
  const lastOrderId = useCheckoutStore((state) => state.lastOrderId);
  const [orderDate, setOrderDate] = useState<string | null>(null);
  const [recommendedProducts, setRecommendedProducts] = useState<ApiProduct[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const activeOrderId = params.orderId || lastOrderId || "N/A";
  const totalAmount = Number(params.total ?? 0);
  const itemCount = Number(params.items ?? 0);

  async function loadData() {
    try {
      if (activeOrderId && activeOrderId !== "N/A") {
        const [orders, featured] = await Promise.all([getOrders(), getFeaturedProductsPage({ page: 1 })]);
        const found = orders.find((order) => order.oid === activeOrderId);
        if (found?.order_date) {
          const date = new Date(found.order_date);
          setOrderDate(Number.isNaN(date.getTime()) ? null : date.toLocaleDateString());
        } else {
          setOrderDate(null);
        }
        setRecommendedProducts(featured.results.slice(0, 10));
      } else {
        const featured = await getFeaturedProductsPage({ page: 1 });
        setOrderDate(null);
        setRecommendedProducts(featured.results.slice(0, 10));
      }
    } catch {
      setOrderDate(null);
      setRecommendedProducts([]);
    } finally {
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [activeOrderId]);

  const estDeliveryRange = useMemo(() => {
    const base = new Date();
    const start = new Date(base);
    const end = new Date(base);
    start.setDate(base.getDate() + 3);
    end.setDate(base.getDate() + 10);
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  }, []);

  useEffect(() => {
    prefetchImageUris(recommendedProducts.map((product) => resolveProductCardImageUrl(product.image)), 12);
  }, [recommendedProducts]);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); void loadData(); }} />
        }
      >
        <View className="px-4 pb-3" style={{ paddingTop: Math.max(insets.top + 4, 12), backgroundColor: colors.background }}>
          <View className="mb-4 flex-row items-center justify-between">
            <Pressable className="h-8 w-8 items-center justify-center" hitSlop={12} onPress={() => goBackOr(router)}>
              <BackIcon />
            </Pressable>
            <Text className="text-[16px] font-semibold" style={{ color: colors.text }}>Order Overview</Text>
            <Pressable onPress={() => router.push("/notifications")} hitSlop={12}>
              <BellDarkIcon />
            </Pressable>
          </View>

          {/* Hero / receipt card */}
          <View
            className="rounded-[20px] px-5 py-6"
            style={{
              backgroundColor: colors.card,
              shadowColor: "#000",
              shadowOpacity: 0.06,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 4 },
              elevation: 3,
            }}
          >
            <View className="items-center">
              <SuccessBadge color={colors.primary} />
              <Text className="mt-4 text-[18px] font-semibold" style={{ color: colors.text }}>
                Payment Confirmed
              </Text>
              <Text className="mt-1 text-center text-[13px]" style={{ color: colors.textMuted }}>
                Your order is being prepared
              </Text>

              <View
                className="mt-4 flex-row items-center gap-2 rounded-full px-3.5 py-1.5"
                style={{ backgroundColor: colors.elevated }}
              >
                <Text
                  className="text-[12px]"
                  style={{ color: colors.textMuted, fontFamily: "monospace" as const }}
                >
                  #{activeOrderId}
                </Text>
                {orderDate ? (
                  <>
                    <View style={{ width: 1, height: 10, backgroundColor: colors.textMuted, opacity: 0.4 }} />
                    <Text className="text-[12px]" style={{ color: colors.textMuted }}>{orderDate}</Text>
                  </>
                ) : null}
              </View>
            </View>

            <OrderTimeline colors={colors} />

            <View
              className="mt-6 flex-row items-center justify-between border-t pt-5"
              style={{ borderColor: colors.elevated, borderStyle: "dashed" }}
            >
              <View className="flex-1">
                <View className="flex-row items-center gap-1.5">
                  <BagIcon color={colors.textMuted} />
                  <Text className="text-[12px]" style={{ color: colors.textMuted }}>
                    Total ({itemCount || 1} item{itemCount === 1 ? "" : "s"})
                  </Text>
                </View>
                <Text className="mt-1.5 text-[18px] font-semibold" style={{ color: colors.text }}>
                  {formatMoney(totalAmount)}
                </Text>
              </View>
              <View className="flex-1 items-end">
                <View className="flex-row items-center gap-1.5">
                  <TruckIcon color={colors.textMuted} />
                  <Text className="text-[12px]" style={{ color: colors.textMuted }}>Est. Delivery</Text>
                </View>
                <Text className="mt-1.5 text-[13px] font-semibold" style={{ color: colors.text }}>
                  {estDeliveryRange}
                </Text>
              </View>
            </View>
          </View>

          <View className="mb-4 mt-7 flex-row items-center justify-between">
            <Text className="text-[16px] font-semibold" style={{ color: colors.text }}>You might also like</Text>
            <Pressable onPress={() => router.push("/featured")}>
              <Text className="text-[13px] font-medium" style={{ color: colors.primary }}>See all</Text>
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {recommendedProducts.map((product) => (
              <RecommendationCard
                key={String(product.id ?? product.pid)}
                product={product}
                colors={colors}
                onPress={() =>
                  router.push({
                    pathname: "/product/[slug]",
                    params: { slug: String(product.id ?? product.pid), name: product.title, price: formatMoney(product.price) },
                  })
                }
              />
            ))}
          </ScrollView>

          <Pressable
            onPress={() => router.replace("/(tabs)")}
            className="mt-8 rounded-full bg-primary py-4"
            style={{
              shadowColor: colors.primary,
              shadowOpacity: 0.3,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: 3,
            }}
          >
            <Text className="text-center text-[16px] font-semibold text-white">Back to Home</Text>
          </Pressable>
        </View>
      </ScrollView>

      <BottomQuickNav colors={colors} onNavigate={(path) => router.push(path)} />
    </View>
  );
}