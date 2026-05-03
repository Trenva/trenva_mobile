import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { BackIcon, BellDarkIcon, SearchGrayIcon } from "../../components/ui/general-ui";
import { HeartOutlineIcon } from "../../components/ui/home-ui";
import { applyProductFilters } from "../../lib/search/product-filters";
import { formatMoney, getPublishedProducts, resolveMediaUrl, type ApiProduct } from "../../lib/api/shop";
import { useProductFilterStore } from "../../store/product-filter-store";
import { notifyError } from "../../lib/ui/notify";

function normalize(value?: string | null) {
  return (value ?? "").trim().toLowerCase();
}

function ProductCard({ item }: { item: ApiProduct }) {
  const price = formatMoney(item.price);
  const imageUrl = resolveMediaUrl(item.image);
  return (
    <Pressable
      onPress={() => router.push({ pathname: "/product/[slug]", params: { slug: String(item.id ?? item.pid), name: item.title, price } })}
      className="mb-4 w-[48%] overflow-hidden rounded-[6px] bg-white shadow-sm"
    >
      <View className="relative h-[112px] overflow-hidden bg-[#E8E8E8]">
        {imageUrl ? <Image source={{ uri: imageUrl }} className="h-full w-full" resizeMode="cover" /> : null}
        <View className="absolute right-3 top-3"><HeartOutlineIcon color="#FF9F0A" size={19} /></View>
      </View>
      <View className="px-2.5 pb-3 pt-3.5">
        <Text numberOfLines={2} className="text-[12px] font-medium text-[#333333]">{item.title}</Text>
        <Text className="mt-1 text-[14px] font-medium text-[#222222]">{price}</Text>
      </View>
    </Pressable>
  );
}

export default function SubcategoryProductsScreen() {
  const { category, subcategory } = useLocalSearchParams<{ category?: string; subcategory?: string }>();
  const categoryTitle = (category ?? "Category").trim();
  const subcategoryTitle = (subcategory ?? "Subcategory").trim();
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const filters = useProductFilterStore();
  const resetFilters = useProductFilterStore((state) => state.resetFilters);

  useEffect(() => {
    resetFilters();
  }, [categoryTitle, subcategoryTitle, resetFilters]);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const rows = await getPublishedProducts();
        if (!isMounted) return;
        setProducts(
          rows.filter(
            (p) =>
              normalize(p.category) === normalize(categoryTitle) &&
              normalize(p.subcategory) === normalize(subcategoryTitle),
          ),
        );
      } catch {
        if (!isMounted) return;
        setProducts([]);
        notifyError("Subcategory failed", "Unable to load subcategory products right now.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    void load();
    return () => {
      isMounted = false;
    };
  }, [categoryTitle, subcategoryTitle]);

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
    <View className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        <View className="px-4 pt-3">
          <View className="mb-3 flex-row items-center justify-between">
            <Pressable className="h-8 w-8 items-center justify-center" onPress={() => router.back()}><BackIcon /></Pressable>
            <View className="flex-row items-center gap-4">
              <Pressable onPress={() => router.push("/search")}><SearchGrayIcon /></Pressable>
              <BellDarkIcon />
            </View>
          </View>

          <View className="mt-4 flex-row items-center justify-between">
            <View>
              <Text className="text-[13px] text-[#888888]">{categoryTitle}</Text>
              <Text className="text-[26px] font-medium text-[#303030]">{subcategoryTitle}</Text>
            </View>
            <Pressable onPress={() => router.push("/filters")} className="rounded-[6px] border border-primary px-3 py-1.5">
              <Text className="text-[12px] font-semibold text-primary">Filter</Text>
            </Pressable>
          </View>
        </View>

        <View className="px-4 pt-6">
          {isLoading ? (
            <View className="items-center py-12"><ActivityIndicator color="#FF9B00" /></View>
          ) : filteredProducts.length === 0 ? (
            <Text className="py-12 text-center text-[14px] text-[#737373]">No products available right now.</Text>
          ) : (
            <View className="flex-row flex-wrap justify-between">
              {filteredProducts.map((item) => <ProductCard key={String(item.id ?? item.pid)} item={item} />)}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
