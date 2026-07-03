import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Share, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { goBackOr } from "../../lib/navigation/go-back-or";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";
import { HeartFilledIcon, HeartOutlineIcon } from "../../components/ui/home-ui";
import { SearchGrayIcon } from "../../components/ui/general-ui";
import {
  addOrIncrementCartItem,
  getRelatedProductsById,
  getProductBySlug,
  getProductImagesByPid,
  isExplicitlyOutOfStock,
  getProductReviews,
  getVendors,
  getWishlistItems,
  getWishlistProductId,
  resolveMediaUrl,
  toggleWishlistByProductId,
  type ApiProduct,
  type ApiProductReview,
  type ApiVendor,
  formatMoney,
} from "../../lib/api/shop";
import { notifyError, notifySuccess } from "../../lib/ui/notify";
import { CachedImage, ProductCardImage } from "../../components/ui/cached-image";
import { useAppTheme } from "../../lib/theme/theme-provider";
import { isUnauthorizedError } from "../../lib/api/errors";
import { promptLoginRequired } from "../../lib/ui/login-required";

type SimilarItem = {
  pid: string;
  title: string;
  price: string;
  imageUrl?: string;
  rating: string;
};
const ICON_HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 } as const;

function HomeIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path 
        d="M4 10.6L12 4L20 10.6V20H14.4V14.2H9.6V20H4V10.6Z" 
        fill="none" 
        stroke={color} 
        strokeWidth={2} 
        strokeLinejoin="round" 
        strokeLinecap="round"
      />
    </Svg>
  );
}

function CartDarkIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M5 6H7L9.4 14.4H18L20 8.2H8.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={10} cy={18} r={1.5} fill={color} />
      <Circle cx={17} cy={18} r={1.5} fill={color} />
    </Svg>
  );
}

function ShareIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx={18} cy={5} r={2} stroke={color} strokeWidth={1.8} />
      <Circle cx={6} cy={12} r={2} stroke={color} strokeWidth={1.8} />
      <Circle cx={18} cy={19} r={2} stroke={color} strokeWidth={1.8} />
      <Path d="M7.8 11L16 6.2" stroke={color} strokeWidth={1.8} />
      <Path d="M7.8 13L16 17.8" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function ThemedBackIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M15 6L9 12L15 18" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function StarRow({ rating }: { rating: number }) {
  const { colors } = useAppTheme();
  return (
    <Text className="text-[12px]" style={{ color: colors.primary }}>
      {"★".repeat(Math.max(0, Math.min(5, rating)))}{"☆".repeat(Math.max(0, 5 - rating))}
    </Text>
  );
}

function InitialAvatar({
  name,
  size = 40,
}: {
  name: string;
  size?: number;
}) {
  const initials = name
    .split(" ")
    .map((part) => part.trim().charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: "#FFB13D" }}
      className="items-center justify-center"
    >
      <Text className="text-[12px] font-semibold text-white">{initials || "U"}</Text>
    </View>
  );
}

function SimilarCard({
  item,
  wishlisted,
  onToggleWishlist,
  onPress,
}: {
  item: SimilarItem;
  wishlisted: boolean;
  onToggleWishlist: (item: SimilarItem) => void;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      className="mr-3 w-[160px] overflow-hidden rounded-[6px] shadow-sm"
      style={{ backgroundColor: colors.card }}
    >
      <View className="relative h-[118px] overflow-hidden" style={{ backgroundColor: colors.elevated }}>
        {item.imageUrl ? <ProductCardImage uri={item.imageUrl} className="h-full w-full" /> : null}
        <Pressable className="absolute right-3 top-3" onPress={() => onToggleWishlist(item)} hitSlop={ICON_HIT_SLOP}>
          {wishlisted ? <HeartFilledIcon size={20} /> : <HeartOutlineIcon color="#FFB13D" size={20} />}
        </Pressable>
      </View>
      <View className="px-2.5 pb-3 pt-3">
        <Text className="text-[12px] font-medium" style={{ color: colors.text }} numberOfLines={1}>{item.title}</Text>
        <Text className="mt-1 text-[13px] font-semibold" style={{ color: colors.text }}>{item.price}</Text>
        <Text className="mt-1 text-[10px]" style={{ color: colors.textMuted }}>★ {item.rating}</Text>
      </View>
    </Pressable>
  );
}

