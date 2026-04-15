import { Pressable, ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  AllProductsCard,
  BackDarkIcon,
  CategorySearchBar,
  FilterIcon,
  SubcategorySection,
} from "../../components/ui/category-ui";

const subcategoryData: Record<
  string,
  { title: string; sections: { title: string; items: { label: string; emoji: string }[] }[] }
> = {
  "phones-tablets": {
    title: "All Products",
    sections: [
      {
        title: "Mobile Phones",
        items: [
          { label: "Smart\nPhones", emoji: "📱" },
          { label: "Iphones", emoji: "📲" },
          { label: "Featured\nPhone", emoji: "📞" },
        ],
      },
      {
        title: "Tablet Phones",
        items: [
          { label: "Android\nTablet", emoji: "📘" },
          { label: "IPad", emoji: "🪟" },
          { label: "Kids\nTablet", emoji: "🧩" },
        ],
      },
      {
        title: "Accessories",
        items: [
          { label: "Phone\nCases", emoji: "📚" },
          { label: "Protect\nors", emoji: "🪞" },
          { label: "Chargers", emoji: "🔌" },
          { label: "Bluetooth\nHeadset", emoji: "🎧" },
          { label: "Tripods", emoji: "📷" },
          { label: "Power\nBanks", emoji: "🔋" },
          { label: "Smart\nWatches", emoji: "⌚" },
          { label: "Adapters", emoji: "🔌" },
          { label: "Smart\nGlasses", emoji: "🎮" },
          { label: "VR\nHeadsets", emoji: "🥽" },
          { label: "WiFi\nRouter", emoji: "📡" },
        ],
      },
    ],
  },
};

function getDetailData(slug: string | string[] | undefined) {
  if (typeof slug !== "string") return subcategoryData["phones-tablets"];
  return subcategoryData[slug] ?? subcategoryData["phones-tablets"];
}

export default function CategoryDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const data = getDetailData(slug);

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="px-5 pt-5">
          <View className="flex-row items-center gap-3">
            <Pressable onPress={() => router.back()} className="h-8 w-8 items-center justify-center">
              <BackDarkIcon />
            </Pressable>

            <View className="flex-1">
              <CategorySearchBar compact />
            </View>

            <FilterIcon />
          </View>

          <AllProductsCard title={data.title} />

          {data.sections.map((section) => (
            <SubcategorySection
              key={section.title}
              title={section.title}
              items={section.items}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
