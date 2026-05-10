import { useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { goBackOr } from "../../lib/navigation/go-back-or";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { BackIcon, BellDarkIcon } from "../../components/ui/general-ui";
import { HeartOutlineIcon, TabIcon } from "../../components/ui/home-ui";
import { CachedImage, prefetchImageUris } from "../../components/ui/cached-image";
import { type ApiProduct, formatMoney, getFeaturedProductsPage, getOrders, resolveProductCardImageUrl } from "../../lib/api/shop";
import { useCheckoutStore } from "../../store/checkout-store";
import { useAppTheme } from "../../lib/theme/theme-provider";

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
      className="mr-3 w-[150px] overflow-hidden rounded-[6px] shadow-sm"
      style={{ backgroundColor: colors.card }}
    >
      <View className="relative h-[110px] overflow-hidden" style={{ backgroundColor: colors.elevated }}>
        {imageUrl ? <CachedImage uri={imageUrl} className="h-full w-full" /> : null}
        <View className="absolute right-3 top-3">
          <HeartOutlineIcon color={colors.primary} size={20} />
        </View>
      </View>
      <View className="px-2.5 pb-3 pt-3">
        <Text className="text-[12px] font-medium" style={{ color: colors.text }} numberOfLines={1}>{product.title}</Text>
        <Text className="mt-1 text-[14px] font-medium" style={{ color: colors.text }}>{price}</Text>
        <Text className="mt-1 text-[9px]" style={{ color: colors.textMuted }}>
          {rating > 0 ? `★ ${rating.toFixed(1)}` : "No ratings yet"}
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
      <View className="flex-row items-center justify-between rounded-[12px] px-7 py-4" style={{ backgroundColor: colors.card }}>
        {items.map((item) => (
          <Pressable key={item.routeName} onPress={() => onNavigate(item.path)}>
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
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              void loadData();
            }}
          />
        }
      >
        <View className="px-4 pb-3" style={{ paddingTop: Math.max(insets.top + 4, 12), backgroundColor: colors.background }}>
          <View className="mb-4 flex-row items-center justify-between">
            <Pressable className="h-8 w-8 items-center justify-center" hitSlop={12} onPress={() => goBackOr(router)}>
              <BackIcon />
            </Pressable>
            <BellDarkIcon />
          </View>

          <Text className="text-[24px] font-medium" style={{ color: colors.text }}>Order Overview</Text>

          <View className="mt-4 rounded-[10px] border px-4 py-4" style={{ borderColor: colors.primary, backgroundColor: colors.card }}>
            <View className="items-center">
              <SuccessBadgeIcon />
              <Text className="mt-3 text-[16px] font-medium" style={{ color: colors.text }}>Payment Has Been Confirmed</Text>
              <Text className="mt-1 text-center text-[13px]" style={{ color: colors.textMuted }}>Order ID: {activeOrderId}</Text>
              {orderDate ? <Text className="mt-1 text-center text-[12px]" style={{ color: colors.textMuted }}>Date: {orderDate}</Text> : null}
            </View>

            <View className="mt-4 flex-row justify-between">
              <View>
                <Text className="text-[14px]" style={{ color: colors.text }}>Total *{itemCount || 1}</Text>
                <Text className="mt-1 text-[20px] font-medium" style={{ color: colors.text }}>{formatMoney(totalAmount)}</Text>
              </View>
              <View>
                <Text className="text-[14px]" style={{ color: colors.text }}>Est. Delivery</Text>
                <Text className="mt-1 text-[20px] font-medium" style={{ color: colors.text }}>{estDeliveryRange}</Text>
              </View>
            </View>
          </View>

          <View className="mb-4 mt-7 flex-row items-center justify-between">
            <Text className="text-[16px] font-medium text-primary">Recommendations</Text>
            <Pressable onPress={() => router.push("/featured")}>
            <Text className="text-[14px] underline" style={{ color: colors.text }}>More</Text>
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

          <Pressable onPress={() => router.replace("/(tabs)")} className="mt-8 rounded-full bg-primary py-3.5">
            <Text className="text-center text-[16px] font-medium text-white">Homepage</Text>
          </Pressable>
        </View>
      </ScrollView>

      <BottomQuickNav colors={colors} onNavigate={(path) => router.push(path)} />
    </View>
  );
}




