import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, Share, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Svg, { Circle, Path } from "react-native-svg";
import { HeartFilledIcon, HeartOutlineIcon } from "../../components/ui/home-ui";
import { BackIcon, SearchGrayIcon } from "../../components/ui/general-ui";
import {
  addOrIncrementCartItem,
  getProductBySlug,
  getProductImagesByPid,
  getPublishedProducts,
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

type SimilarItem = {
  pid: string;
  title: string;
  price: string;
  imageUrl?: string;
  rating: string;
};

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
      <Path d="M5 6H7L9.4 14.4H18L20 8.2H8.5" stroke="#2D2D2D" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
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

function StarRow({ rating }: { rating: number }) {
  return (
    <Text className="text-[12px] text-[#F39C12]">
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
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="items-center justify-center bg-[#FFD28C]"
    >
      <Text className="text-[12px] font-semibold text-[#7A4A00]">{initials || "U"}</Text>
    </View>
  );
}

function SimilarCard({
  item,
  wishlisted,
  onToggleWishlist,
}: {
  item: SimilarItem;
  wishlisted: boolean;
  onToggleWishlist: (item: SimilarItem) => void;
}) {
  return (
    <Pressable
      onPress={() => router.push({ pathname: "/product/[slug]", params: { slug: item.pid } })}
      className="mr-3 w-[160px] overflow-hidden rounded-[6px] bg-white shadow-sm"
    >
      <View className="relative h-[118px] overflow-hidden bg-[#E5E5E5]">
        {item.imageUrl ? <Image source={{ uri: item.imageUrl }} className="h-full w-full" resizeMode="cover" /> : null}
        <Pressable className="absolute right-3 top-3" onPress={() => onToggleWishlist(item)}>
          {wishlisted ? <HeartFilledIcon size={20} /> : <HeartOutlineIcon color="#FFB13D" size={20} />}
        </Pressable>
      </View>
      <View className="px-2.5 pb-3 pt-3">
        <Text className="text-[12px] font-medium text-[#2F2F2F]" numberOfLines={1}>{item.title}</Text>
        <Text className="mt-1 text-[13px] font-semibold text-[#2A2A2A]">{item.price}</Text>
        <Text className="mt-1 text-[10px] text-[#A0A0A0]">★ {item.rating}</Text>
      </View>
    </Pressable>
  );
}

export default function ProductDetailsScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const { width } = useWindowDimensions();
  const mainImageWidth = Math.max(280, width - 32);
  const mainImageScrollRef = useRef<ScrollView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [similarProducts, setSimilarProducts] = useState<SimilarItem[]>([]);
  const [selectedSize, setSelectedSize] = useState("M");
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [wishlistedProductIds, setWishlistedProductIds] = useState<Set<number>>(new Set());
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [imageErrorCount, setImageErrorCount] = useState(0);
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
        const [detail, allProducts] = await Promise.all([getProductBySlug(slug), getPublishedProducts()]);
        if (!isMounted) return;
        setProduct(detail);

        const mainImage = resolveMediaUrl(detail.image);
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
        const merged = [mainImage, ...inlineImages, ...extraImages].filter((url): url is string => Boolean(url));
        const unique = Array.from(new Set(merged));
        setGalleryImages(unique);
        setSelectedImageIndex(0);
        setImageErrorCount(0);

        let wishlistIds = new Set<number>();
        try {
          const wishlistItems = await getWishlistItems();
          wishlistIds = new Set(
            wishlistItems.map((item) => getWishlistProductId(item)).filter((value): value is number => typeof value === "number"),
          );
        } catch {
          wishlistIds = new Set();
        }
        setWishlistedProductIds(wishlistIds);

        const related = allProducts
          .filter((item) => item.pid !== detail.pid)
          .filter(
            (item) =>
              (detail.leveltwocategory && item.leveltwocategory === detail.leveltwocategory) ||
              (detail.subcategory && item.subcategory === detail.subcategory) ||
              (detail.category && item.category === detail.category),
          );
        const source = related.length > 0 ? related : allProducts.filter((item) => item.pid !== detail.pid);
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

        try {
          if (detail.id) {
            const productReviews = await getProductReviews(detail.id);
            if (isMounted) setReviews(productReviews);
          }
        } catch {
          if (isMounted) setReviews([]);
        }

        try {
          const vendors = await getVendors();
          const matched = vendors.find((vendor) => vendor.name?.toLowerCase() === String(detail.vendor ?? "").toLowerCase()) ?? null;
          if (isMounted) setVendorInfo(matched);
        } catch {
          if (isMounted) setVendorInfo(null);
        }
      } catch {
        if (!isMounted) return;
        setProduct(null);
        setSimilarProducts([]);
        setVendorInfo(null);
        setReviews([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    void loadProduct();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  const productName = product?.title ?? "";
  const productPrice = formatMoney(product?.price ?? 0);
  const productDescription = (product?.description ?? "").trim();
  const productRating = Number(product?.average_rating ?? 0).toFixed(1);
  const inStock = Boolean(product?.in_stock ?? false);
  const isCurrentWishlisted = typeof product?.id === "number" ? wishlistedProductIds.has(product.id) : false;
  const fallbackMainImage = resolveMediaUrl(product?.image);
  const currentImage = galleryImages[selectedImageIndex] ?? fallbackMainImage;

  const sizeOptions = useMemo(() => {
    const rawSize = product?.size;

    if (Array.isArray(rawSize)) {
      return rawSize.map((value) => String(value).trim()).filter(Boolean);
    }

    if (typeof rawSize === "string") {
      return rawSize
        .split(",")
        .map((value: string) => value.trim())
        .filter(Boolean);
    }

    if (rawSize === null || rawSize === undefined) {
      return [];
    }

    return [String(rawSize).trim()].filter(Boolean);
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
    try {
      setIsAddingToCart(true);
      await addOrIncrementCartItem(product.id);
      notifySuccess("Added to cart", `${productName} has been added to your cart.`);
    } catch {
      notifyError("Add to cart failed", "We couldn't add this item right now. Please try again.");
    } finally {
      setIsAddingToCart(false);
    }
  }

  async function handleToggleWishlistById(productId: number, title: string) {
    try {
      const result = await toggleWishlistByProductId(productId);
      setWishlistedProductIds((prev) => {
        const next = new Set(prev);
        if (result.action === "added") next.add(productId);
        else next.delete(productId);
        return next;
      });
      notifySuccess(result.action === "added" ? "Added to wishlist" : "Removed from wishlist", title);
    } catch {
      notifyError("Wishlist failed", "Unable to update wishlist right now.");
    }
  }

  if (!isLoading && !product) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F7F7F7] px-6">
        <Text className="text-[18px] font-medium text-[#2D2D2D]">Product not available</Text>
        <Pressable onPress={() => router.back()} className="mt-4 rounded-[6px] bg-primary px-5 py-2">
          <Text className="text-white">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  function handleMainImageError() {
    setImageErrorCount((prev) => prev + 1);
    if (galleryImages.length > 1 && selectedImageIndex < galleryImages.length - 1) {
      setSelectedImageIndex((prev) => prev + 1);
    }
  }

  return (
    <View className="flex-1 bg-[#F7F7F7]">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="flex-row items-center justify-between border-b border-[#D9D9D9] bg-[#EFEFEF] px-4 py-3">
          <View className="flex-row items-center gap-3">
            <Pressable onPress={() => router.back()}><BackIcon /></Pressable>
            <Text className="text-[24px] font-medium text-[#313131]">Product Details</Text>
          </View>
          <View className="flex-row items-center gap-3">
            <Pressable onPress={() => router.replace("/(tabs)")}><HomeIcon /></Pressable>
            <Pressable onPress={() => router.push("/search")}><SearchGrayIcon /></Pressable>
            <Pressable onPress={() => router.push("/(tabs)/cart")}><CartDarkIcon /></Pressable>
            <Pressable onPress={() => router.push("/(tabs)/wishlist")}><HeartOutlineIcon color="#2D2D2D" size={22} /></Pressable>
          </View>
        </View>

        <View className="px-4 pt-3">
          <View style={[styles.mainImageContainer, { width: mainImageWidth }]} className="overflow-hidden rounded-[8px] bg-[#F1F1F1]">
            {isLoading ? (
              <View className="h-full w-full items-center justify-center">
                <ActivityIndicator color="#FF9B00" />
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
                    <Image
                      source={{ uri: url }}
                      style={styles.mainImage}
                      resizeMode="contain"
                      onError={handleMainImageError}
                    />
                  </View>
                ))}
              </ScrollView>
            ) : currentImage ? (
              <Image
                key={`main-product-image-${selectedImageIndex}`}
                source={{ uri: currentImage }}
                style={styles.mainImage}
                resizeMode="contain"
                onError={handleMainImageError}
              />
            ) : (
              <View className="h-full w-full items-center justify-center"><Text className="text-[#A1A1A1]">No image</Text></View>
            )}
          </View>
          {!isLoading && currentImage && imageErrorCount > 0 ? (
            <Text className="mt-2 text-[12px] text-[#9A9A9A]">Trying alternate product image...</Text>
          ) : null}

          {!isLoading && galleryImages.length > 1 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
              {galleryImages.map((url, index) => (
                <Pressable
                  key={`${url}-${index}`}
                  onPress={() => {
                    setSelectedImageIndex(index);
                    mainImageScrollRef.current?.scrollTo({ x: index * mainImageWidth, y: 0, animated: true });
                  }}
                  style={styles.thumbContainer}
                  className={`mr-2 overflow-hidden rounded-[6px] border ${selectedImageIndex === index ? "border-primary" : "border-[#D8D8D8]"}`}
                >
                  <Image source={{ uri: url }} style={styles.thumbImage} resizeMode="cover" />
                </Pressable>
              ))}
            </ScrollView>
          ) : null}

          {!isLoading ? (
            <>
              <View className="mt-4 flex-row items-center justify-between">
                <Text className="text-[14px] text-primary">{inStock ? "In Stock" : "Out of Stock"}</Text>
                <View className="flex-row items-center gap-4">
                  <Pressable onPress={() => Share.share({ message: `${productName} - ${productPrice}` })}><ShareIcon /></Pressable>
                  <Pressable onPress={() => product?.id && handleToggleWishlistById(product.id, productName)}>
                    {isCurrentWishlisted ? <HeartFilledIcon size={24} /> : <HeartOutlineIcon color="#FFB13D" size={24} />}
                  </Pressable>
                </View>
              </View>

              <View className="mt-2 flex-row items-start justify-between gap-4">
                <View className="flex-1">
                  <Text className="text-[24px] font-medium leading-8 text-[#2D2D2D]">{productName}</Text>
                  {Number(productRating) > 0 ? <Text className="mt-1 text-[11px] text-[#8A8A8A]">★ {productRating}</Text> : null}
                </View>
                <Text className="text-[24px] font-semibold text-[#2B2B2B]">{productPrice}</Text>
              </View>

              {sizeOptions.length > 0 ? (
                <View className="mt-3 flex-row items-center gap-3">
                  <Text className="text-[15px] text-[#2F2F2F]">Size:</Text>
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
                  <Text className="mt-5 text-[26px] font-medium text-primary">Description</Text>
                  <Text
                    className="mt-3 text-[14px] leading-6 text-[#3A3A3A]"
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
                  className="w-full items-center rounded-[8px] bg-primary py-3.5"
                >
                  <Text className="text-[16px] font-semibold text-white">{isAddingToCart ? "Adding..." : "Add to Cart"}</Text>
                </Pressable>
              </View>

              {vendorInfo || product?.vendor ? (
                <View className="mt-6 flex-row items-center justify-between rounded-[10px] border border-[#EFEFEF] bg-white p-3">
                  <View className="flex-row items-center gap-3">
                    <View className="h-12 w-12 overflow-hidden rounded-full bg-[#FFE8C7]">
                      {vendorInfo?.image ? (
                        <Image source={{ uri: resolveMediaUrl(vendorInfo.image) }} className="h-full w-full" resizeMode="cover" />
                      ) : (
                        <InitialAvatar name={vendorInfo?.name ?? String(product?.vendor ?? "Vendor")} size={48} />
                      )}
                    </View>
                    <View>
                      <Text className="text-[14px] font-semibold text-[#2D2D2D]">{vendorInfo?.name ?? String(product?.vendor ?? "Vendor")}</Text>
                      <Text className="text-[11px] text-[#7A7A7A]">
                        {reviews.length > 0 ? `${reviews.length} review${reviews.length === 1 ? "" : "s"}` : "Vendor"}
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

              <Text className="mt-7 text-[28px] font-medium text-primary">Similar Products</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2">
                {similarProducts.map((item) => (
                  <SimilarCard
                    key={item.pid}
                    item={item}
                    wishlisted={wishlistedProductIds.has(Number(item.pid))}
                    onToggleWishlist={(value) => void handleToggleWishlistById(Number(value.pid), value.title)}
                  />
                ))}
              </ScrollView>

              <View className="mt-8">
                <Text className="text-[28px] font-medium text-primary">Reviews</Text>
                {reviews.length === 0 ? (
                  <Text className="mt-3 text-[14px] text-[#6E6E6E]">No reviews yet for this product.</Text>
                ) : (
                  <>
                    <View className="mt-3 flex-row gap-4">
                      <View className="items-center">
                        <Text className="text-[44px] font-semibold text-[#2D2D2D]">{productRating}</Text>
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
                              <View className="h-[3px] flex-1 rounded-full bg-[#D7D7D7]">
                                <View className="h-[3px] rounded-full bg-primary" style={{ width: `${Math.max(0, pct)}%` }} />
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    </View>

                    <View className="mt-4">
                      {reviews.slice(0, 5).map((review) => (
                        <View key={`review-${review.id}`} className="mb-4 rounded-[8px] border border-[#EFEFEF] bg-white p-3">
                          <View className="flex-row items-start gap-3">
                            <View className="h-10 w-10 overflow-hidden rounded-full bg-[#FFE8C7]">
                              <InitialAvatar name={review.user_name ?? "Customer"} size={40} />
                            </View>
                            <View className="flex-1">
                              <Text className="text-[13px] font-semibold text-[#2D2D2D]">{review.user_name ?? "Customer"}</Text>
                              <View className="mt-1 flex-row items-center gap-2">
                                <StarRow rating={Number(review.rating ?? 0)} />
                                <Text className="text-[11px] text-[#7A7A7A]">{review.formatted_date ?? ""}</Text>
                              </View>
                            </View>
                          </View>
                          <Text className="mt-2 text-[13px] leading-5 text-[#3A3A3A]">{review.review ?? ""}</Text>
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
