import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackIcon, BellDarkIcon, SearchGrayIcon } from "../../components/ui/general-ui";
import { HeartOutlineIcon } from "../../components/ui/home-ui";
import { applyProductFilters } from "../../lib/search/product-filters";
import { formatMoney, getFlashSaleProductsPage, isExplicitlyOutOfStock, resolveProductCardImageUrl, type ApiFlashSaleProduct } from "../../lib/api/shop";
import { useProductFilterStore } from "../../store/product-filter-store";
import { notifyError } from "../../lib/ui/notify";
import { CachedImage } from "../../components/ui/cached-image";
import { useAppTheme } from "../../lib/theme/theme-provider";
import { LoadingListSkeleton } from "../../components/ui/loading-skeleton";

function FlashSaleCard({ item }: { item: ApiFlashSaleProduct }) {
  const { colors } = useAppTheme();
  const details = item.product_details;
  const priceValue = item.flash_sale_price ?? item.effective_price ?? details?.price ?? 0;
  const isOutOfStock = isExplicitlyOutOfStock(details?.in_stock);

  if (!details) return null;

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/product/[slug]",
          params: { slug: String(details.id ?? details.pid ?? item.product), name: details.title ?? "Product", price: formatMoney(priceValue) },
        })
      }
      className="mb-4 w-[48%] overflow-hidden rounded-[6px] shadow-sm"
      style={{ backgroundColor: colors.card }}
    >
      <View className="relative h-[112px] overflow-hidden" style={{ backgroundColor: colors.elevated }}>
        {details.image ? <CachedImage uri={resolveProductCardImageUrl(details.image)!} className="h-full w-full" /> : null}
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
          {details.title ?? "Flash Sale Product"}
        </Text>
        <Text className="mt-1 text-[15px] font-semibold" style={{ color: colors.primary }}>{formatMoney(priceValue)}</Text>
      </View>
    </Pressable>
  );
}

export default function FlashSalesScreen() {
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const contentMaxWidth = width >= 900 ? 980 : undefined;
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [items, setItems] = useState<ApiFlashSaleProduct[]>([]);
  const filters = useProductFilterStore();

  const loadInitial = useCallback(async () => {
    try {
      setIsLoading(true);
      const page = await getFlashSaleProductsPage({ active: true, page: 1 });
      setItems(page.results);
      setNextUrl(page.next);
    } catch {
      setItems([]);
      setNextUrl(null);
      notifyError("Flash sales failed", "Unable to load flash sale products right now.");
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
      const page = await getFlashSaleProductsPage({ nextUrl });
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

  const cleanItems = useMemo(() => items.filter((row) => Boolean(row.product_details)), [items]);
  const filteredItems = useMemo(() => {
    const virtualProducts = cleanItems.map((row) => ({
      id: row.product_details?.id ?? row.product,
      pid: String(row.product_details?.pid ?? row.product),
      title: row.product_details?.title ?? "Flash Sale Product",
      image: row.product_details?.image ?? null,
      price: row.flash_sale_price ?? row.effective_price ?? row.product_details?.price ?? 0,
      old_price: row.product_details?.old_price ?? null,
      average_rating: 0,
    }));

    const filteredVirtual = applyProductFilters(virtualProducts, {
      ...filters,
      category: "",
      subcategory: "",
      leveltwo: "",
    });

    const idSet = new Set(filteredVirtual.map((p) => Number(p.id)));
    return cleanItems.filter((row) => idSet.has(Number(row.product_details?.id ?? row.product)));
  }, [cleanItems, filters]);

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
            <Pressable className="h-8 w-8 items-center justify-center" onPress={() => router.back()}>
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
            <Text className="text-[24px] font-semibold" style={{ color: colors.text }}>Flash Sales</Text>
            <Pressable onPress={() => router.push("/filters")} className="rounded-[6px] border border-primary px-3 py-1.5">
              <Text className="text-[12px] font-semibold text-primary">Filter</Text>
            </Pressable>
          </View>
          <Text className="mt-2 text-[13px]" style={{ color: colors.textMuted }}>Showing only products currently in Flash Sale.</Text>
        </View>
        <View style={{ width: "100%", maxWidth: contentMaxWidth, alignSelf: "center" }} className="px-4 pt-6">
          {isLoading ? (
            <View className="py-4">
              <LoadingListSkeleton rows={3} />
            </View>
          ) : filteredItems.length === 0 ? (
            <View className="py-12">
              <Text className="text-center text-[14px]" style={{ color: colors.textMuted }}>No flash sale products available now.</Text>
              <Pressable onPress={() => router.push("/(tabs)")} className="mt-5 self-center rounded-full bg-primary px-6 py-3">
                <Text className="text-[13px] font-semibold text-white">Explore Products</Text>
              </Pressable>
            </View>
          ) : (
            <View className="flex-row flex-wrap justify-between">
              {filteredItems.map((item) => (
                <FlashSaleCard key={item.id} item={item} />
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
