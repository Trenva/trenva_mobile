import { useState } from "react";
import { Pressable, ScrollView, Share, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { HeartOutlineIcon } from "../../components/ui/home-ui";
import { BackIcon, SearchGrayIcon } from "../../components/ui/general-ui";

type ProductCard = {
  name: string;
  price: string;
  rating: string;
  reviews: string;
};

const similarProducts: ProductCard[] = [
  { name: "Product Name", price: "N 1200", rating: "4.5", reviews: "123 Reviews" },
  { name: "Product Name", price: "N 1200", rating: "4.5", reviews: "123 Reviews" },
  { name: "Product Name", price: "N 1200", rating: "4.5", reviews: "123 Reviews" },
];

function HomeIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M4 10.6L12 4L20 10.6V20H14.4V14.2H9.6V20H4V10.6Z" fill="#2D2D2D" />
    </Svg>
  );
}

function CartDarkIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 6H7L9.4 14.4H18L20 8.2H8.5"
        stroke="#2D2D2D"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={10} cy={18} r={1.5} fill="#2D2D2D" />
      <Circle cx={17} cy={18} r={1.5} fill="#2D2D2D" />
    </Svg>
  );
}

function ShareIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx={18} cy={5} r={2} stroke="#FF9F0A" strokeWidth={1.8} />
      <Circle cx={6} cy={12} r={2} stroke="#FF9F0A" strokeWidth={1.8} />
      <Circle cx={18} cy={19} r={2} stroke="#FF9F0A" strokeWidth={1.8} />
      <Path d="M7.8 11L16 6.2" stroke="#FF9F0A" strokeWidth={1.8} />
      <Path d="M7.8 13L16 17.8" stroke="#FF9F0A" strokeWidth={1.8} />
    </Svg>
  );
}

function MoreVerticalIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={6} r={1.7} fill="#2D2D2D" />
      <Circle cx={12} cy={12} r={1.7} fill="#2D2D2D" />
      <Circle cx={12} cy={18} r={1.7} fill="#2D2D2D" />
    </Svg>
  );
}

function SimilarCard({ item }: { item: ProductCard }) {
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
      className="mr-3 w-[160px] overflow-hidden rounded-[6px] bg-white shadow-sm"
    >
      <View className="relative h-[118px] bg-[#E5E5E5]">
        <Pressable
          className="absolute right-3 top-3"
          onPress={() => setLiked((prev) => !prev)}
        >
          <HeartOutlineIcon color={liked ? "#FF9F0A" : "#FFB13D"} size={20} />
        </Pressable>
      </View>
      <View className="px-2.5 pb-3 pt-3">
        <Text className="text-[12px] font-medium text-[#2F2F2F]">{item.name}</Text>
        <Text className="mt-1 text-[13px] font-semibold text-[#2A2A2A]">{item.price}</Text>
        <Text className="mt-1 text-[9px] text-[#A0A0A0]">* {item.rating} - {item.reviews}</Text>
      </View>
    </Pressable>
  );
}

