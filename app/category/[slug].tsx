import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { goBackOr } from "../../lib/navigation/go-back-or";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AllProductsCard,
  BackDarkIcon,
  CategorySearchBar,
  SubcategorySection,
} from "../../components/ui/category-ui";
import {
  type ApiCategory,
  type ApiLevelTwoCategory,
  type ApiProduct,
  type ApiSubCategory,
  getCategories,
  getLevelTwoCategories,
  getPublishedProducts,
  getSubcategories,
  resolveProductCardImageUrl,
} from "../../lib/api/shop";
import { notifyError } from "../../lib/ui/notify";
import { useProductFilterStore } from "../../store/product-filter-store";
import { useAppTheme } from "../../lib/theme/theme-provider";

type DetailSection = {
  title: string;
  items: { label: string; emoji?: string; imageUrl?: string; levelTwoTitle?: string }[];
};

function normalize(value?: string | null) {
  return (value ?? "").trim().toLowerCase();
}

function toIcon(label: string) {
  const firstChar = (label?.trim()?.charAt(0) ?? "C").toUpperCase();
  return firstChar;
}

function resolveCategoryTitle(paramsTitle: string | undefined, slug: string | undefined, categories: ApiCategory[]) {
  if (paramsTitle && paramsTitle.trim().length > 0) {
    return paramsTitle.trim();
  }
  if (!slug) return "All Products";

  const byCid = categories.find((category) => category.cid === slug);
  if (byCid) return byCid.title;

  return "All Products";
}

function buildSections({
  categoryTitle,
  subcategories,
  levelTwoCategories,
  products,
}: {
  categoryTitle: string;
  subcategories: ApiSubCategory[];
  levelTwoCategories: ApiLevelTwoCategory[];
  products: ApiProduct[];
}): DetailSection[] {
  const matchedSubcategories = subcategories.filter(
    (subcategory) => normalize(subcategory.category_name) === normalize(categoryTitle),
  );

  if (matchedSubcategories.length === 0) {
    return [];
  }

  return matchedSubcategories.map((subcategory) => {
    const levelTwoItems = levelTwoCategories.filter(
      (levelTwo) =>
        normalize(levelTwo.subcategory_name) === normalize(subcategory.title) &&
        (!levelTwo.category_name || normalize(levelTwo.category_name) === normalize(categoryTitle)),
    );

    let items: { label: string; emoji?: string; imageUrl?: string; levelTwoTitle?: string }[] = [];

    if (levelTwoItems.length > 0) {
      items = levelTwoItems.slice(0, 12).map((item) => ({
        label: item.title,
        imageUrl: resolveProductCardImageUrl(item.image),
        emoji: toIcon(item.title),
        levelTwoTitle: item.title,
      }));
    } else {
      const productItems = products.filter(
        (product) =>
          normalize(product.category) === normalize(categoryTitle) &&
          normalize(product.subcategory) === normalize(subcategory.title),
      );

      items = productItems.slice(0, 12).map((item) => ({
        label: item.title,
        emoji: toIcon(item.title),
      }));
    }

    if (items.length === 0) {
      items = [{ label: subcategory.title, imageUrl: resolveProductCardImageUrl(subcategory.image), emoji: toIcon(subcategory.title) }];
    }

    return {
      title: subcategory.title,
      items,
    };
  });
}

export default function CategoryDetailScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { slug, title } = useLocalSearchParams<{ slug?: string; title?: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [categoryTitle, setCategoryTitle] = useState("All Products");
  const [sections, setSections] = useState<DetailSection[]>([]);
  const setFilters = useProductFilterStore((state) => state.setFilters);

  async function loadCategoryDetails(showLoader = true) {
    try {
      if (showLoader) setIsLoading(true);
      const [categories, subcategories, levelTwoCategories, products] = await Promise.all([
        getCategories(),
        getSubcategories(),
        getLevelTwoCategories(),
        getPublishedProducts(),
      ]);

      const resolvedTitle = resolveCategoryTitle(title, slug, categories);
      const resolvedSections = buildSections({
        categoryTitle: resolvedTitle,
        subcategories,
        levelTwoCategories,
        products,
      });

      setCategoryTitle(resolvedTitle);
      setSections(resolvedSections);
    } catch {
      setSections([]);
      notifyError("Category failed", "Unable to load category details right now.");
    } finally {
      if (showLoader) setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    void loadCategoryDetails(true);
  }, [slug, title]);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              void loadCategoryDetails(false);
            }}
          />
        }
      >
        <View style={{ paddingTop: Math.max(insets.top + 4, 12), backgroundColor: colors.background }} className="px-5 pb-3">
          <View className="flex-row items-center gap-3">
            <Pressable onPress={() => goBackOr(router)} className="h-8 w-8 items-center justify-center">
              <BackDarkIcon />
            </Pressable>

            <View className="flex-1">
              <CategorySearchBar
                compact
                onPress={() => {
                  setFilters({
                    category: categoryTitle,
                    subcategory: "",
                    leveltwo: "",
                  });
                  router.push("/search");
                }}
              />
            </View>
          </View>
        </View>

        <View className="px-5 pt-2">
          <AllProductsCard title={categoryTitle} />

          {isLoading ? (
            <View className="items-center py-12">
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : sections.length === 0 ? (
            <Text className="py-8 text-center text-[14px]" style={{ color: colors.textMuted }}>
              No subcategories available for this category yet.
            </Text>
          ) : (
            sections.map((section) => (
              <SubcategorySection
                key={section.title}
                title={section.title}
                items={section.items}
                onPressViewAll={() =>
                  router.push({
                    pathname: "/subcategory-products",
                    params: { category: categoryTitle, subcategory: section.title },
                  })
                }
                onPressItem={(item) =>
                  {
                    if (item.levelTwoTitle) {
                      router.push({
                        pathname: "/leveltwo-products",
                        params: {
                          category: categoryTitle,
                          subcategory: section.title,
                          leveltwo: item.levelTwoTitle,
                        },
                      });
                      return;
                    }

                    setFilters({
                      query: item.label,
                      category: categoryTitle,
                      subcategory: section.title,
                      leveltwo: "",
                    });
                    router.push("/search-results");
                  }
                }
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}



