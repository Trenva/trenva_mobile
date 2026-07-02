import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CategorySearchBar, CategoryTile } from "../../components/ui/category-ui";
import {
  type ApiCategory,
  type ApiProduct,
  formatMoney,
  getCategories,
  getPublishedProductsPage,
  isExplicitlyOutOfStock,
  resolveProductCardImageUrl,
} from "../../lib/api/shop";
import { useProductFilterStore } from "../../store/product-filter-store";
import { notifyError } from "../../lib/ui/notify";
import { useAppTheme } from "../../lib/theme/theme-provider";
import { CachedImage, ProductCardImage } from "../../components/ui/cached-image";
import { ProductGridSkeleton } from "../../components/ui/loading-skeleton";
import { getCached, setCached } from "../../lib/cache/memory-cache";
import { getResponsiveProductGrid } from "../../lib/ui/responsive-product-grid";

function formatCategoryLabel(value: string) {
  const trimmed = value.trim();
  if (trimmed.length <= 14) return trimmed;
  const words = trimmed.split(" ");
  if (words.length <= 1) return trimmed;

  const firstLine = words.slice(0, Math.ceil(words.length / 2)).join(" ");
  const secondLine = words.slice(Math.ceil(words.length / 2)).join(" ");
  return `${firstLine}\n${secondLine}`;
}

