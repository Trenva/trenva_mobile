import { useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CategorySearchBar, CategoryTile } from "../../components/ui/category-ui";
import { type ApiCategory, getCategories, resolveProductCardImageUrl } from "../../lib/api/shop";
import { useProductFilterStore } from "../../store/product-filter-store";
import { notifyError } from "../../lib/ui/notify";
import { useAppTheme } from "../../lib/theme/theme-provider";

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
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
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

  async function refreshCategories() {
    setIsRefreshing(true);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch {
      notifyError("Refresh failed", "Unable to refresh categories.");
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void refreshCategories()} />}
      >
        <View className="px-5" style={{ paddingTop: Math.max(insets.top + 4, 12) }}>
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

          <Text className="mb-8 mt-10 text-[17px] font-semibold" style={{ color: colors.text }}>Categories:</Text>

          {isLoading ? (
            <View className="items-center py-12">
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : categories.length === 0 ? (
            <Text className="py-8 text-center text-[14px]" style={{ color: colors.textMuted }}>No categories available right now.</Text>
          ) : (
            <View className="flex-row flex-wrap justify-between">
              {categories.map((category) => (
                <CategoryTile
                  key={category.cid}
                  label={formatCategoryLabel(category.title)}
                  imageUrl={resolveProductCardImageUrl(category.image)}
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
