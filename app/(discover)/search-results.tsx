import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { goBackOr } from "../../lib/navigation/go-back-or";
import { HeartOutlineIcon } from "../../components/ui/home-ui";
import { BackIcon, BellDarkIcon, SearchGrayIcon } from "../../components/ui/general-ui";
import { formatMoney, getPublishedProductsFilteredPage, isExplicitlyOutOfStock, resolveProductCardImageUrl, type ApiProduct } from "../../lib/api/shop";
import { applyProductFilters } from "../../lib/search/product-filters";
import { useProductFilterStore } from "../../store/product-filter-store";
import { notifyError } from "../../lib/ui/notify";
import { ProductCardImage } from "../../components/ui/cached-image";
import { useAppTheme } from "../../lib/theme/theme-provider";
import { ProductGridSkeleton } from "../../components/ui/loading-skeleton";
import { getResponsiveProductGrid } from "../../lib/ui/responsive-product-grid";

const ICON_HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 } as const;

function ResultCard({ item, onPress, width, imageHeight }: { item: ApiProduct; onPress: () => void; width: number; imageHeight: number }) {
  const { colors } = useAppTheme();
  const price = formatMoney(item.price);
  const oldPrice = item.old_price ? formatMoney(item.old_price) : null;
  const discount = Number(item.discount_percentage ?? 0);
  const isOutOfStock = isExplicitlyOutOfStock(item.in_stock);
  const imageUrl = resolveProductCardImageUrl(item.image);

  return (
    <Pressable
      onPress={onPress}
      className="mb-4 overflow-hidden rounded-[6px] shadow-sm"
      style={{ backgroundColor: colors.card, width }}
    >
      <View className="relative overflow-hidden" style={{ backgroundColor: colors.elevated, height: imageHeight }}>
        {discount > 0 ? (
          <View className="absolute left-2 top-2 z-10 rounded-full bg-primary px-2 py-0.5">
            <Text className="text-[9px] font-semibold text-white">{`-${Math.round(discount)}%`}</Text>
          </View>
        ) : null}
        {imageUrl ? <ProductCardImage uri={imageUrl} className="h-full w-full" /> : null}
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
          <Text className="text-[15px] font-medium" style={{ color: colors.text }}>{price}</Text>
          {oldPrice && oldPrice !== price ? (
            <Text className="text-[11px] line-through" style={{ color: colors.textMuted }}>{oldPrice}</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export default function SearchResultsScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const contentMaxWidth = width >= 900 ? 980 : undefined;
  const grid = getResponsiveProductGrid({ width });
  const { query, category, subcategory, leveltwo } = useLocalSearchParams<{
    query?: string;
    category?: string;
    subcategory?: string;
    leveltwo?: string;
  }>();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const {
    query: sharedQuery,
    category: sharedCategory,
    subcategory: sharedSubcategory,
    leveltwo: sharedLevelTwo,
    color,
    review,
    location,
    resolution,
    minPrice,
    maxPrice,
    sort,
    setFilters,
  } = useProductFilterStore();

  useEffect(() => {
    const nextQuery = query ?? sharedQuery;
    const nextCategory = category ?? sharedCategory;
    const nextSubcategory = subcategory ?? sharedSubcategory;
    const nextLevelTwo = leveltwo ?? sharedLevelTwo;

    setFilters({
      query: nextQuery ?? "",
      category: nextCategory ?? "",
      subcategory: nextSubcategory ?? "",
      leveltwo: nextLevelTwo ?? "",
    });
  }, [category, leveltwo, query, setFilters, sharedCategory, sharedLevelTwo, sharedQuery, sharedSubcategory, subcategory]);

  const keyword = sharedQuery || sharedLevelTwo || sharedSubcategory || sharedCategory || "Products";
  const minRatingFromReview = useMemo(() => {
    const value = (review ?? "").toLowerCase();
    if (value.includes("5")) return 5;
    if (value.includes("4")) return 4;
    if (value.includes("3")) return 3;
    if (value.includes("2")) return 2;
    if (value.includes("1")) return 1;
    return null;
  }, [review]);

  const loadInitial = useCallback(async () => {
    try {
      setIsLoading(true);
      const page = await getPublishedProductsFilteredPage({
        query: sharedQuery || undefined,
        categoryTitle: sharedCategory || undefined,
        subcategoryTitle: sharedSubcategory || undefined,
        levelTwoTitle: sharedLevelTwo || undefined,
        minPrice,
        maxPrice,
        minRating: minRatingFromReview,
        color: color || undefined,
        sort,
        page: 1,
      });
      setProducts(page.results);
      setNextUrl(page.next);
    } catch {
      setProducts([]);
      setNextUrl(null);
      notifyError("Search failed", "Unable to load products right now.");
    } finally {
      setIsLoading(false);
    }
  }, [color, maxPrice, minPrice, minRatingFromReview, sharedCategory, sharedLevelTwo, sharedQuery, sharedSubcategory, sort]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  const filteredResults = useMemo(
    () =>
      applyProductFilters(products, {
        query: "",
        category: "",
        subcategory: "",
        leveltwo: "",
        color: "",
        review,
        location,
        resolution,
        minPrice: null,
        maxPrice: null,
        sort: "relevance",
      }),
    [location, products, resolution, review],
  );

  async function loadMore() {
    if (!nextUrl || isLoadingMore || isLoading) return;
    try {
      setIsLoadingMore(true);
      const page = await getPublishedProductsFilteredPage({ nextUrl });
      setProducts((prev) => [...prev, ...page.results]);
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

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
        contentContainerStyle={{ paddingBottom: 20 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              void loadInitial().finally(() => setIsRefreshing(false));
            }}
          />
        }
      >
        <View
          style={{ width: "100%", maxWidth: contentMaxWidth, alignSelf: "center", paddingTop: Math.max(insets.top + 4, 12), backgroundColor: colors.background }}
          className="px-4 pb-2"
        >
          <View className="mb-3 flex-row items-center justify-between">
            <Pressable className="h-8 w-8 items-center justify-center" onPress={() => goBackOr(router)} hitSlop={ICON_HIT_SLOP}>
              <BackIcon />
            </Pressable>
            <View className="flex-row items-center gap-4">
              <Pressable onPress={() => router.push("/search")} hitSlop={ICON_HIT_SLOP}>
                <SearchGrayIcon />
              </Pressable>
              <Pressable onPress={() => router.push("/notifications")} hitSlop={12}>
                <BellDarkIcon />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={{ width: "100%", maxWidth: contentMaxWidth, alignSelf: "center", backgroundColor: colors.background }} className="px-4 pb-4 pt-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-[24px] font-semibold" style={{ color: colors.text }}>Search Results</Text>
            <Pressable onPress={() => router.push("/filters")} className="rounded-[6px] border border-primary px-3 py-1.5">
              <Text className="text-[12px] font-semibold text-primary">Filter</Text>
            </Pressable>
          </View>
        </View>

        <View style={{ width: "100%", maxWidth: contentMaxWidth, alignSelf: "center" }} className="px-4 pt-6">
          {isLoading ? (
            <View className="py-4">
              <ProductGridSkeleton rows={3} />
            </View>
          ) : filteredResults.length === 0 ? (
            <View className="py-12">
              <Text className="text-center text-[14px]" style={{ color: colors.textMuted }}>No products found for this filter.</Text>
              <Pressable onPress={() => router.push("/filters")} className="mt-5 self-center rounded-full bg-primary px-6 py-3">
                <Text className="text-[13px] font-semibold text-white">Refine Filters</Text>
              </Pressable>
            </View>
          ) : (
            <View className="flex-row flex-wrap justify-center gap-3">
              {filteredResults.map((item) => (
                <ResultCard
                  key={String(item.id ?? item.pid)}
                  item={item}
                  width={grid.cardWidth}
                  imageHeight={grid.imageHeight}
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
