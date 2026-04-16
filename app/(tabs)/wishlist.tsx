import { Pressable, ScrollView, Text, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import {
  HeartOutlineIcon,
  ChevronRightIcon,
} from "../../components/ui/home-ui";
import { router } from "expo-router";
import { BackIcon, SearchGrayIcon, BellDarkIcon, FiltersIcon  } from "../../components/ui/general-ui";

const favorites = [
  { name: "RusticLeaf Pot", price: "₹ 1200", rating: "4.5", reviews: "123 Reviews", tone: "light" },
  { name: "FloraCradle Pot", price: "₹ 1200", rating: "4.5", reviews: "123 Reviews", tone: "light" },
  { name: "BotaniCraft Pot", price: "₹ 1200", rating: "4.5", reviews: "123 Reviews", tone: "light" },
  { name: "Soil Serenity Pot", price: "₹ 1200", rating: "4.5", reviews: "123 Reviews", tone: "light" },
  { name: "GreenHaven Pot", price: "₹ 1200", rating: "4.5", reviews: "123 Reviews", tone: "plant" },
  { name: "ZenGrow Pot", price: "₹ 1200", rating: "4.5", reviews: "123 Reviews", tone: "vase" },
  { name: "Botanical Bliss Pot", price: "₹ 1200", rating: "4.5", reviews: "123 Reviews", tone: "wall" },
  { name: "Worthy Embroidery", price: "₹ 1200", rating: "4.5", reviews: "123 Reviews", tone: "art" },
];

const recommendations = [
  { name: "Product Name", price: "₹ 1200", rating: "4.5", reviews: "123 Reviews" },
  { name: "Product Name", price: "₹ 1200", rating: "4.5", reviews: "123 Reviews" },
  { name: "Product Name", price: "₹ 1200", rating: "4.5", reviews: "123 Reviews" },
];

function TopBarIcon({
  children,
}: {
  children: React.ReactNode;
}) {
  return <View className="h-6 w-6 items-center justify-center">{children}</View>;
}

function FavoriteBadge() {
  return (
    <View className="absolute right-3 top-3 h-6 w-6 items-center justify-center rounded-full bg-[#FFB000] shadow-sm">
      <HeartOutlineIcon color="#FFFFFF" size={14} />
    </View>
  );
}


function ProductVisual({ tone }: { tone: string }) {
  if (tone === "plant") {
    return (
      <View className="absolute inset-0 overflow-hidden rounded-t-[6px] bg-[#E8EDF2]">
        <View className="absolute left-[20%] top-[18%] h-[55%] w-[44%] rounded-b-[18px] rounded-t-[14px] bg-[#C6E2E7]" />
        <View className="absolute left-[30%] top-[28%] h-[26%] w-[28%] rounded-full bg-[#89B95D]" />
        <View className="absolute left-[24%] top-[20%] h-[24%] w-[22%] -rotate-12 rounded-full bg-[#678F48]" />
        <View className="absolute left-[42%] top-[20%] h-[28%] w-[18%] rotate-12 rounded-full bg-[#6E9A45]" />
      </View>
    );
  }

  if (tone === "vase") {
    return (
      <View className="absolute inset-0 overflow-hidden rounded-t-[6px] bg-[#E8E4DC]">
        <View className="absolute left-[18%] top-[34%] h-[22%] w-[28%] rounded-[14px] bg-[#D8D1C4]" />
        <View className="absolute left-[40%] top-[26%] h-[34%] w-[18%] rounded-[10px] bg-[#F0ECE5]" />
        <View className="absolute left-[56%] top-[30%] h-[22%] w-[22%] rounded-full bg-[#E4DDCF]" />
        <View className="absolute left-[68%] top-[16%] h-[30%] w-[6%] rotate-[-18deg] rounded-full bg-[#B6403A]" />
        <View className="absolute left-[72%] top-[10%] h-[12%] w-[12%] rounded-full bg-[#7E1E1A]" />
      </View>
    );
  }

  if (tone === "wall") {
    return (
      <View className="absolute inset-0 overflow-hidden rounded-t-[6px] bg-[#E6E3DD]">
        <View className="absolute left-[18%] top-[18%] h-[2px] w-[58%] rotate-[-15deg] bg-[#B8B0A7]" />
        <View className="absolute left-[70%] top-[28%] h-[30%] w-[8%] rotate-12 bg-[#8D4F34]" />
        <View className="absolute left-[46%] top-[38%] h-[18%] w-[20%] rounded-full border border-[#8E8A83]" />
        <View className="absolute left-[33%] top-[48%] h-[22%] w-[14%] rounded-full bg-[#3A3534]" />
      </View>
    );
  }

  if (tone === "art") {
    return (
      <View className="absolute inset-0 overflow-hidden rounded-t-[6px] bg-[#F2EFE9]">
        <View className="absolute left-[22%] top-[18%] h-[56%] w-[56%] rounded-full border-[10px] border-[#C5A46A]" />
        <View className="absolute left-[34%] top-[28%] h-[34%] w-[34%] rounded-full bg-[#F5F0E6]" />
        <Text className="absolute left-[39%] top-[39%] text-[18px] font-semibold text-[#A9792D]">W</Text>
      </View>
    );
  }

  return (
    <View className="absolute inset-0 overflow-hidden rounded-t-[6px] bg-[#E8EAED]">
      <View className="absolute left-[18%] top-[26%] h-[34%] w-[24%] rounded-[8px] bg-white" />
      <View className="absolute left-[40%] top-[24%] h-[40%] w-[18%] rounded-[12px] bg-[#F2F2F2]" />
      <View className="absolute left-[58%] top-[30%] h-[26%] w-[20%] rounded-full bg-[#F4F4F4]" />
      <View className="absolute left-[26%] top-[18%] h-[42%] w-[6px] rotate-[-12deg] rounded-full bg-[#D48F35]" />
      <View className="absolute left-[44%] top-[20%] h-[18%] w-[12%] rotate-12 rounded-full bg-[#679A4F]" />
    </View>
  );
}

function FavoriteCard({
  item,
}: {
  item: { name: string; price: string; rating: string; reviews: string; tone: string };
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
      className="mb-4 w-[48%] overflow-hidden rounded-[6px] bg-white shadow-sm"
    >
      <View className="relative h-[126px] bg-[#E6E7EB]">
        <ProductVisual tone={item.tone} />
        <FavoriteBadge />
      </View>
      <View className="px-2.5 pb-3 pt-4">
        <Text numberOfLines={2} className="text-[13px] font-medium leading-[17px] text-[#333333]">
          {item.name}
        </Text>
        <Text className="mt-1.5 text-[14px] font-medium text-[#222222]">{item.price}</Text>
        <Text className="mt-1 text-[9px] text-[#A7A7A7]">
          ☆ {item.rating} · {item.reviews}
        </Text>
      </View>
    </Pressable>
  );
}

function RecommendationCard({ item }: { item: { name: string; price: string; rating: string; reviews: string } }) {
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
      className="mr-4 w-[145px] overflow-hidden rounded-[6px] bg-white shadow-sm"
    >
      <View className="relative h-[112px] bg-[#E6E7EB]">
        <View className="absolute left-[26%] top-[28%] h-[46%] w-[48%] rounded-[6px] bg-[#E3E5E8]" />
        <View className="absolute right-3 top-3">
          <HeartOutlineIcon color="#FF9F0A" size={18} />
        </View>
      </View>
      <View className="px-2.5 pb-3 pt-4">
        <Text className="text-[12px] font-medium leading-[16px] text-[#333333]">{item.name}</Text>
        <Text className="mt-1.5 text-[14px] font-medium text-[#222222]">{item.price}</Text>
        <Text className="mt-1 text-[9px] text-[#A7A7A7]">☆ {item.rating} · {item.reviews}</Text>
      </View>
    </Pressable>
  );
}

export default function WishlistScreen() {
  return (
    <View className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false} bounces={false} contentContainerStyle={{ paddingBottom: 18 }}>
        <View className="bg-white px-4 pt-3">
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

          <View className="mt-4 flex-row items-center justify-between">
            <Text className="text-[28px] font-medium text-[#303030]">Favorites</Text>
            <Pressable className="flex-row items-center gap-2 rounded-xl bg-primary px-4 py-2.5">
              <FiltersIcon />
              <Text className="text-[15px] font-medium text-white">Filters</Text>
            </Pressable>
          </View>
        </View>

        <View className="px-4 pt-7">
          <View className="flex-row flex-wrap justify-between">
            {favorites.map((item) => (
              <FavoriteCard key={item.name} item={item} />
            ))}
          </View>
        </View>

        <View className="px-4 pt-10">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-[18px] font-medium text-primary">Recommendations</Text>
            <View className="flex-row items-center gap-1">
              <Text className="text-[14px] text-[#27272A] underline">More</Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }}>
            {recommendations.map((item, index) => (
              <RecommendationCard key={`${item.name}-${index}`} item={item} />
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}
