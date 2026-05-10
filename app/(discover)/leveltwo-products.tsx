import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { goBackOr } from "../../lib/navigation/go-back-or";
import { BackIcon, BellDarkIcon, SearchGrayIcon } from "../../components/ui/general-ui";
import { HeartOutlineIcon } from "../../components/ui/home-ui";
import { applyProductFilters } from "../../lib/search/product-filters";
import { formatMoney, getPublishedProductsFiltered, isExplicitlyOutOfStock, resolveProductCardImageUrl, type ApiProduct } from "../../lib/api/shop";
import { useProductFilterStore } from "../../store/product-filter-store";
import { notifyError } from "../../lib/ui/notify";
import { CachedImage } from "../../components/ui/cached-image";
import { useAppTheme } from "../../lib/theme/theme-provider";
import { ProductGridSkeleton } from "../../components/ui/loading-skeleton";

function ProductCard({ item, onPress }: { item: ApiProduct; onPress: () => void }) {
  const { colors } = useAppTheme();
  const price = formatMoney(item.price);
  const oldPrice = item.old_price ? formatMoney(item.old_price) : null;
  const discount = Number(item.discount_percentage ?? 0);
  const isOutOfStock = isExplicitlyOutOfStock(item.in_stock);
  const imageUrl = resolveProductCardImageUrl(item.image);
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
        {imageUrl ? <CachedImage uri={imageUrl} className="h-full w-full" /> : null}
        {isOutOfStock ? (
          <View className="absolute z-20 rounded-full bg-black/65 px-2 py-0.5" style={{ left: 8, bottom: 8 }}>
            <Text className="text-[9px] font-semibold text-white">Out of stock</Text>
          </View>
        ) : null}
        <View className="absolute right-3 top-3"><HeartOutlineIcon color="#FF9F0A" size={19} /></View>
      </View>
      <View className="px-2.5 pb-3 pt-3.5">
        <Text numberOfLines={2} className="text-[12px] font-medium" style={{ color: colors.text }}>{item.title}</Text>
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

export default function LevelTwoProductsScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const contentMaxWidth = width >= 900 ? 980 : undefined;
  const { category, subcategory, leveltwo } = useLocalSearchParams<{ category?: string; subcategory?: string; leveltwo?: string }>();
  const categoryTitle = (category ?? "Category").trim();
  const subcategoryTitle = (subcategory ?? "Subcategory").trim();
  const levelTwoTitle = (leveltwo ?? "Products").trim();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const filters = useProductFilterStore();
  const resetFilters = useProductFilterStore((state) => state.resetFilters);

  useEffect(() => {
    resetFilters();
  }, [categoryTitle, subcategoryTitle, levelTwoTitle, resetFilters]);

  const loadInitial = useCallback(async () => {
    try {
      setIsLoading(true);
      const rows = await getPublishedProductsFiltered({
        categoryTitle,
        subcategoryTitle,
        levelTwoTitle,
      });
      setProducts(rows);
    } catch {
      setProducts([]);
      notifyError("Level-two failed", "Unable to load level-two products right now.");
    } finally {
      setIsLoading(false);
    }
  }, [categoryTitle, subcategoryTitle, levelTwoTitle]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  const filteredProducts = useMemo(
    () =>
      applyProductFilters(products, {
        ...filters,
        query: filters.query,
        category: "",
        subcategory: "",
        leveltwo: "",
      }),
    [filters, products],
  );

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
      >
        <View
          className="px-4 pb-2"
          style={{ width: "100%", maxWidth: contentMaxWidth, alignSelf: "center", paddingTop: Math.max(insets.top + 4, 12), backgroundColor: colors.background }}
        >
          <View className="mb-3 flex-row items-center justify-between">
            <Pressable className="h-8 w-8 items-center justify-center" hitSlop={12} onPress={() => goBackOr(router)}><BackIcon /></Pressable>
            <View className="flex-row items-center gap-4">
              <Pressable onPress={() => router.push("/search")}><SearchGrayIcon /></Pressable>
              <BellDarkIcon />
            </View>
          </View>
        </View>

        <View style={{ width: "100%", maxWidth: contentMaxWidth, alignSelf: "center", backgroundColor: colors.background }} className="px-4 pb-4 pt-2">
          <View className="flex-row items-center justify-between">
            <View className="pr-3">
              <Text numberOfLines={1} className="text-[11px]" style={{ color: colors.textMuted }}>
                {categoryTitle} {" > "} {subcategoryTitle} {" > "} {levelTwoTitle}
              </Text>
              <Text className="text-[12px]" style={{ color: colors.textMuted }}>{categoryTitle} - {subcategoryTitle}</Text>
              <Text numberOfLines={2} className="text-[21px] font-semibold" style={{ color: colors.text }}>{levelTwoTitle}</Text>
            </View>
            <Pressable onPress={() => router.push("/filters")} className="rounded-[6px] border border-primary px-3 py-1.5">
              <Text className="text-[12px] font-semibold text-primary">Filter</Text>
            </Pressable>
          </View>
        </View>

        <View style={{ width: "100%", maxWidth: contentMaxWidth, alignSelf: "center" }} className="px-4 pt-6">
          {isLoading ? (
            <View className="py-4"><ProductGridSkeleton rows={3} /></View>
          ) : filteredProducts.length === 0 ? (
            <View className="py-12">
              <Text className="text-center text-[14px]" style={{ color: colors.textMuted }}>No products available right now.</Text>
              <Pressable onPress={() => router.push("/categories")} className="mt-5 self-center rounded-full bg-primary px-6 py-3">
                <Text className="text-[13px] font-semibold text-white">Explore Products</Text>
              </Pressable>
            </View>
          ) : (
            <View className="flex-row flex-wrap justify-between">
              {filteredProducts.map((item) => (
                <ProductCard
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
        </View>
      </ScrollView>
    </View>
  );
}


