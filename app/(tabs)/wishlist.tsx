import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { goBackOr } from "../../lib/navigation/go-back-or";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HeartFilledIcon, HeartOutlineIcon, TrashIcon } from "../../components/ui/home-ui";
import { BackIcon, SearchGrayIcon, BellDarkIcon } from "../../components/ui/general-ui";
import {
  type ApiProduct,
  type ApiWishlistItem,
  formatMoney,
  getWishlistProductId,
  isExplicitlyOutOfStock,
  getPublishedProductsPage,
  getWishlistItems,
  removeWishlistItem,
  resolveProductCardImageUrl,
  toggleWishlistByProductId,
} from "../../lib/api/shop";
import { notifyError, notifySuccess } from "../../lib/ui/notify";
import { CachedImage } from "../../components/ui/cached-image";
import { useAppTheme } from "../../lib/theme/theme-provider";
import { ProductGridSkeleton } from "../../components/ui/loading-skeleton";

type WishlistCardItem = {
  id: number;
  slug: string;
  name: string;
  price: string;
  oldPrice?: string;
  discountPercentage?: number;
  inStock?: unknown;
  imageUrl?: string;
};

function FavoriteCard({ item, onRemove, onPress }: { item: WishlistCardItem; onRemove: () => void; onPress: () => void }) {
  const { colors } = useAppTheme();
  const discount = Number(item.discountPercentage ?? 0);
  const isOutOfStock = isExplicitlyOutOfStock(item.inStock);
  return (
    <Pressable
      onPress={onPress}
      className="mb-4 w-[48%] overflow-hidden rounded-[6px] shadow-sm"
      style={{ backgroundColor: colors.card }}
    >
      <View className="relative h-[126px] overflow-hidden" style={{ backgroundColor: colors.elevated }}>
        {discount > 0 ? (
          <View className="absolute left-2 top-2 z-10 rounded-full bg-primary px-2 py-0.5">
            <Text className="text-[9px] font-semibold text-white">{`-${Math.round(discount)}%`}</Text>
          </View>
        ) : null}
        {item.imageUrl ? <CachedImage uri={item.imageUrl} className="h-full w-full" /> : null}
        {isOutOfStock ? (
          <View className="absolute z-20 rounded-full bg-black/65 px-2 py-0.5" style={{ left: 8, bottom: 8 }}>
            <Text className="text-[9px] font-semibold text-white">Out of stock</Text>
          </View>
        ) : null}
        <Pressable onPress={onRemove} className="absolute right-3 top-3">
          <TrashIcon size={18} />
        </Pressable>
      </View>
      <View className="px-2.5 pb-3 pt-4">
        <Text numberOfLines={2} className="text-[13px] font-medium leading-[17px]" style={{ color: colors.text }}>
          {item.name}
        </Text>
        <View className="mt-1.5 flex-row items-center gap-1">
          <Text className="text-[15px] font-medium" style={{ color: colors.text }}>{item.price}</Text>
          {item.oldPrice && item.oldPrice !== item.price ? (
            <Text className="text-[11px] line-through" style={{ color: colors.textMuted }}>{item.oldPrice}</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

function RecommendationCard({
  product,
  isWishlisted,
  onToggleWishlist,
  onPress,
}: {
  product: ApiProduct;
  isWishlisted: boolean;
  onToggleWishlist: () => void;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  const imageUrl = resolveProductCardImageUrl(product.image);
  const price = formatMoney(product.price);
  const oldPrice = product.old_price ? formatMoney(product.old_price) : null;
  const discount = Number(product.discount_percentage ?? 0);
  const isOutOfStock = isExplicitlyOutOfStock(product.in_stock);

  return (
    <Pressable
      onPress={onPress}
      className="mr-4 w-[145px] overflow-hidden rounded-[6px] shadow-sm"
      style={{ backgroundColor: colors.card }}
    >
      <View className="relative h-[112px] overflow-hidden" style={{ backgroundColor: colors.elevated }}>
        {discount > 0 ? (
          <View className="absolute left-2 top-2 z-10 rounded-full bg-primary px-2 py-0.5">
            <Text className="text-[9px] font-semibold text-white">{`-${Math.round(discount)}%`}</Text>
          </View>
        ) : null}
        {imageUrl ? <CachedImage uri={imageUrl} className="h-full w-full" /> : null}
        {isOutOfStock ? (
          <View className="absolute z-20 rounded-full bg-black/65 px-2 py-0.5" style={{ left: 8, bottom: 8 }}>
            <Text className="text-[9px] font-semibold text-white">Out of stock</Text>
          </View>
        ) : null}
        <Pressable className="absolute right-3 top-3" onPress={onToggleWishlist}>
          {isWishlisted ? <HeartFilledIcon color="#FF9F0A" size={18} /> : <HeartOutlineIcon color="#FF9F0A" size={18} />}
        </Pressable>
      </View>
      <View className="px-2.5 pb-3 pt-4">
        <Text className="text-[12px] font-medium leading-[16px]" style={{ color: colors.text }} numberOfLines={1}>
          {product.title}
        </Text>
        <View className="mt-1.5 flex-row items-center gap-1">
          <Text className="text-[15px] font-medium" style={{ color: colors.text }}>{price}</Text>
          {oldPrice && oldPrice !== price ? (
            <Text className="text-[11px] line-through" style={{ color: colors.textMuted }}>{oldPrice}</Text>
          ) : null}
        </View>
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
    oldPrice: item.product_details?.old_price ? formatMoney(item.product_details.old_price) : undefined,
    discountPercentage: Number(item.product_details?.discount_percentage ?? 0) || undefined,
    inStock: item.product_details?.in_stock,
    imageUrl: resolveProductCardImageUrl(item.product_details?.image),
  };
}

export default function WishlistScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const contentMaxWidth = width >= 900 ? 980 : undefined;
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [wishlistItems, setWishlistItems] = useState<WishlistCardItem[]>([]);
  const [wishlistedProductIds, setWishlistedProductIds] = useState<Set<number>>(new Set());
  const [recommendedProducts, setRecommendedProducts] = useState<ApiProduct[]>([]);

  async function refreshWishlistOnly() {
    const wishlist = await getWishlistItems();
    setWishlistItems(wishlist.map(mapWishlistItem));
    const idSet = new Set(
      wishlist.map((item) => getWishlistProductId(item)).filter((value): value is number => typeof value === "number"),
    );
    setWishlistedProductIds(idSet);
  }

  async function loadWishlist(isPullRefresh = false, showPageLoader = true) {
    try {
      if (isPullRefresh) {
        setIsRefreshing(true);
      } else if (showPageLoader) {
        setIsLoading(true);
      }

      const [wishlist, productsPage] = await Promise.all([getWishlistItems(), getPublishedProductsPage({ page: 1 })]);
      setWishlistItems(wishlist.map(mapWishlistItem));
      const idSet = new Set(
        wishlist.map((item) => getWishlistProductId(item)).filter((value): value is number => typeof value === "number"),
      );
      setWishlistedProductIds(idSet);
      setRecommendedProducts(productsPage.results);
    } catch {
      setWishlistItems([]);
      setWishlistedProductIds(new Set());
      setRecommendedProducts([]);
    } finally {
      if (showPageLoader || isPullRefresh) {
        setIsLoading(false);
      }
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    void loadWishlist();
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadWishlist();
    }, []),
  );

  async function handleRemove(id: number) {
    const previousItems = wishlistItems;
    const previousIdSet = new Set(wishlistedProductIds);
    const removedItem = wishlistItems.find((item) => item.id === id);
    const removedProductId = removedItem ? Number(removedItem.slug) : NaN;

    setWishlistItems((prev) => prev.filter((item) => item.id !== id));
    if (!Number.isNaN(removedProductId)) {
      setWishlistedProductIds((prev) => {
        const next = new Set(prev);
        next.delete(removedProductId);
        return next;
      });
    }

    try {
      await removeWishlistItem(id);
      await loadWishlist(false, false);
      notifySuccess("Removed from wishlist", "Product removed successfully.");
    } catch {
      setWishlistItems(previousItems);
      setWishlistedProductIds(previousIdSet);
      notifyError("Remove failed", "Unable to remove this wishlist item right now.");
    }
  }

  async function handleToggleRecommendationWishlist(product: ApiProduct) {
    const productId = typeof product.id === "number" ? product.id : NaN;
    if (Number.isNaN(productId)) return;
    const wasWishlisted = wishlistedProductIds.has(productId);
    setWishlistedProductIds((prev) => {
      const next = new Set(prev);
      if (wasWishlisted) next.delete(productId);
      else next.add(productId);
      return next;
    });
    if (wasWishlisted) {
      setWishlistItems((prev) => prev.filter((row) => Number(row.slug) !== productId));
    }

    try {
      const result = await toggleWishlistByProductId(productId);
      if (result.action === "added") {
        notifySuccess("Added to favorites", product.title);
      } else {
        notifySuccess("Removed from favorites", product.title);
      }
      await refreshWishlistOnly();
    } catch {
      setWishlistedProductIds((prev) => {
        const next = new Set(prev);
        if (wasWishlisted) next.add(productId);
        else next.delete(productId);
        return next;
      });
      notifyError("Wishlist failed", "Unable to update wishlist right now.");
    }
  }

  const visibleRecommendations = useMemo(
    () => recommendedProducts.filter((product) => (typeof product.id === "number" ? !wishlistedProductIds.has(product.id) : true)).slice(0, 10),
    [recommendedProducts, wishlistedProductIds],
  );

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
        bounces={true}
        contentContainerStyle={{ paddingBottom: 18 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadWishlist(true)} />}
      >
        <View
          style={{ width: "100%", maxWidth: contentMaxWidth, alignSelf: "center", paddingTop: Math.max(insets.top + 4, 12), backgroundColor: colors.background }}
          className="px-4 pb-3"
        >
          <View className="mb-3 flex-row items-center justify-between">
            <Pressable className="h-8 w-8 items-center justify-center" hitSlop={12} onPress={() => goBackOr(router)}>
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
            <Text className="text-[24px] font-medium" style={{ color: colors.text }}>Favorites</Text>
            <Pressable onPress={() => router.push("/filters")} className="rounded-[6px] border border-primary px-3 py-1.5">
              <Text className="text-[12px] font-semibold text-primary">Filter</Text>
            </Pressable>
          </View>
        </View>

        {isLoading ? (
          <View style={{ width: "100%", maxWidth: contentMaxWidth, alignSelf: "center" }} className="px-4 py-6">
            <ProductGridSkeleton rows={3} />
          </View>
        ) : wishlistItems.length === 0 ? (
          <View className="px-6 py-12">
            <Text className="text-center text-[16px]" style={{ color: colors.textMuted }}>No items in wishlist yet.</Text>
            <Pressable onPress={() => router.push("/featured")} className="mt-5 self-center rounded-full bg-primary px-6 py-3">
              <Text className="text-[13px] font-semibold text-white">Explore Products</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ width: "100%", maxWidth: contentMaxWidth, alignSelf: "center" }} className="px-4 pt-7">
            <View className="flex-row flex-wrap justify-between">
              {wishlistItems.map((item) => (
                <FavoriteCard
                  key={item.id}
                  item={item}
                  onPress={() =>
                    router.push({
                      pathname: "/product/[slug]",
                      params: { slug: item.slug, name: item.name, price: item.price },
                    })
                  }
                  onRemove={() => void handleRemove(item.id)}
                />
              ))}
            </View>
          </View>
        )}

        <View style={{ width: "100%", maxWidth: contentMaxWidth, alignSelf: "center" }} className="px-4 pt-10">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-[18px] font-medium" style={{ color: colors.primary }}>Recommendations</Text>
            <Pressable onPress={() => router.push("/featured")} className="flex-row items-center gap-1">
              <Text className="text-[14px] underline" style={{ color: colors.text }}>More</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 16 }}
          >
            {visibleRecommendations.map((product) => (
              <RecommendationCard
                key={product.pid}
                product={product}
                isWishlisted={typeof product.id === "number" ? wishlistedProductIds.has(product.id) : false}
                onPress={() =>
                  router.push({
                    pathname: "/product/[slug]",
                    params: { slug: String(product.id ?? product.pid), name: product.title, price: formatMoney(product.price) },
                  })
                }
                onToggleWishlist={() => void handleToggleRecommendationWishlist(product)}
              />
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}