export default function CategoriesScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const trendingGrid = getResponsiveProductGrid({ width });
  const tileColumns = width >= 1100 ? 5 : width >= 768 ? 4 : 3;
  const tileGap = width >= 768 ? 16 : 0;
  const tileWidth = width >= 768 ? Math.floor((width - 40 - tileGap * (tileColumns - 1)) / tileColumns) : undefined;
  const tileIconSize = width >= 1100 ? 72 : width >= 768 ? 68 : 60;
  const tileFontSize = width >= 1100 ? 12 : width >= 768 ? 11.5 : 11;
  const [isLoading, setIsLoading] = useState(true);
  const [isTrendingLoading, setIsTrendingLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<ApiProduct[]>([]);
  const [trendingNextUrl, setTrendingNextUrl] = useState<string | null>(null);
  const resetFilters = useProductFilterStore((state) => state.resetFilters);
  const trendingCacheKey = "categories:trending:first-page";

  const loadTrendingFirstPage = useCallback(async () => {
    const cached = getCached<{ results: ApiProduct[]; next: string | null }>(trendingCacheKey);
    if (cached) {
      setTrendingProducts(cached.results);
      setTrendingNextUrl(cached.next);
      setIsTrendingLoading(false);
      return;
    }

    const page = await getPublishedProductsPage({ page: 1 });
    setTrendingProducts(page.results);
    setTrendingNextUrl(page.next);
    setCached(trendingCacheKey, { results: page.results, next: page.next }, 30_000);
    setIsTrendingLoading(false);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadCategories() {
      try {
        const data = await getCategories();
        if (!isMounted) return;
        setCategories(data);
        await loadTrendingFirstPage();
      } catch {
        if (!isMounted) return;
        setCategories([]);
        setTrendingProducts([]);
        setTrendingNextUrl(null);
        notifyError("Categories failed", "Unable to load categories right now.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsTrendingLoading(false);
        }
      }
    }

    void loadCategories();

    return () => {
      isMounted = false;
    };
  }, [loadTrendingFirstPage]);

  async function loadMoreTrending() {
    if (!trendingNextUrl || isLoadingMore || isTrendingLoading) return;
    try {
      setIsLoadingMore(true);
      const page = await getPublishedProductsPage({ nextUrl: trendingNextUrl });
      setTrendingProducts((prev) => [...prev, ...page.results]);
      setTrendingNextUrl(page.next);
    } catch {
      notifyError("Load failed", "Unable to load more trending items.");
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function refreshCategories() {
    setIsRefreshing(true);
    try {
      const [data, trendingPage] = await Promise.all([getCategories(), getPublishedProductsPage({ page: 1 })]);
      setCategories(data);
      setTrendingProducts(trendingPage.results);
      setTrendingNextUrl(trendingPage.next);
      setCached(trendingCacheKey, { results: trendingPage.results, next: trendingPage.next }, 30_000);
    } catch {
      notifyError("Refresh failed", "Unable to refresh categories.");
    } finally {
      setIsRefreshing(false);
    }
  }

  function handleScroll(event: any) {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const remaining = contentSize.height - (layoutMeasurement.height + contentOffset.y);
    if (remaining < 220) {
      void loadMoreTrending();
    }
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void refreshCategories()} />}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        stickyHeaderIndices={[0]}
      >
        <View className="px-5" style={{ paddingTop: Math.max(insets.top + 4, 12), backgroundColor: colors.background }}>
          <View className="flex-row items-center gap-4">
            <View className="flex-1">
              <CategorySearchBar
                onPress={() => {
                  resetFilters();
                  router.push("/search");
                }}
              />
            </View>
          </View>
        </View>

        <View className="px-5">
          <Text className="mb-8 mt-10 text-[17px] font-semibold" style={{ color: colors.text }}>Categories:</Text>

          {isLoading ? (
            <View className="items-center py-12">
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : categories.length === 0 ? (
            <Text className="py-8 text-center text-[14px]" style={{ color: colors.textMuted }}>No categories available right now.</Text>
          ) : (
            <View className={`flex-row flex-wrap ${width >= 768 ? "justify-center gap-4" : "justify-between"}`}>
              {categories.map((category) => (
                <CategoryTile
                  key={category.cid}
                  label={formatCategoryLabel(category.title)}
                  imageUrl={resolveProductCardImageUrl(category.image)}
                  width={tileWidth}
                  iconSize={tileIconSize}
                  fontSize={tileFontSize}
                  onPress={() =>
                    router.push({
                      pathname: "/category/[slug]",
                      params: { slug: category.cid, title: category.title },
                    })
                  }
                />
              ))}
            </View>
          )}

          <View className="mt-7">
            <Text className="mb-4 text-[17px] font-semibold" style={{ color: colors.text }}>Trending Items</Text>
            {isTrendingLoading ? (
              <ProductGridSkeleton rows={2} />
            ) : trendingProducts.length === 0 ? (
              <Text className="py-4 text-center text-[14px]" style={{ color: colors.textMuted }}>
                No trending items right now.
              </Text>
            ) : (
              <View className="flex-row flex-wrap justify-center gap-3">
                {trendingProducts.map((item) => {
                  const imageUrl = resolveProductCardImageUrl(item.image);
                  const oldPrice = item.old_price ? formatMoney(item.old_price) : null;
                  const price = formatMoney(item.price);
                  const isOutOfStock = isExplicitlyOutOfStock(item.in_stock);
                  return (
                    <Pressable
                      key={String(item.id ?? item.pid)}
                      onPress={() =>
                        router.push({
                          pathname: "/product/[slug]",
                          params: { slug: String(item.id ?? item.pid), name: item.title, price },
                        })
                      }
                      className="mb-4 overflow-hidden rounded-[8px]"
                      style={{ backgroundColor: colors.card, width: trendingGrid.cardWidth }}
                    >
                      <View className="relative overflow-hidden" style={{ backgroundColor: colors.elevated, height: trendingGrid.imageHeight }}>
                        {imageUrl ? <ProductCardImage uri={imageUrl} className="h-full w-full" /> : null}
                        {isOutOfStock ? (
                          <View className="absolute z-20 rounded-full bg-black/65 px-2 py-0.5" style={{ left: 8, bottom: 8 }}>
                            <Text className="text-[9px] font-semibold text-white">Out of stock</Text>
                          </View>
                        ) : null}
                      </View>
                      <View className="px-2.5 pb-3 pt-3">
                        <Text numberOfLines={2} className="text-[12px] font-medium" style={{ color: colors.text }}>
                          {item.title}
                        </Text>
                        <View className="mt-1 flex-row items-center gap-1">
                          <Text className="text-[14px] font-semibold" style={{ color: colors.text }}>{price}</Text>
                          {oldPrice && oldPrice !== price ? (
                            <Text className="text-[11px] line-through" style={{ color: colors.textMuted }}>{oldPrice}</Text>
                          ) : null}
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
            {isLoadingMore ? (
              <View className="items-center pb-3">
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
