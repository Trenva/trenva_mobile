import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { HeartOutlineIcon } from "../../components/ui/home-ui";
import { BackIcon, BellDarkIcon, SearchGrayIcon } from "../../components/ui/general-ui";
import { formatMoney, getPublishedProducts, resolveMediaUrl, type ApiProduct } from "../../lib/api/shop";
import { applyProductFilters } from "../../lib/search/product-filters";
import { useProductFilterStore } from "../../store/product-filter-store";
import { notifyError } from "../../lib/ui/notify";

function ResultCard({ item }: { item: ApiProduct }) {
  const price = formatMoney(item.price);
  const imageUrl = resolveMediaUrl(item.image);

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/product/[slug]",
          params: { slug: String(item.id ?? item.pid), name: item.title, price },
        })
      }
      className="mb-4 w-[48%] overflow-hidden rounded-[6px] bg-white shadow-sm"
    >
      <View className="relative h-[112px] overflow-hidden bg-[#E8E8E8]">
        {imageUrl ? <Image source={{ uri: imageUrl }} className="h-full w-full" resizeMode="cover" /> : null}
        <View className="absolute right-3 top-3">
          <HeartOutlineIcon color="#FF9F0A" size={19} />
        </View>
      </View>
      <View className="px-2.5 pb-3 pt-3.5">
        <Text numberOfLines={2} className="text-[12px] font-medium text-[#333333]">
          {item.title}
        </Text>
        <Text className="mt-1 text-[14px] font-medium text-[#222222]">{price}</Text>
      </View>
    </Pressable>
  );
}

export default function SearchResultsScreen() {
  const { query, category, subcategory, leveltwo } = useLocalSearchParams<{
    query?: string;
    category?: string;
    subcategory?: string;
    leveltwo?: string;
  }>();
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    let isMounted = true;
    async function loadProducts() {
      try {
        const data = await getPublishedProducts();
        if (!isMounted) return;
        setProducts(data);
      } catch {
        if (!isMounted) return;
        setProducts([]);
        notifyError("Search failed", "Unable to load products right now.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    void loadProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredResults = useMemo(
    () =>
      applyProductFilters(products, {
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
      }),
    [color, location, maxPrice, minPrice, products, resolution, review, sharedCategory, sharedLevelTwo, sharedQuery, sharedSubcategory, sort],
  );

  return (
    <View className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        <View className="px-4 pt-3">
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

          <Text className="mt-6 text-[31px] font-medium text-[#303030]">Search Results</Text>
          <Text className="mt-4 text-[15px] text-[#4A4A4A]">
            Showing {filteredResults.length} results for <Text className="text-primary">"{keyword}"</Text>
          </Text>

          <View className="mt-4 rounded-xl border border-[#ECECEC] bg-[#FAFAFA] p-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-[13px] font-semibold text-[#3A3A3A]">Filters</Text>
              <Pressable onPress={() => router.push("/filters")}>
                <Text className="text-[12px] font-semibold text-primary">Open Filter</Text>
              </Pressable>
            </View>
            <Text className="mt-2 text-[12px] text-[#666666]">Sort: {sort.replaceAll("_", " ")}</Text>
            <Text className="mt-1 text-[12px] text-[#666666]">
              Price: {typeof minPrice === "number" || typeof maxPrice === "number" ? `${typeof minPrice === "number" ? minPrice : 0} - ${typeof maxPrice === "number" ? maxPrice : "∞"}` : "Any"}
            </Text>
          </View>
        </View>

        <View className="px-4 pt-8">
          {isLoading ? (
            <View className="items-center py-12">
              <ActivityIndicator color="#FF9B00" />
            </View>
          ) : filteredResults.length === 0 ? (
            <Text className="py-12 text-center text-[14px] text-[#737373]">No products found for this filter.</Text>
          ) : (
            <View className="flex-row flex-wrap justify-between">
              {filteredResults.map((item) => (
                <ResultCard key={String(item.id ?? item.pid)} item={item} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
