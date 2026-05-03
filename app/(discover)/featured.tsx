import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { BackIcon, BellDarkIcon, SearchGrayIcon } from "../../components/ui/general-ui";
import { HeartOutlineIcon } from "../../components/ui/home-ui";
import { applyProductFilters } from "../../lib/search/product-filters";
import { formatMoney, getFeaturedProducts, resolveMediaUrl, type ApiProduct } from "../../lib/api/shop";
import { useProductFilterStore } from "../../store/product-filter-store";
import { notifyError } from "../../lib/ui/notify";

function FeaturedCard({ item }: { item: ApiProduct }) {
  const price = formatMoney(item.price);
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
        {item.image ? <Image source={{ uri: resolveMediaUrl(item.image) }} className="h-full w-full" resizeMode="cover" /> : null}
        <View className="absolute right-3 top-3">
          <HeartOutlineIcon color="#FF9F0A" size={19} />
        </View>
      </View>
      <View className="px-2.5 pb-3 pt-3.5">
        <Text numberOfLines={2} className="text-[12px] font-medium text-[#333333]">
          {item.title}
        </Text>
        <Text className="mt-1 text-[14px] font-semibold text-[#222222]">{price}</Text>
      </View>
    </Pressable>
  );
}

export default function FeaturedScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<ApiProduct[]>([]);
  const filters = useProductFilterStore();

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const rows = await getFeaturedProducts();
        if (!isMounted) return;
        setItems(rows);
      } catch {
        if (!isMounted) return;
        setItems([]);
        notifyError("Featured failed", "Unable to load featured products right now.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredItems = applyProductFilters(items, {
    ...filters,
    category: "",
    subcategory: "",
    leveltwo: "",
  });

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
          <View className="mt-6 flex-row items-center justify-between">
            <Text className="text-[31px] font-medium text-[#303030]">Featured</Text>
            <Pressable onPress={() => router.push("/filters")} className="rounded-[6px] border border-primary px-3 py-1.5">
              <Text className="text-[12px] font-semibold text-primary">Filter</Text>
            </Pressable>
          </View>
          <Text className="mt-3 text-[14px] text-[#555555]">Showing only featured products.</Text>
        </View>
        <View className="px-4 pt-6">
          {isLoading ? (
            <View className="items-center py-12">
              <ActivityIndicator color="#FF9B00" />
            </View>
          ) : filteredItems.length === 0 ? (
            <Text className="py-12 text-center text-[14px] text-[#737373]">No featured products available now.</Text>
          ) : (
            <View className="flex-row flex-wrap justify-between">
              {filteredItems.map((item) => (
                <FeaturedCard key={String(item.id ?? item.pid)} item={item} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
