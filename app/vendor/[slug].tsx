import { useState } from "react";
import { Pressable, ScrollView, Share, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Svg, { Circle, Path } from "react-native-svg";
import { HeartOutlineIcon } from "../../components/ui/home-ui";
import { BackIcon, BellDarkIcon, SearchGrayIcon } from "../../components/ui/general-ui";

type VendorProduct = {
  name: string;
  price: string;
  oldPrice?: string;
  rating: string;
  reviews: string;
};

const vendorProducts: VendorProduct[] = [
  { name: "FloraCradle Pot", price: "N 1200", oldPrice: "N 1600", rating: "4.5", reviews: "123 Reviews" },
  { name: "Product Name", price: "N 1200", oldPrice: "N 1200", rating: "4.5", reviews: "123 Reviews" },
];

function VerifiedIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} fill="#FF9F0A" />
      <Path d="M8 12.4L10.6 15L16.2 9.6" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DownChevron() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9L12 15L18 9" stroke="#6E6E6E" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function VendorProductCard({ item }: { item: VendorProduct }) {
  const [liked, setLiked] = useState(false);

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
      className="w-[48%] overflow-hidden rounded-[6px] bg-white shadow-sm"
    >
      <View className="relative h-[112px] bg-[#E7E7E7]">
        <Pressable className="absolute right-3 top-3" onPress={() => setLiked((prev) => !prev)}>
          <HeartOutlineIcon color={liked ? "#FF9F0A" : "#FFB13D"} size={20} />
        </Pressable>
      </View>

      <View className="px-2.5 pb-3 pt-3.5">
        <Text className="text-[12px] font-medium text-[#333333]">{item.name}</Text>
        <View className="mt-1 flex-row items-center gap-3">
          <Text className="text-[14px] font-semibold text-[#2D2D2D]">{item.price}</Text>
          {item.oldPrice ? <Text className="text-[13px] text-[#8D8D8D] line-through">{item.oldPrice}</Text> : null}
        </View>
        <Text className="mt-1 text-[9px] text-[#A0A0A0]">* {item.rating} - {item.reviews}</Text>
      </View>
    </Pressable>
  );
}

export default function VendorProfileScreen() {
  const { slug, name } = useLocalSearchParams<{ slug?: string; name?: string }>();
  const vendorName = name ?? "Vendor Name";
  const vendorSlug = slug ?? "vendor-name";

  return (
    <View className="flex-1 bg-[#F7F7F7]">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="px-4 pt-3">
          <View className="mb-4 flex-row items-center justify-between">
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

          <View className="mt-2 flex-row items-center gap-4">
            <View className="h-[68px] w-[68px] rounded-full bg-primary" />
            <View>
              <View className="flex-row items-center gap-1.5">
                <Text className="text-[36px] font-medium text-[#343434]">{vendorName}</Text>
                <VerifiedIcon />
              </View>
              <Text className="text-[19px] text-primary">2.4k Sold</Text>
            </View>
          </View>

          <Pressable className="mt-5 w-[165px] items-center rounded-[6px] bg-primary py-2.5">
            <Text className="text-[15px] font-semibold text-white">Follow Vendor</Text>
          </Pressable>

          <View className="mt-6 h-[1px] bg-primary" />

          <View className="mt-3 flex-row items-center justify-between px-1">
            {["Home", "Products", "Categories", "Reviews"].map((tab, index) => (
              <Pressable key={tab} className="items-center px-2 py-2">
                <Text className={`text-[15px] ${index === 0 ? "font-semibold text-primary" : "text-[#7A7A7A]"}`}>{tab}</Text>
                {index === 0 ? <View className="mt-1 h-[2px] w-6 rounded-full bg-primary" /> : null}
              </Pressable>
            ))}
          </View>

          <Text className="mt-7 text-[33px] font-medium text-[#313131]">About Vendor</Text>
          <Text className="mt-3 text-[16px] leading-7 text-[#4A4A4A]">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque sagittis ipsum ac nisi molestie ultricies.
            Cras eu sem velit. Vivamus convallis augue in quam sodales, vitae porttitor nunc auctor.
          </Text>

          <View className="mt-5 gap-2">
            <Text className="text-[16px] text-[#6A6A6A]"><Text className="font-semibold text-primary">Member since:</Text> June,2025</Text>
            <Text className="text-[16px] text-[#6A6A6A]"><Text className="font-semibold text-primary">Location:</Text> Lagos, Nigeria</Text>
            <Text className="text-[16px] text-[#6A6A6A]"><Text className="font-semibold text-primary">Avg. Delivery:</Text> 3-5 days</Text>
          </View>

          <Pressable
            className="mt-6 items-center rounded-[6px] bg-primary py-3"
            onPress={() => Share.share({ message: `Check out ${vendorName} on Trenva: /vendor/${vendorSlug}` })}
          >
            <Text className="text-[16px] font-semibold text-white">Share Vendor Profile</Text>
          </Pressable>

          <View className="mt-7 h-[1px] bg-primary" />

          <View className="mt-4 flex-row items-center justify-between px-1">
            {["Sort By", "Category", "Price", "New"].map((item) => (
              <Pressable key={item} className="flex-row items-center gap-1">
                <Text className="text-[16px] text-[#6D6D6D]">{item}</Text>
                <DownChevron />
              </Pressable>
            ))}
          </View>

          <Text className="mt-5 text-[33px] font-medium text-[#313131]">Vendor's Product</Text>

          <View className="mt-3 flex-row justify-between">
            {vendorProducts.map((item) => (
              <VendorProductCard key={item.name} item={item} />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
