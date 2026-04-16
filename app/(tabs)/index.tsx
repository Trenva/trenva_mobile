import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import {
  BellIcon,
  ChevronRightIcon,
  CouponIcon,
  HeartOutlineIcon,
  LocationPinIcon,
  SearchIcon,
  SectionTitle,
} from "../../components/ui/home-ui";

const categories = [
  { label: "Men", icon: "🧍" },
  { label: "Women", icon: "🧍‍♀️" },
  { label: "Kids", icon: "😊" },
  { label: "Accessories", icon: "👜" },
  { label: "Home Decor", icon: "🏠" },
  { label: "Paintings", icon: "🎨" },
];

const flashSale = [
  { name: "Medea By Euripides", price: "₹ 1200", rating: "4.4", reviews: "100 Reviews", stock: "6 Items Left" },
  { name: "Botanical Art", price: "₹ 1400", rating: "4.6", reviews: "143 Reviews", stock: "16 Items Left" },
  { name: "Twilight Glass", price: "₹ 1800", rating: "4.8", reviews: "89 Reviews", stock: "9 Items Left" },
];

const paintings = [
  { name: "Medea By Euripides", price: "₹ 1200", rating: "4.4", reviews: "100 Reviews" },
  { name: "Botanical Art", price: "₹ 1400", rating: "4.6", reviews: "143 Reviews" },
  { name: "Twilight Vase", price: "₹ 1600", rating: "4.8", reviews: "95 Reviews" },
];

const toys = [
  { name: "Christmas Teddy Bear", price: "₹ 900", rating: "4.3", reviews: "95 Reviews" },
  { name: "Pika Pokémon", price: "₹ 989", rating: "4.8", reviews: "123 Reviews" },
  { name: "LEGO Wheels", price: "₹ 1499", rating: "4.7", reviews: "88 Reviews" },
];

const suggestions = [
  { name: "RusticLeaf Pot", price: "₹ 1200", rating: "4.5", reviews: "123 Reviews" },
  { name: "FloraCradle Pot", price: "₹ 1200", rating: "4.5", reviews: "123 Reviews" },
  { name: "RusticLeaf Pot", price: "₹ 1200", rating: "4.5", reviews: "123 Reviews" },
  { name: "FloraCradle Pot", price: "₹ 1200", rating: "4.5", reviews: "123 Reviews" },
];

function PromoCard({
  item,
  compact = false,
}: {
  item: {
    name: string;
    price: string;
    rating: string;
    reviews: string;
    stock?: string;
  };
  compact?: boolean;
}) {
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
      className={`mr-3 rounded-[6px] bg-white ${compact ? "w-[124px]" : "w-[144px]"}`}
    >
      <View className={`relative rounded-t-[6px] bg-[#EAEAEA] ${compact ? "h-[92px]" : "h-[105px]"}`}>
        <View className="absolute right-3 top-3">
          <HeartOutlineIcon />
        </View>
      </View>

      <View className="border-x border-b border-[#EFEFEF] px-1.5 pb-2 pt-3">
        <Text numberOfLines={1} className="text-[11px] font-semibold text-[#4B4B4B]">
          {item.name}
        </Text>
        <Text className="mt-1 text-[10px] font-bold text-[#4B4B4B]">{item.price}</Text>
        <Text className="mt-1 text-[8px] text-[#8A8A8A]">☆ {item.rating} · {item.reviews}</Text>
        {item.stock ? (
          <>
            <Text className="mt-1 text-[7px] text-[#A0A0A0]">{item.stock}</Text>
            <View className="mt-1 h-1.5 w-[66px] rounded-full bg-[#E8E8E8]">
              <View className="h-1.5 w-7 rounded-full bg-[#FFB000]" />
            </View>
          </>
        ) : null}
      </View>
    </Pressable>
  );
}

function CategoryChip({ label, icon }: { label: string; icon: string }) {
  return (
    <View className="mr-4 items-center">
      <View className="h-[42px] w-[42px] items-center justify-center rounded-full bg-[#F7F1EA]">
        <Text className="text-lg">{icon}</Text>
      </View>
      <Text className="mt-1.5 text-[9px] text-[#6B7280]">{label}</Text>
    </View>
  );
}

function ProductRow({
  items,
  compact = false,
}: {
  items: { name: string; price: string; rating: string; reviews: string; stock?: string }[];
  compact?: boolean;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="pl-4"
      contentContainerStyle={{ paddingRight: 16 }}
    >
      {items.map((item, index) => (
        <PromoCard key={`${item.name}-${index}`} item={item} compact={compact} />
      ))}
    </ScrollView>
  );
}

export default function HomeScreen() {
  return (
    <View className="flex-1 bg-[#F7F7F3]">
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <View className="px-4 pt-3">
          <View className="mb-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5">
              <LocationPinIcon />
              <Text className="text-[13px] font-medium text-[#4B4B4B]">Uyo, Nigeria</Text>
              <Text className="text-[11px] text-[#6B7280]">▼</Text>
            </View>
            <BellIcon />
          </View>

          <Pressable
            onPress={() => router.push("/search")}
            className="mb-6 flex-row items-center rounded-[14px] border border-primary bg-white px-3 py-3"
          >
            <SearchIcon />
            <Text className="pl-3 text-[15px] text-[#98A2B3]">Search</Text>
          </Pressable>

          <View className="mb-8 h-[120px] rounded-[2px] bg-[#E2E2E2]" />
        </View>

        <SectionTitle title="Category" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="pl-4"
          contentContainerStyle={{ paddingRight: 16 }}
        >
          {categories.map((category) => (
            <CategoryChip key={category.label} {...category} />
          ))}
        </ScrollView>

        <View className="mt-8 bg-[#F91509] px-4 py-5">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <CouponIcon />
              <View>
                <Text className="text-[13px] font-bold text-white">Flash Sales</Text>
                <Text className="mt-1 text-[11px] font-medium tracking-[0.3px] text-white">
                  TIME LEFT: 01h : 36m : 03s
                </Text>
              </View>
            </View>
            <Text className="text-[12px] font-semibold text-white underline">See All</Text>
          </View>
        </View>

        <View className="mt-5">
          <ProductRow items={flashSale} compact />
        </View>

        <View className="mt-7 bg-primary px-4 py-5">
          <View className="flex-row items-center justify-between">
            <Text className="text-[15px] font-semibold text-white">Limited Items</Text>
            <Text className="text-[12px] font-semibold text-white">See All</Text>
          </View>
        </View>

        <View className="mt-5">
          <ProductRow items={paintings} compact />
        </View>

        <SectionTitle title="Paintings" />
        <ProductRow items={paintings} compact />

        <SectionTitle title="Toys" />
        <ProductRow items={toys} compact />

        <SectionTitle title="Last Viewed" />
        <View className="px-4">
          <View className="flex-row justify-between">
            <PromoCard item={suggestions[0]} />
            <PromoCard item={suggestions[1]} />
          </View>
        </View>

        <SectionTitle title="Suggested for you" />
        <View className="px-4 pb-10">
          <View className="mb-4 flex-row justify-between">
            <PromoCard item={suggestions[0]} />
            <PromoCard item={suggestions[1]} />
          </View>
          <View className="flex-row justify-between">
            <PromoCard item={suggestions[2]} />
            <PromoCard item={suggestions[3]} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
