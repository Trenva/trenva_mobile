import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { CategorySearchBar, CategoryTile, FilterIcon } from "../../components/ui/category-ui";
import { type ApiCategory, getCategories, resolveMediaUrl } from "../../lib/api/shop";
import { useProductFilterStore } from "../../store/product-filter-store";
import { notifyError } from "../../lib/ui/notify";

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
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const resetFilters = useProductFilterStore((state) => state.resetFilters);

  useEffect(() => {
    let isMounted = true;

    async function loadCategories() {
      try {
        const data = await getCategories();
        if (!isMounted) return;
        setCategories(data);
      } catch {
        if (!isMounted) return;
        setCategories([]);
        notifyError("Categories failed", "Unable to load categories right now.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <View className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="px-5 pt-5">
          <View className="flex-row items-center gap-4">
            <View className="flex-1">
              <CategorySearchBar
                onPress={() => {
                  resetFilters();
                  router.push("/search");
                }}
              />
            </View>
            <FilterIcon />
          </View>

          <Text className="mb-8 mt-10 text-[17px] font-semibold text-[#2E2E2E]">Categories:</Text>

          {isLoading ? (
            <View className="items-center py-12">
              <ActivityIndicator color="#FF9B00" />
            </View>
          ) : categories.length === 0 ? (
            <Text className="py-8 text-center text-[14px] text-[#737373]">No categories available right now.</Text>
          ) : (
            <View className="flex-row flex-wrap justify-between">
              {categories.map((category) => (
                <CategoryTile
                  key={category.cid}
                  label={formatCategoryLabel(category.title)}
                  imageUrl={resolveMediaUrl(category.image)}
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
        </View>
      </ScrollView>
    </View>
  );
}
