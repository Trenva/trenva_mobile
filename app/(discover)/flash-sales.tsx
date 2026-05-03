import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { BackIcon, BellDarkIcon, SearchGrayIcon } from "../../components/ui/general-ui";
import { HeartOutlineIcon } from "../../components/ui/home-ui";
import { applyProductFilters } from "../../lib/search/product-filters";
import { formatMoney, getFlashSaleProducts, resolveMediaUrl, type ApiFlashSaleProduct } from "../../lib/api/shop";
import { useProductFilterStore } from "../../store/product-filter-store";
import { notifyError } from "../../lib/ui/notify";

function FlashSaleCard({ item }: { item: ApiFlashSaleProduct }) {
  const details = item.product_details;
  const priceValue = item.flash_sale_price ?? item.effective_price ?? details?.price ?? 0;

  if (!details) return null;

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/product/[slug]",
          params: { slug: String(details.id ?? details.pid ?? item.product), name: details.title ?? "Product", price: formatMoney(priceValue) },
        })
      }
      className="mb-4 w-[48%] overflow-hidden rounded-[6px] bg-white shadow-sm"
    >
      <View className="relative h-[112px] overflow-hidden bg-[#E8E8E8]">
        {details.image ? <Image source={{ uri: resolveMediaUrl(details.image) }} className="h-full w-full" resizeMode="cover" /> : null}
        <View className="absolute right-3 top-3">
          <HeartOutlineIcon color="#FF9F0A" size={19} />
        </View>
      </View>
      <View className="px-2.5 pb-3 pt-3.5">
        <Text numberOfLines={2} className="text-[12px] font-medium text-[#333333]">
          {details.title ?? "Flash Sale Product"}
        </Text>
        <Text className="mt-1 text-[14px] font-semibold text-[#F91509]">{formatMoney(priceValue)}</Text>
      </View>
    </Pressable>
  );
}

export default function FlashSalesScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<ApiFlashSaleProduct[]>([]);
  const filters = useProductFilterStore();

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const rows = await getFlashSaleProducts({ active: true });
        if (!isMounted) return;
        setItems(rows);
      } catch {
        if (!isMounted) return;
        setItems([]);
        notifyError("Flash sales failed", "Unable to load flash sale products right now.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    void load();
    return () => {
      isMounted = false;
    };
  }, []);

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
            <Text className="text-[31px] font-medium text-[#303030]">Flash Sales</Text>
            <Pressable onPress={() => router.push("/filters")} className="rounded-[6px] border border-primary px-3 py-1.5">
              <Text className="text-[12px] font-semibold text-primary">Filter</Text>
            </Pressable>
          </View>
          <Text className="mt-3 text-[14px] text-[#555555]">Showing only products currently in Flash Sale.</Text>
        </View>
        <View className="px-4 pt-6">
          {isLoading ? (
            <View className="items-center py-12">
              <ActivityIndicator color="#FF9B00" />
            </View>
          ) : filteredItems.length === 0 ? (
            <Text className="py-12 text-center text-[14px] text-[#737373]">No flash sale products available now.</Text>
          ) : (
            <View className="flex-row flex-wrap justify-between">
              {filteredItems.map((item) => (
                <FlashSaleCard key={item.id} item={item} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
