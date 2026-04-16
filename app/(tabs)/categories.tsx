import { ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { CategorySearchBar, CategoryTile, FilterIcon } from "../../components/ui/category-ui";

const categories = [
  { label: "Home &\nAppliance", slug: "home-appliance" },
  { label: "Phones/Tablets", slug: "phones-tablets" },
  { label: "Health & Beauty", slug: "health-beauty" },
  { label: "Phones &\nTablets", slug: "phones-tablets" },
  { label: "Painting", slug: "painting" },
  { label: "Electronics", slug: "electronics" },
  { label: "Computing", slug: "computing" },
  { label: "Grocery", slug: "grocery" },
  { label: "Gaming", slug: "gaming" },
  { label: "Power Machines", slug: "power-machines" },
  { label: "Sport Machines", slug: "sport-machines" },
  { label: "Fashion", slug: "fashion" },
  { label: "Home &\nAppliance", slug: "home-appliance" },
  { label: "Painting", slug: "painting" },
  { label: "Fashion", slug: "fashion" },
];

export default function CategoriesScreen() {
  return (
    <View className="flex-1 bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View className="px-5 pt-5">
          <View className="flex-row items-center gap-4">
            <View className="flex-1">
              <CategorySearchBar onPress={() => router.push("/search")} />
            </View>
            <FilterIcon />
          </View>

          <Text className="mb-8 mt-10 text-[17px] font-semibold text-[#2E2E2E]">
            Categories:
          </Text>

          <View className="flex-row flex-wrap justify-between">
            {categories.map((category, index) => (
              <CategoryTile
                key={`${category.slug}-${index}`}
                label={category.label}
                onPress={() =>
                  router.push({
                    pathname: "/category/[slug]",
                    params: { slug: category.slug, title: category.label.replace("\n", " ") },
                  })
                }
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