function ReviewRow() {
  return (
    <View className="mb-6">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="h-8 w-8 rounded-full bg-primary" />
          <Text className="text-[14px] text-[#2E2E2E]">AK Bethel</Text>
        </View>
        <Pressable>
          <MoreVerticalIcon />
        </Pressable>
      </View>

      <Text className="mt-2 text-[13px] text-primary">***** <Text className="text-[#575757]">20/03/2025</Text></Text>
      <Text className="mt-2 text-[15px] leading-7 text-[#3D3D3D]">
        Elevate Your Style With Our Exquisite Handcrafted Embroidery. Each Piece Is Meticulously Crafted Using Premium
        Threads And Fabrics, Perfect For Personalizing Clothing, Accessories.
      </Text>
      <Text className="mt-2 text-[12px] text-primary">1,000 people found this helpful</Text>

      <View className="mt-3 flex-row justify-end gap-3">
        <Pressable className="rounded-[6px] border border-primary px-4 py-1.5">
          <Text className="text-[15px] text-[#6A6A6A]">Yes</Text>
        </Pressable>
        <Pressable className="rounded-[6px] border border-primary px-4 py-1.5">
          <Text className="text-[15px] text-[#6A6A6A]">No</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function ProductDetailsScreen() {
  const { name, price } = useLocalSearchParams<{ slug?: string; name?: string; price?: string }>();
  const [selectedSize, setSelectedSize] = useState("M");
  const [liked, setLiked] = useState(false);
  const productName = name ?? "Flower Embroidery T-Shirt";
  const productPrice = price ?? "N 2000";

  return (
    <View className="flex-1 bg-[#F7F7F7]">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="flex-row items-center justify-between border-b border-[#D9D9D9] bg-[#EFEFEF] px-4 py-3">
          <View className="flex-row items-center gap-3">
            <Pressable onPress={() => router.back()}>
              <BackIcon />
            </Pressable>
            <Text className="text-[27px] font-medium text-[#313131]">Product Details</Text>
          </View>

          <View className="flex-row items-center gap-3">
            <Pressable onPress={() => router.replace("/(tabs)")}>
              <HomeIcon />
            </Pressable>
            <Pressable onPress={() => router.push("/search")}>
              <SearchGrayIcon />
            </Pressable>
            <Pressable onPress={() => router.push("/(tabs)/cart")}>
              <CartDarkIcon />
            </Pressable>
            <Pressable onPress={() => router.push("/(tabs)/wishlist")}>
              <HeartOutlineIcon color="#2D2D2D" size={22} />
            </Pressable>
          </View>
        </View>

        <View className="px-4 pt-3">
          <View className="h-[205px] bg-[#D5D5D5]" />

          <View className="mt-4 flex-row items-center justify-between">
            <Text className="text-[16px] text-primary">In Stock</Text>
            <View className="flex-row items-center gap-4">
              <Pressable onPress={() => Share.share({ message: `${productName} - ${productPrice}` })}>
                <ShareIcon />
              </Pressable>
              <Pressable onPress={() => setLiked((prev) => !prev)}>
                <HeartOutlineIcon color={liked ? "#FF9F0A" : "#FFB13D"} size={24} />
              </Pressable>
            </View>
          </View>

          <View className="mt-2 flex-row items-start justify-between">
            <View className="max-w-[72%]">
              <Text className="text-[34px] font-medium text-[#2D2D2D]">{productName}</Text>
              <Text className="mt-1 text-[10px] text-[#A2A2A2]">* 4.5 - 123 Reviews</Text>
            </View>
            <Text className="text-[42px] font-medium text-[#2B2B2B]">{productPrice}</Text>
          </View>

          <View className="mt-3 flex-row items-center gap-2">
            <Text className="text-[16px] text-[#2F2F2F]">Colours:</Text>
            <View className="h-4 w-4 rounded-full border-2 border-[#2F2F2F] bg-[#A4CBF2]" />
            <View className="h-4 w-4 rounded-full bg-[#F3CC79]" />
          </View>

          <View className="mt-3 flex-row items-center gap-3">
            <Text className="text-[16px] text-[#2F2F2F]">Size:</Text>
            {["XS", "S", "M", "L", "XL"].map((size) => (
              <Pressable
                key={size}
                onPress={() => setSelectedSize(size)}
                className={`h-[30px] w-[30px] items-center justify-center rounded-[6px] border ${
                  selectedSize === size ? "border-primary bg-primary" : "border-[#8A8A8A] bg-white"
                }`}
              >
                <Text className={`text-[15px] ${selectedSize === size ? "text-white" : "text-[#1F1F1F]"}`}>{size}</Text>
              </Pressable>
            ))}
          </View>

          <Text className="mt-3 text-[17px] text-[#444444]">Expected Delivery: 3-5 Days</Text>

          <View className="mt-4 flex-row items-center justify-between rounded-[8px] bg-[#F2F2F2] px-3 py-3">
            <View className="flex-row items-center gap-3">
              <View className="h-[55px] w-[55px] rounded-full bg-primary" />
              <View>
                <Text className="text-[20px] text-[#303030]">Vendor Name</Text>
                <Text className="text-[13px] text-primary">*****</Text>
                <Text className="text-[10px] text-[#A9A9A9]">123 Reviews</Text>
              </View>
            </View>

            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/vendor/[slug]",
                    params: { slug: "vendor-name", name: "Vendor Name" },
                  })
                }
                className="rounded-[6px] border border-primary px-3 py-1.5"
              >
                <Text className="text-[15px] text-[#666666]">Profile</Text>
              </Pressable>
              <Pressable className="rounded-[6px] bg-primary px-3 py-1.5">
                <Text className="text-[15px] font-semibold text-white">Follow</Text>
              </Pressable>
            </View>
          </View>

          <Text className="mt-2 text-[20px] text-[#3F3F3F]">Lenovo</Text>

          <Text className="mt-5 text-[30px] font-medium text-primary">Description</Text>
          <Text className="mt-3 text-[16px] leading-7 text-[#3A3A3A]">
            Elevate Your Style With Our Exquisite Handcrafted Embroidery. Each Piece Is Meticulously Crafted Using
            Premium Threads And Fabrics, Perfect For Personalizing Clothing, Accessories, And Home Decor. Discover
            Unique, Custom Designs That Add Elegance And Charm To Any Item. Experience The Artistry And Quality Of Our
            Beautiful Embroidery Today. <Text className="text-primary underline">Show Less</Text>
          </Text>

          <Text className="mt-3 text-[16px] text-primary underline">Return policy of 10 days after purchase</Text>

          <View className="mt-6 flex-row justify-end">
            <Pressable
              onPress={() => router.push("/(tabs)/cart")}
              className="rounded-[6px] bg-primary px-9 py-3"
            >
              <Text className="text-[20px] font-semibold text-white">Add to Cart</Text>
            </Pressable>
          </View>

          <Text className="mt-7 text-[32px] font-medium text-primary">Similar Products</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2">
            {similarProducts.map((item, index) => (
              <SimilarCard key={`${item.name}-${index}`} item={item} />
            ))}
          </ScrollView>

          <Text className="mt-8 text-[32px] font-medium text-primary">Reviews</Text>
          <Text className="mt-2 text-[14px] text-[#454545]">
            Elevate Your Style With Our Exquisite Handcrafted Embroidery.
          </Text>

          <View className="mt-4 flex-row gap-5">
            <View>
              <Text className="text-[56px] font-semibold text-[#2D2D2D]">5.0</Text>
              <Text className="text-[18px] text-primary">*****</Text>
              <Text className="text-[16px] text-[#3A3A3A]">100+ Reviews</Text>
            </View>

            <View className="flex-1 pt-2">
              {[
                { label: "5", fill: "w-full" },
                { label: "4", fill: "w-4/5" },
                { label: "3", fill: "w-1/12" },
                { label: "2", fill: "w-0" },
                { label: "1", fill: "w-0" },
              ].map((row) => (
                <View key={row.label} className="mb-2 flex-row items-center gap-2">
                  <Text className="w-3 text-[15px] text-[#444444]">{row.label}</Text>
                  <View className="h-[3px] flex-1 bg-[#D3D3D3]">
                    <View className={`h-[3px] bg-primary ${row.fill}`} />
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View className="mt-4">
            <ReviewRow />
            <ReviewRow />
          </View>

          <Pressable>
            <Text className="text-[23px] font-medium text-primary">See all reviews</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
