import { Pressable, ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { HeartOutlineIcon } from "../components/ui/home-ui";
import { BackIcon, BellDarkIcon, SearchGrayIcon } from "../components/ui/general-ui";

type SearchResult = {
  name: string;
  price: string;
  rating: string;
  reviews: string;
};

const results: SearchResult[] = [
  { name: "FloraCradle Pot", price: "N 1200", rating: "4.5", reviews: "123 Reviews" },
  { name: "Product Name", price: "N 1200", rating: "4.5", reviews: "123 Reviews" },
  { name: "BotaniCraft Pot", price: "N 1200", rating: "4.5", reviews: "123 Reviews" },
  { name: "GreenHaven Pot", price: "N 1200", rating: "4.5", reviews: "123 Reviews" },
  { name: "GardenGlow Pot", price: "N 1200", rating: "4.5", reviews: "123 Reviews" },
  { name: "Botanical Bliss Pot", price: "N 1200", rating: "4.5", reviews: "123 Reviews" },
];

function ResultCard({ item }: { item: SearchResult }) {
  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/product/[slug]",
          params: {
            slug: item.name.toLowerCase().replace(/\s+/g, "-"),
            name: item.name,
            price: item.price,
          },
        })
      }
      className="mb-4 w-[48%] overflow-hidden rounded-[6px] bg-white shadow-sm"
    >
      <View className="relative h-[112px] bg-[#E8E8E8]">
        <View className="absolute right-3 top-3">
          <HeartOutlineIcon color="#FF9F0A" size={19} />
        </View>
      </View>
      <View className="px-2.5 pb-3 pt-3.5">
        <Text numberOfLines={2} className="text-[12px] font-medium text-[#333333]">
          {item.name}
        </Text>
        <Text className="mt-1 text-[14px] font-medium text-[#222222]">{item.price}</Text>
        <Text className="mt-1 text-[9px] text-[#A7A7A7]">* {item.rating} - {item.reviews}</Text>
      </View>
    </Pressable>
  );
}

export default function SearchResultsScreen() {
  const { query } = useLocalSearchParams<{ query?: string }>();
  const keyword = query ?? "Home Decor";

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
            Showing search 25 results for <Text className="text-primary">"{keyword}"</Text>
          </Text>
        </View>

        <View className="px-4 pt-8">
          <View className="flex-row flex-wrap justify-between">
            {results.map((item, index) => (
              <ResultCard key={`${item.name}-${index}`} item={item} />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