export default function ProductDetailsScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const contentMaxWidth = width >= 900 ? 980 : undefined;
  const mainImageWidth = Math.max(280, width - 32);
  const mainImageScrollRef = useRef<ScrollView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [similarProducts, setSimilarProducts] = useState<SimilarItem[]>([]);
  const [selectedSize, setSelectedSize] = useState("M");
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [wishlistedProductIds, setWishlistedProductIds] = useState<Set<number>>(new Set());
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [vendorInfo, setVendorInfo] = useState<ApiVendor | null>(null);
  const [reviews, setReviews] = useState<ApiProductReview[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadProduct() {
      if (!slug) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setSimilarProducts([]);
        setVendorInfo(null);
        setReviews([]);

        const detail = await getProductBySlug(slug);
        if (!isMounted) return;
        setProduct(detail);

        const mainImage = resolveMediaUrl(detail.image);
        // Render instantly with the primary image, then enrich gallery in background.
        const initialGallery = [mainImage].filter((url): url is string => Boolean(url));
        setGalleryImages(initialGallery);
        setSelectedImageIndex(0);
        setIsLoading(false);
        setIsRefreshing(false);

        void (async () => {
          // 1) Load full image gallery
          const inlineImages = (detail.p_images ?? [])
            .map((row) => resolveMediaUrl(row.images))
            .filter((url): url is string => Boolean(url));
          let extraImages: string[] = [];
          if (detail.pid) {
            try {
              extraImages = (await getProductImagesByPid(detail.pid))
                .map((row) => resolveMediaUrl(row.images))
                .filter((url): url is string => Boolean(url));
            } catch {
              extraImages = [];
            }
          }
          if (!isMounted) return;
          const merged = [mainImage, ...inlineImages, ...extraImages].filter((url): url is string => Boolean(url));
          const unique = Array.from(new Set(merged));
          if (unique.length > 0) setGalleryImages(unique);

          // 2) Load non-critical sections in parallel
          const [wishlistResult, relatedResult, reviewsResult, vendorsResult] = await Promise.allSettled([
            getWishlistItems(),
            detail.id ? getRelatedProductsById(detail.id, 12) : Promise.resolve([]),
            detail.id ? getProductReviews(detail.id) : Promise.resolve([]),
            getVendors(),
          ]);
          if (!isMounted) return;

          if (wishlistResult.status === "fulfilled") {
            const wishlistIds = new Set(
              wishlistResult.value.map((item) => getWishlistProductId(item)).filter((value): value is number => typeof value === "number"),
            );
            setWishlistedProductIds(wishlistIds);
          } else {
            setWishlistedProductIds(new Set());
          }

          if (relatedResult.status === "fulfilled") {
            const source = relatedResult.value.filter((item) => item.pid !== detail.pid);
            const mappedSimilar = source
              .slice(0, 8)
              .map((item) => ({
                pid: String(item.id ?? item.pid),
                title: item.title,
                price: formatMoney(item.price),
                imageUrl: resolveMediaUrl(item.image),
                rating: Number(item.average_rating ?? 4.5).toFixed(1),
              }));
            setSimilarProducts(mappedSimilar);
          }

          if (reviewsResult.status === "fulfilled") {
            setReviews(reviewsResult.value);
          } else {
            setReviews([]);
          }

          if (vendorsResult.status === "fulfilled") {
            const matched = vendorsResult.value.find(
              (vendor) => vendor.name?.toLowerCase() === String(detail.vendor ?? "").toLowerCase(),
            ) ?? null;
            setVendorInfo(matched);
          } else {
            setVendorInfo(null);
          }
        })();
      } catch {
        if (!isMounted) return;
        setProduct(null);
        setSimilarProducts([]);
        setVendorInfo(null);
        setReviews([]);
        setIsLoading(false);
        setIsRefreshing(false);
      } finally {
        // no-op: staged loading controls these flags above
      }
    }
    void loadProduct();
    return () => {
      isMounted = false;
    };
  }, [slug, reloadKey]);

  const productName = product?.title ?? "";
  const productPrice = formatMoney(product?.price ?? 0);
  const productDescription = (product?.description ?? "").trim();
  const productRating = Number(product?.average_rating ?? 0).toFixed(1);
  const inStock = !isExplicitlyOutOfStock(product?.in_stock);
  const isCurrentWishlisted = typeof product?.id === "number" ? wishlistedProductIds.has(product.id) : false;
  const fallbackMainImage = resolveMediaUrl(product?.image);
  const currentImage = galleryImages[selectedImageIndex] ?? fallbackMainImage;

  const sizeOptions = useMemo(() => {
    function toSizeLabel(value: unknown): string {
      if (typeof value === "string" || typeof value === "number") {
        return String(value).trim();
      }
      if (value && typeof value === "object") {
        const candidate = value as Record<string, unknown>;
        const prioritizedKeys = ["size", "name", "value", "label", "title"];
        for (const key of prioritizedKeys) {
          const field = candidate[key];
          if (typeof field === "string" || typeof field === "number") {
            const label = String(field).trim();
            if (label) return label;
          }
        }
      }
      return "";
    }

    const rawSize = product?.size;

    if (Array.isArray(rawSize)) {
      return Array.from(new Set(rawSize.map((value) => toSizeLabel(value)).filter(Boolean)));
    }

    if (typeof rawSize === "string") {
      return Array.from(
        new Set(
          rawSize
        .split(",")
        .map((value: string) => value.trim())
            .filter(Boolean),
        ),
      );
    }

    if (rawSize === null || rawSize === undefined) {
      return [];
    }

    return [toSizeLabel(rawSize)].filter(Boolean);
  }, [product?.size]);

  const ratingBreakdown = useMemo(() => {
    const map = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>;
    reviews.forEach((review) => {
      const rating = Number(review.rating ?? 0);
      if (rating >= 1 && rating <= 5) map[rating] += 1;
    });
    return map;
  }, [reviews]);

  async function handleAddToCart() {
    if (isAddingToCart) return;
    if (!product?.id) {
      notifyError("Unable to add item", "Product ID is missing. Please refresh and try again.");
      return;
    }
    if (!inStock) {
      notifyError("Out of stock", "This product is out of stock.");
      return;
    }
    try {
      setIsAddingToCart(true);
      await addOrIncrementCartItem(product.id);
      notifySuccess("Added to cart", `${productName} has been added to your cart.`);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        promptLoginRequired(router, "Please sign in to add items to your cart.");
        return;
      }
      notifyError("Add to cart failed", "We couldn't add this item right now. Please try again.");
    } finally {
      setIsAddingToCart(false);
    }
  }

  async function handleToggleWishlistById(productId: number, title: string) {
    const wasWishlisted = wishlistedProductIds.has(productId);
    setWishlistedProductIds((prev) => {
      const next = new Set(prev);
      if (wasWishlisted) next.delete(productId);
      else next.add(productId);
      return next;
    });
    try {
      const result = await toggleWishlistByProductId(productId);
      notifySuccess(result.action === "added" ? "Added to wishlist" : "Removed from wishlist", title);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        promptLoginRequired(router, "Please sign in to manage your wishlist.");
        return;
      }
      setWishlistedProductIds((prev) => {
        const next = new Set(prev);
        if (wasWishlisted) next.add(productId);
        else next.delete(productId);
        return next;
      });
      notifyError("Wishlist failed", "Unable to update wishlist right now.");
    }
  }

  if (!isLoading && !product) {
    return (
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: colors.background }}>
        <Text className="text-[18px] font-medium" style={{ color: colors.text }}>Product not available</Text>
        <Pressable onPress={() => goBackOr(router)} className="mt-4 rounded-[6px] bg-primary px-5 py-2">
          <Text className="text-white">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              setReloadKey((prev) => prev + 1);
            }}
          />
        }
      >
        <View className="flex-row items-center justify-between border-b px-4 pb-3" style={{ paddingTop: Math.max(insets.top + 4, 12), borderColor: colors.border, backgroundColor: colors.elevated }}>
          <View className="flex-row items-center gap-2">
            <Pressable onPress={() => goBackOr(router)} hitSlop={ICON_HIT_SLOP}><ThemedBackIcon color={colors.text} /></Pressable>
          </View>
          <View className="flex-row items-center gap-7">
            <Pressable onPress={() => router.replace("/(tabs)")} hitSlop={ICON_HIT_SLOP}><HomeIcon color={colors.text} /></Pressable>
            <Pressable onPress={() => router.push("/search")} hitSlop={ICON_HIT_SLOP}><SearchGrayIcon /></Pressable>
            <Pressable onPress={() => router.push("/(tabs)/cart")} hitSlop={ICON_HIT_SLOP}><CartDarkIcon color={colors.text} /></Pressable>
            <Pressable onPress={() => router.push("/(tabs)/wishlist")} hitSlop={ICON_HIT_SLOP}><HeartOutlineIcon color={colors.text} size={22} /></Pressable>
          </View>
        </View>

        <View style={{ width: "100%", maxWidth: contentMaxWidth, alignSelf: "center" }} className="px-4 pt-3">
          <View
            style={[styles.mainImageContainer, { width: mainImageWidth, backgroundColor: colors.elevated, alignSelf: "center" }]}
            className="overflow-hidden rounded-[8px]"
          >
            {isLoading ? (
              <View className="h-full w-full items-center justify-center">
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : galleryImages.length > 0 ? (
              <ScrollView
                ref={mainImageScrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                onMomentumScrollEnd={(event) => {
                  const width = event.nativeEvent.layoutMeasurement.width;
                  const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
                  setSelectedImageIndex(nextIndex);
                }}
              >
                {galleryImages.map((url, index) => (
                  <View key={`${url}-${index}`} style={[styles.mainImageContainer, { width: mainImageWidth }]}>
                    <CachedImage uri={url} style={styles.mainImage} contentFit="contain" />
                  </View>
                ))}
              </ScrollView>
            ) : currentImage ? (
              <CachedImage key={`main-product-image-${selectedImageIndex}`} uri={currentImage} style={styles.mainImage} contentFit="contain" />
            ) : (
              <View className="h-full w-full items-center justify-center"><Text style={{ color: colors.textMuted }}>No image</Text></View>
            )}
          </View>
          {!isLoading && galleryImages.length > 1 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
              {galleryImages.map((url, index) => (
                <Pressable
                  key={`${url}-${index}`}
                  onPress={() => {
                    setSelectedImageIndex(index);
                    mainImageScrollRef.current?.scrollTo({ x: index * mainImageWidth, y: 0, animated: true });
                  }}
                  hitSlop={ICON_HIT_SLOP}
                  className={`mr-2 overflow-hidden rounded-[6px] border ${selectedImageIndex === index ? "border-primary" : ""}`}
                  style={selectedImageIndex === index ? styles.thumbContainer : [styles.thumbContainer, { borderColor: colors.border }]}
                >
                  <CachedImage uri={url} style={styles.thumbImage} />
                </Pressable>
              ))}
            </ScrollView>
          ) : null}

          {!isLoading ? (
            <>
              <View className="mt-4 flex-row items-center justify-between">
                <Text className="text-[14px] text-primary">{inStock ? "In Stock" : "Out of Stock"}</Text>
                <View className="flex-row items-center gap-4">
                  <Pressable onPress={() => Share.share({ message: `${productName} - ${productPrice}` })} hitSlop={ICON_HIT_SLOP}><ShareIcon color={colors.primary} /></Pressable>
                  <Pressable onPress={() => product?.id && handleToggleWishlistById(product.id, productName)} hitSlop={ICON_HIT_SLOP}>
                    {isCurrentWishlisted ? <HeartFilledIcon size={24} /> : <HeartOutlineIcon color="#FFB13D" size={24} />}
                  </Pressable>
                </View>
              </View>

              <View className="mt-2 flex-row items-start justify-between gap-4">
                <View className="flex-1">
                  <Text numberOfLines={2} className="text-[20px] font-medium leading-7" style={{ color: colors.text }}>{productName}</Text>
                  {Number(productRating) > 0 ? <Text className="mt-1 text-[11px] text-[#8A8A8A]">★ {productRating}</Text> : null}
                </View>
                <Text className="text-[22px] font-semibold" style={{ color: colors.text }}>{productPrice}</Text>
              </View>

              {sizeOptions.length > 0 ? (
                <View className="mt-3 flex-row items-center gap-3">
                  <Text className="text-[15px]" style={{ color: colors.text }}>Size:</Text>
                  {sizeOptions.map((size: string) => (
                    <Pressable
                      key={size}
                      onPress={() => setSelectedSize(size)}
                      className={`h-[30px] min-w-[30px] items-center justify-center rounded-[6px] border px-1.5 ${selectedSize === size ? "border-primary bg-primary" : "border-[#8A8A8A] bg-white"}`}
                    >
                      <Text className={`text-[13px] ${selectedSize === size ? "text-white" : "text-[#1F1F1F]"}`}>{size}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              {productDescription ? (
                <>
                  <Text className="mt-5 text-[22px] font-medium text-primary">Description</Text>
                  <Text
                    className="mt-3 text-[14px] leading-6"
                    style={{ color: colors.text }}
                    numberOfLines={isDescriptionExpanded ? undefined : 4}
                  >
                    {productDescription}
                  </Text>
                  {productDescription.length > 180 ? (
                    <Pressable onPress={() => setIsDescriptionExpanded((prev) => !prev)} className="mt-2 self-start">
                      <Text className="text-[13px] font-medium text-primary">
                        {isDescriptionExpanded ? "Show less" : "Show more"}
                      </Text>
                    </Pressable>
                  ) : null}
                </>
              ) : null}

              <View className="mt-6">
                <Pressable
                  onPress={() => void handleAddToCart()}
                  disabled={!inStock || isAddingToCart}
                  className="w-full items-center rounded-[8px] py-3.5"
                  style={{ backgroundColor: !inStock || isAddingToCart ? colors.textMuted : colors.primary }}
                >
                  <Text className="text-[16px] font-semibold text-white">
                    {!inStock ? "Out of Stock" : isAddingToCart ? "Adding..." : "Add to Cart"}
                  </Text>
                </Pressable>
              </View>

              {vendorInfo || product?.vendor ? (
                <View className="mt-6 flex-row items-center justify-between rounded-[10px] border p-3" style={{ borderColor: colors.border, backgroundColor: colors.card }}>
                  <View className="flex-row items-center gap-3">
                    <View className="h-12 w-12 overflow-hidden rounded-full" style={{ backgroundColor: colors.elevated }}>
                      {vendorInfo?.image ? (
                        <CachedImage uri={resolveMediaUrl(vendorInfo.image)!} className="h-full w-full" />
                      ) : (
                        <InitialAvatar name={vendorInfo?.name ?? String(product?.vendor ?? "Vendor")} size={48} />
                      )}
                    </View>
                    <View>
                      <Text className="text-[14px] font-semibold" style={{ color: colors.text }}>{vendorInfo?.name ?? String(product?.vendor ?? "Vendor")}</Text>
                      <Text className="text-[11px] text-[#7A7A7A]">
                        {Number(vendorInfo?.follower_count ?? 0)} follower{Number(vendorInfo?.follower_count ?? 0) === 1 ? "" : "s"}
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: "/vendor/[slug]",
                        params: {
                          slug: vendorInfo?.vid ?? String(vendorInfo?.name ?? product?.vendor ?? "vendor").toLowerCase().replace(/\s+/g, "-"),
                          name: vendorInfo?.name ?? String(product?.vendor ?? "Vendor"),
                        },
                      })
                    }
                    className="rounded-[6px] border border-primary px-3 py-1.5"
                  >
                    <Text className="text-[12px] font-semibold text-primary">Profile</Text>
                  </Pressable>
                </View>
              ) : null}

              <Text className="mt-7 text-[24px] font-medium text-primary">Similar Products</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2">
                {similarProducts.map((item) => (
                  <SimilarCard
                    key={item.pid}
                    item={item}
                    wishlisted={wishlistedProductIds.has(Number(item.pid))}
                    onToggleWishlist={(value) => void handleToggleWishlistById(Number(value.pid), value.title)}
                    onPress={() => router.push({ pathname: "/product/[slug]", params: { slug: item.pid } })}
                  />
                ))}
              </ScrollView>

              <View className="mt-8">
                <Text className="text-[24px] font-medium text-primary">Reviews</Text>
                {reviews.length === 0 ? (
                  <Text className="mt-3 text-[14px]" style={{ color: colors.textMuted }}>No reviews yet for this product.</Text>
                ) : (
                  <>
                    <View className="mt-3 flex-row gap-4">
                      <View className="items-center">
                        <Text className="text-[34px] font-semibold" style={{ color: colors.text }}>{productRating}</Text>
                        <StarRow rating={Math.round(Number(productRating))} />
                        <Text className="mt-1 text-[12px] text-[#7A7A7A]">{reviews.length} reviews</Text>
                      </View>
                      <View className="flex-1 justify-center">
                        {[5, 4, 3, 2, 1].map((score) => {
                          const count = ratingBreakdown[score];
                          const pct = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
                          return (
                            <View key={`rating-${score}`} className="mb-2 flex-row items-center gap-2">
                              <Text className="w-4 text-[12px] text-[#666666]">{score}</Text>
                              <View className="h-[3px] flex-1 rounded-full" style={{ backgroundColor: colors.border }}>
                                <View className="h-[3px] rounded-full bg-primary" style={{ width: `${Math.max(0, pct)}%` }} />
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    </View>

                    <View className="mt-4">
                      {reviews.slice(0, 5).map((review) => (
                        <View key={`review-${review.id}`} className="mb-4 rounded-[8px] border p-3" style={{ borderColor: colors.border, backgroundColor: colors.card }}>
                          <View className="flex-row items-start gap-3">
                            <View className="h-10 w-10 overflow-hidden rounded-full" style={{ backgroundColor: colors.elevated }}>
                              <InitialAvatar name={review.user_name ?? "Customer"} size={40} />
                            </View>
                            <View className="flex-1">
                              <Text className="text-[13px] font-semibold" style={{ color: colors.text }}>{review.user_name ?? "Customer"}</Text>
                              <View className="mt-1 flex-row items-center gap-2">
                                <StarRow rating={Number(review.rating ?? 0)} />
                                <Text className="text-[11px] text-[#7A7A7A]">{review.formatted_date ?? ""}</Text>
                              </View>
                            </View>
                          </View>
                          <Text className="mt-2 text-[13px] leading-5" style={{ color: colors.text }}>{review.review ?? ""}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}
              </View>
            </>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainImageContainer: {
    height: 260,
  },
  mainImage: {
    width: "100%",
    height: "100%",
  },
  thumbContainer: {
    width: 62,
    height: 62,
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
});
