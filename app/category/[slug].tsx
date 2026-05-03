import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  AllProductsCard,
  BackDarkIcon,
  CategorySearchBar,
  FilterIcon,
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
  resolveMediaUrl,
} from "../../lib/api/shop";
import { notifyError } from "../../lib/ui/notify";
import { useProductFilterStore } from "../../store/product-filter-store";

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
        imageUrl: resolveMediaUrl(item.image),
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
      items = [{ label: subcategory.title, imageUrl: resolveMediaUrl(subcategory.image), emoji: toIcon(subcategory.title) }];
    }

    return {
      title: subcategory.title,
      items,
    };
  });
}

export default function CategoryDetailScreen() {
  const { slug, title } = useLocalSearchParams<{ slug?: string; title?: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [categoryTitle, setCategoryTitle] = useState("All Products");
  const [sections, setSections] = useState<DetailSection[]>([]);
  const setFilters = useProductFilterStore((state) => state.setFilters);

  useEffect(() => {
    let isMounted = true;

    async function loadCategoryDetails() {
      try {
        setIsLoading(true);
        const [categories, subcategories, levelTwoCategories, products] = await Promise.all([
          getCategories(),
          getSubcategories(),
          getLevelTwoCategories(),
          getPublishedProducts(),
        ]);

        if (!isMounted) return;

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
        if (!isMounted) return;
        setSections([]);
        notifyError("Category failed", "Unable to load category details right now.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadCategoryDetails();

    return () => {
      isMounted = false;
    };
  }, [slug, title]);

  return (
    <View className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="px-5 pt-5">
          <View className="flex-row items-center gap-3">
            <Pressable onPress={() => router.back()} className="h-8 w-8 items-center justify-center">
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

            <Pressable onPress={() => router.push("/filters")} className="h-8 w-8 items-center justify-center">
              <FilterIcon />
            </Pressable>
          </View>

          <AllProductsCard title={categoryTitle} />

          {isLoading ? (
            <View className="items-center py-12">
              <ActivityIndicator color="#FF9B00" />
            </View>
          ) : sections.length === 0 ? (
            <Text className="py-8 text-center text-[14px] text-[#737373]">
              No subcategories available for this category yet.
            </Text>
          ) : (
            sections.map((section) => (
              <SubcategorySection
                key={section.title}
                title={section.title}
                items={section.items}
                onPressItem={(item) =>
                  {
                    setFilters({
                      query: item.label,
                      category: categoryTitle,
                      subcategory: section.title,
                      leveltwo: item.levelTwoTitle ?? "",
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
