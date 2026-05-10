import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { goBackOr } from "../../lib/navigation/go-back-or";
import { BackIcon, BellDarkIcon, SearchGrayIcon } from "../../components/ui/general-ui";
import { HeartOutlineIcon } from "../../components/ui/home-ui";
import { applyProductFilters } from "../../lib/search/product-filters";
import { formatMoney, getFeaturedProductsPage, isExplicitlyOutOfStock, resolveProductCardImageUrl, type ApiProduct } from "../../lib/api/shop";
import { useProductFilterStore } from "../../store/product-filter-store";
import { notifyError } from "../../lib/ui/notify";
import { CachedImage } from "../../components/ui/cached-image";
import { useAppTheme } from "../../lib/theme/theme-provider";
import { ProductGridSkeleton } from "../../components/ui/loading-skeleton";

function FeaturedCard({ item, onPress }: { item: ApiProduct; onPress: () => void }) {
  const { colors } = useAppTheme();
  const price = formatMoney(item.price);
  const oldPrice = item.old_price ? formatMoney(item.old_price) : null;
  const discount = Number(item.discount_percentage ?? 0);
  const isOutOfStock = isExplicitlyOutOfStock(item.in_stock);
  return (
    <Pressable
      onPress={onPress}
      className="mb-4 w-[48%] overflow-hidden rounded-[6px] shadow-sm"
      style={{ backgroundColor: colors.card }}
    >
      <View className="relative h-[112px] overflow-hidden" style={{ backgroundColor: colors.elevated }}>
        {discount > 0 ? (
          <View className="absolute left-2 top-2 z-10 rounded-full bg-primary px-2 py-0.5">
            <Text className="text-[9px] font-semibold text-white">{`-${Math.round(discount)}%`}</Text>
          </View>
        ) : null}
        {item.image ? <CachedImage uri={resolveProductCardImageUrl(item.image)!} className="h-full w-full" /> : null}
        {isOutOfStock ? (
          <View className="absolute z-20 rounded-full bg-black/65 px-2 py-0.5" style={{ left: 8, bottom: 8 }}>
            <Text className="text-[9px] font-semibold text-white">Out of stock</Text>
          </View>
        ) : null}
        <View className="absolute right-3 top-3">
          <HeartOutlineIcon color="#FF9F0A" size={19} />
        </View>
      </View>
      <View className="px-2.5 pb-3 pt-3.5">
        <Text numberOfLines={2} className="text-[12px] font-medium" style={{ color: colors.text }}>
          {item.title}
        </Text>
        <View className="mt-1 flex-row items-center gap-1">
          <Text className="text-[15px] font-semibold" style={{ color: colors.text }}>{price}</Text>
          {oldPrice && oldPrice !== price ? (
            <Text className="text-[11px] line-through" style={{ color: colors.textMuted }}>{oldPrice}</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export default function FeaturedScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const contentMaxWidth = width >= 900 ? 980 : undefined;
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [items, setItems] = useState<ApiProduct[]>([]);
  const filters = useProductFilterStore();

  const loadInitial = useCallback(async () => {
    try {
      setIsLoading(true);
      const page = await getFeaturedProductsPage({ page: 1 });
      setItems(page.results);
      setNextUrl(page.next);
    } catch {
      setItems([]);
      setNextUrl(null);
      notifyError("Featured failed", "Unable to load featured products right now.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  async function loadMore() {
    if (!nextUrl || isLoadingMore || isLoading) return;
    try {
      setIsLoadingMore(true);
      const page = await getFeaturedProductsPage({ nextUrl });
      setItems((prev) => [...prev, ...page.results]);
      setNextUrl(page.next);
    } catch {
      notifyError("Load failed", "Unable to load more products.");
    } finally {
      setIsLoadingMore(false);
    }
  }

  function handleScroll(event: any) {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const remaining = contentSize.height - (layoutMeasurement.height + contentOffset.y);
    if (remaining < 180) {
      void loadMore();
    }
  }

  const filteredItems = applyProductFilters(items, {
    ...filters,
    category: "",
    subcategory: "",
    leveltwo: "",
  });

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0, 1]}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              void loadInitial().finally(() => setIsRefreshing(false));
            }}
          />
        }
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View
          className="px-4 pb-2"
          style={{ width: "100%", maxWidth: contentMaxWidth, alignSelf: "center", paddingTop: Math.max(insets.top + 4, 12), backgroundColor: colors.background }}
        >
          <View className="mb-3 flex-row items-center justify-between">
            <Pressable className="h-8 w-8 items-center justify-center" hitSlop={12} onPress={() => goBackOr(router)}>
              <BackIcon />
            </Pressable>
            <View className="flex-row items-center gap-4">
              <Pressable onPress={() => router.push("/search")}>
                <SearchGrayIcon />
              </Pressable>
              <BellDarkIcon />
            </View>
          </View>
        </View>
        <View style={{ width: "100%", maxWidth: contentMaxWidth, alignSelf: "center", backgroundColor: colors.background }} className="px-4 pb-4 pt-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-[24px] font-semibold" style={{ color: colors.text }}>Featured</Text>
            <Pressable onPress={() => router.push("/filters")} className="rounded-[6px] border border-primary px-3 py-1.5">
              <Text className="text-[12px] font-semibold text-primary">Filter</Text>
            </Pressable>
          </View>
          <Text className="mt-2 text-[13px]" style={{ color: colors.textMuted }}>Showing only featured products.</Text>
        </View>
        <View style={{ width: "100%", maxWidth: contentMaxWidth, alignSelf: "center" }} className="px-4 pt-6">
          {isLoading ? (
            <View className="py-4">
              <ProductGridSkeleton rows={3} />
            </View>
          ) : filteredItems.length === 0 ? (
            <View className="py-12">
              <Text className="text-center text-[14px]" style={{ color: colors.textMuted }}>No featured products available now.</Text>
              <Pressable onPress={() => router.push("/(tabs)")} className="mt-5 self-center rounded-full bg-primary px-6 py-3">
                <Text className="text-[13px] font-semibold text-white">Explore Products</Text>
              </Pressable>
            </View>
          ) : (
            <View className="flex-row flex-wrap justify-between">
              {filteredItems.map((item) => (
                <FeaturedCard
                  key={String(item.id ?? item.pid)}
                  item={item}
                  onPress={() =>
                    router.push({
                      pathname: "/product/[slug]",
                      params: { slug: String(item.id ?? item.pid), name: item.title, price: formatMoney(item.price) },
                    })
                  }
                />
              ))}
            </View>
          )}
          {isLoadingMore ? (
            <View className="items-center py-4">
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

