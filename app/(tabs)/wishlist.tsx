import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { HeartOutlineIcon } from "../../components/ui/home-ui";
import { router } from "expo-router";
import { BackIcon, SearchGrayIcon, BellDarkIcon, FiltersIcon } from "../../components/ui/general-ui";
import {
  type ApiProduct,
  type ApiWishlistItem,
  formatMoney,
  getPublishedProducts,
  getWishlistItems,
  removeWishlistItem,
  resolveMediaUrl,
} from "../../lib/api/shop";
import { notifyError, notifySuccess } from "../../lib/ui/notify";

type WishlistCardItem = {
  id: number;
  slug: string;
  name: string;
  price: string;
  rating: string;
  reviews: string;
  imageUrl?: string;
};

function FavoriteCard({ item, onRemove }: { item: WishlistCardItem; onRemove: () => void }) {
  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/product/[slug]",
          params: { slug: item.slug, name: item.name, price: item.price },
        })
      }
      className="mb-4 w-[48%] overflow-hidden rounded-[6px] bg-white shadow-sm"
    >
      <View className="relative h-[126px] overflow-hidden bg-[#E6E7EB]">
        {item.imageUrl ? <Image source={{ uri: item.imageUrl }} className="h-full w-full" resizeMode="cover" /> : null}
        <Pressable onPress={onRemove} className="absolute right-3 top-3">
          <HeartOutlineIcon color="#FF9F0A" size={18} />
        </Pressable>
      </View>
      <View className="px-2.5 pb-3 pt-4">
        <Text numberOfLines={2} className="text-[13px] font-medium leading-[17px] text-[#333333]">
          {item.name}
        </Text>
        <Text className="mt-1.5 text-[14px] font-medium text-[#222222]">{item.price}</Text>
        <Text className="mt-1 text-[9px] text-[#A7A7A7]">☆ {item.rating} · {item.reviews}</Text>
      </View>
    </Pressable>
  );
}

function RecommendationCard({ product }: { product: ApiProduct }) {
  const imageUrl = resolveMediaUrl(product.image);
  const price = formatMoney(product.price);

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/product/[slug]",
          params: { slug: String(product.id ?? product.pid), name: product.title, price },
        })
      }
      className="mr-4 w-[145px] overflow-hidden rounded-[6px] bg-white shadow-sm"
    >
      <View className="relative h-[112px] overflow-hidden bg-[#E6E7EB]">
        {imageUrl ? <Image source={{ uri: imageUrl }} className="h-full w-full" resizeMode="cover" /> : null}
        <View className="absolute right-3 top-3">
          <HeartOutlineIcon color="#FF9F0A" size={18} />
        </View>
      </View>
      <View className="px-2.5 pb-3 pt-4">
        <Text className="text-[12px] font-medium leading-[16px] text-[#333333]" numberOfLines={1}>{product.title}</Text>
        <Text className="mt-1.5 text-[14px] font-medium text-[#222222]">{price}</Text>
        <Text className="mt-1 text-[9px] text-[#A7A7A7]">☆ {Number(product.average_rating ?? 4.5).toFixed(1)} · 123 Reviews</Text>
      </View>
    </Pressable>
  );
}

function mapWishlistItem(item: ApiWishlistItem): WishlistCardItem {
  return {
    id: item.id,
    slug: String(item.product_details?.id ?? item.product_details?.pid ?? item.product),
    name: item.product_details?.title ?? "Product",
    price: formatMoney(item.product_details?.price),
    rating: "4.5",
    reviews: "123 Reviews",
    imageUrl: resolveMediaUrl(item.product_details?.image),
  };
}

export default function WishlistScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [wishlistItems, setWishlistItems] = useState<WishlistCardItem[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<ApiProduct[]>([]);

  async function loadWishlist(isPullRefresh = false) {
    try {
      if (isPullRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const [wishlist, products] = await Promise.all([getWishlistItems(), getPublishedProducts()]);
      setWishlistItems(wishlist.map(mapWishlistItem));
      setRecommendedProducts(products.slice(0, 10));
    } catch {
      setWishlistItems([]);
      setRecommendedProducts([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    void loadWishlist();
  }, []);

  async function handleRemove(id: number) {
    try {
      await removeWishlistItem(id);
      await loadWishlist();
      notifySuccess("Removed from wishlist", "Product removed successfully.");
    } catch {
      notifyError("Remove failed", "Unable to remove this wishlist item right now.");
    }
  }

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={{ paddingBottom: 18 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadWishlist(true)} />}
      >
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

        {isLoading ? (
          <View className="items-center py-10">
            <ActivityIndicator color="#FF9B00" />
          </View>
        ) : wishlistItems.length === 0 ? (
          <View className="px-6 py-12">
            <Text className="text-center text-[16px] text-[#666666]">No items in wishlist yet.</Text>
          </View>
        ) : (
          <View className="px-4 pt-7">
            <View className="flex-row flex-wrap justify-between">
              {wishlistItems.map((item) => (
                <FavoriteCard key={item.id} item={item} onRemove={() => void handleRemove(item.id)} />
              ))}
            </View>
          </View>
        )}

        <View className="px-4 pt-10">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-[18px] font-medium text-primary">Recommendations</Text>
            <View className="flex-row items-center gap-1">
              <Text className="text-[14px] text-[#27272A] underline">More</Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }}>
            {recommendedProducts.map((product) => (
              <RecommendationCard key={product.pid} product={product} />
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}
