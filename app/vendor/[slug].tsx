import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Share, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { goBackOr } from "../../lib/navigation/go-back-or";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";
import { HeartFilledIcon, HeartOutlineIcon } from "../../components/ui/home-ui";
import { BackIcon, BellDarkIcon, SearchGrayIcon } from "../../components/ui/general-ui";
import {
  formatMoney,
  getPublishedProductsPage,
  getVendors,
  isExplicitlyOutOfStock,
  getWishlistItems,
  getWishlistProductId,
  resolveMediaUrl,
  resolveProductCardImageUrl,
  toggleVendorFollow,
  toggleWishlistByProductId,
  type ApiProduct,
  type ApiVendor,
} from "../../lib/api/shop";
import { fetchProfile } from "../../lib/api/auth";
import { notifyError, notifySuccess } from "../../lib/ui/notify";
import { CachedImage } from "../../components/ui/cached-image";
import { useAppTheme } from "../../lib/theme/theme-provider";

function normalize(value?: string | null) {
  return (value ?? "").trim().toLowerCase();
}

function VerifiedIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} fill="#FF9F0A" />
      <Path d="M8 12.4L10.6 15L16.2 9.6" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function formatSold(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(value);
}

function VendorProductCard({
  item,
  wishlisted,
  onToggleWishlist,
}: {
  item: ApiProduct;
  wishlisted: boolean;
  onToggleWishlist: (item: ApiProduct) => void;
}) {
  const { colors } = useAppTheme();
  const price = formatMoney(item.price);
  const oldPrice = item.old_price ? formatMoney(item.old_price) : null;
  const imageUrl = resolveProductCardImageUrl(item.image);
  const rating = Number(item.average_rating ?? 0).toFixed(1);
  const isOutOfStock = isExplicitlyOutOfStock(item.in_stock);

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/product/[slug]",
          params: { slug: String(item.id ?? item.pid), name: item.title, price },
        })
      }
      className="mb-4 w-[48%] overflow-hidden rounded-[8px] shadow-sm"
      style={{ backgroundColor: colors.card }}
    >
      <View style={styles.productImageWrap} className="relative overflow-hidden" >
        <View className="absolute inset-0" style={{ backgroundColor: colors.elevated }} />
        {imageUrl ? <CachedImage uri={imageUrl} style={styles.productImage} /> : null}
        {isOutOfStock ? (
          <View className="absolute z-20 rounded-full bg-black/65 px-2 py-0.5" style={{ left: 8, bottom: 8 }}>
            <Text className="text-[9px] font-semibold text-white">Out of stock</Text>
          </View>
        ) : null}
        <Pressable className="absolute right-3 top-3" onPress={() => onToggleWishlist(item)}>
          {wishlisted ? <HeartFilledIcon size={20} /> : <HeartOutlineIcon color="#FFB13D" size={20} />}
        </Pressable>
      </View>
      <View className="px-3 pb-3 pt-3">
        <Text numberOfLines={2} className="text-[13px] font-medium leading-5" style={{ color: colors.text }}>{item.title}</Text>
        <View className="mt-1.5 flex-row items-center gap-2">
          <Text className="text-[14px] font-semibold" style={{ color: colors.text }}>{price}</Text>
          {oldPrice && oldPrice !== price ? <Text className="text-[12px] line-through" style={{ color: colors.textMuted }}>{oldPrice}</Text> : null}
        </View>
        {Number(rating) > 0 ? <Text className="mt-1 text-[10px] text-[#8E8E8E]">★ {rating}</Text> : null}
      </View>
    </Pressable>
  );
}

export default function VendorProfileScreen() {
  const { colors } = useAppTheme();
  const { slug, name } = useLocalSearchParams<{ slug?: string; name?: string }>();
  const insets = useSafeAreaInsets();
  const vendorHint = String(name ?? slug ?? "").trim();
  const { width } = useWindowDimensions();
  const contentMaxWidth = width >= 900 ? 980 : undefined;

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [vendor, setVendor] = useState<ApiVendor | null>(null);
  const [vendorProducts, setVendorProducts] = useState<ApiProduct[]>([]);
  const [nextProductsUrl, setNextProductsUrl] = useState<string | null>(null);
  const [isLoadingMoreProducts, setIsLoadingMoreProducts] = useState(false);
  const [wishlistedProductIds, setWishlistedProductIds] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<"Home" | "Products" | "Categories" | "Reviews">("Home");
  const [sortBy, setSortBy] = useState<"default" | "price_asc" | "price_desc" | "new">("default");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isFollowingVendor, setIsFollowingVendor] = useState(false);
  const [vendorFollowerCount, setVendorFollowerCount] = useState(0);
  const [isFollowBusy, setIsFollowBusy] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadVendorData() {
      try {
        const [vendors, productsPage, wishlist] = await Promise.all([
          getVendors(),
          getPublishedProductsPage({ page: 1 }),
          getWishlistItems().catch(() => []),
        ]);
        if (!isMounted) return;

        const matchedVendor =
          vendors.find((v) => normalize(v.vid) === normalize(slug)) ||
          vendors.find((v) => normalize(v.name) === normalize(vendorHint)) ||
          vendors.find((v) => normalize(v.name).includes(normalize(vendorHint)));
        setVendor(matchedVendor ?? null);
        setIsFollowingVendor(Boolean(matchedVendor?.is_following));
        setVendorFollowerCount(Number(matchedVendor?.follower_count ?? 0));

        const targetVendorName = matchedVendor?.name ?? vendorHint;
        setVendorProducts(
          productsPage.results.filter((product) => normalize(product.vendor) === normalize(targetVendorName)),
        );
        setNextProductsUrl(productsPage.next);

        const wishlistIds = new Set(
          wishlist.map((item) => getWishlistProductId(item)).filter((value): value is number => typeof value === "number"),
        );
        setWishlistedProductIds(wishlistIds);

        try {
          const me = await fetchProfile();
          setCurrentUserId(typeof me.id === "number" ? me.id : null);
        } catch {
          setCurrentUserId(null);
        }
      } catch {
        if (!isMounted) return;
        setVendor(null);
        setVendorProducts([]);
        setNextProductsUrl(null);
        notifyError("Vendor failed", "Unable to load vendor details right now.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    void loadVendorData();
    return () => {
      isMounted = false;
    };
  }, [slug, vendorHint, reloadKey]);

  const vendorName = vendor?.name ?? (vendorHint || "Vendor");
  const vendorImageUrl = resolveMediaUrl(vendor?.image);
  const soldCount = vendor?.total_orders ?? 0;
  const memberSince = vendor?.date ? new Date(vendor.date).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : null;
  const vendorOwnerId = vendor?.user != null ? Number(vendor.user) : null;
  const isOwnVendorAccount =
    vendorOwnerId != null &&
    Number.isFinite(vendorOwnerId) &&
    currentUserId != null &&
    vendorOwnerId === currentUserId;

  const vendorRating = useMemo(() => {
    if (vendorProducts.length === 0) return 0;
    const values = vendorProducts.map((product) => Number(product.average_rating ?? 0)).filter((v) => Number.isFinite(v) && v > 0);
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  }, [vendorProducts]);

  const vendorCategories = useMemo(() => Array.from(new Set(vendorProducts.map((i) => String(i.category ?? "").trim()).filter(Boolean))), [vendorProducts]);
  const filteredVendorProducts = useMemo(() => {
    let rows = [...vendorProducts];
    if (categoryFilter) rows = rows.filter((item) => String(item.category ?? "").trim() === categoryFilter);
    if (sortBy === "price_asc") rows.sort((a, b) => Number(a.price ?? 0) - Number(b.price ?? 0));
    else if (sortBy === "price_desc") rows.sort((a, b) => Number(b.price ?? 0) - Number(a.price ?? 0));
    else if (sortBy === "new") rows.sort((a, b) => Number(b.id ?? 0) - Number(a.id ?? 0));
    return rows;
  }, [categoryFilter, sortBy, vendorProducts]);

  async function handleToggleWishlist(item: ApiProduct) {
    const productId = item.id;
    if (!productId) return;
    const wasWishlisted = wishlistedProductIds.has(productId);
    setWishlistedProductIds((prev) => {
      const next = new Set(prev);
      if (wasWishlisted) next.delete(productId);
      else next.add(productId);
      return next;
    });
    try {
      const result = await toggleWishlistByProductId(productId);
      notifySuccess(result.action === "added" ? "Added to wishlist" : "Removed from wishlist", item.title);
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

  async function handleToggleFollow() {
    if (!vendor?.vid || isOwnVendorAccount || isFollowBusy) return;
    try {
      setIsFollowBusy(true);
      const result = await toggleVendorFollow(vendor.vid);
      if (!result.success) {
        notifyError("Follow failed", result.error || "Could not update follow status.");
        return;
      }
      setIsFollowingVendor(Boolean(result.is_following));
      setVendorFollowerCount(Number(result.follower_count ?? vendorFollowerCount));
      notifySuccess(result.is_following ? "Following vendor" : "Unfollowed vendor", result.message || "");
    } catch {
      notifyError("Follow failed", "Could not update follow status.");
    } finally {
      setIsFollowBusy(false);
    }
  }

  async function handleShareVendorProfile() {
    await Share.share({ message: `Check out ${vendorName} on Trenva` });
  }

  async function loadMoreVendorProducts() {
    if (!nextProductsUrl || isLoadingMoreProducts || isLoading) return;
    try {
      setIsLoadingMoreProducts(true);
      const page = await getPublishedProductsPage({ nextUrl: nextProductsUrl });
      const targetVendorName = vendor?.name ?? vendorHint;
      const additional = page.results.filter((product) => normalize(product.vendor) === normalize(targetVendorName));
      if (additional.length > 0) {
        setVendorProducts((prev) => [...prev, ...additional]);
      }
      setNextProductsUrl(page.next);
    } catch {
      notifyError("Load failed", "Unable to load more vendor products.");
    } finally {
      setIsLoadingMoreProducts(false);
    }
  }

  function handleScroll(event: any) {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const remaining = contentSize.height - (layoutMeasurement.height + contentOffset.y);
    if (remaining < 180) {
      void loadMoreVendorProducts();
    }
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
              setTimeout(() => setIsRefreshing(false), 800);
            }}
          />
        }
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View
          className="px-4 pb-3"
          style={{ backgroundColor: colors.background, width: "100%", maxWidth: contentMaxWidth, alignSelf: "center", paddingTop: Math.max(insets.top + 4, 12) }}
        >
          <View className="mb-4 flex-row items-center justify-between">
            <Pressable className="h-8 w-8 items-center justify-center" onPress={() => goBackOr(router)}><BackIcon /></Pressable>
            <View className="flex-row items-center gap-4">
              <Pressable onPress={() => router.push("/search")}><SearchGrayIcon /></Pressable>
              <BellDarkIcon />
            </View>
          </View>

          {isLoading ? (
            <View className="items-center py-16"><ActivityIndicator color={colors.primary} /></View>
          ) : (
            <>
              <View className="rounded-[12px] border p-4" style={{ borderColor: colors.border, backgroundColor: colors.card }}>
                <View className="flex-row items-start gap-4">
                  <View style={[styles.vendorAvatarWrap, { backgroundColor: colors.elevated }]} className="overflow-hidden rounded-full">
                    {vendorImageUrl ? (
                      <CachedImage uri={vendorImageUrl} style={styles.vendorAvatarImage} />
                    ) : (
                      <View className="h-full w-full items-center justify-center"><Text className="text-[20px] font-semibold" style={{ color: colors.primary }}>{(vendorName.charAt(0) || "V").toUpperCase()}</Text></View>
                    )}
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-1.5">
                      <Text numberOfLines={1} className="text-[24px] font-semibold" style={{ color: colors.text }}>{vendorName}</Text>
                      {vendor?.verified ? <VerifiedIcon /> : null}
                    </View>
                    <Text className="mt-1 text-[16px]" style={{ color: colors.primary }}>{formatSold(soldCount)} Sold</Text>
                    <Text className="mt-0.5 text-[12px]" style={{ color: colors.textMuted }}>
                      {vendorFollowerCount} follower{vendorFollowerCount === 1 ? "" : "s"}
                    </Text>
                    {vendorRating > 0 ? <Text className="mt-0.5 text-[11px] text-[#8B8B8B]">★ {vendorRating.toFixed(1)} average rating</Text> : null}
                    {!isOwnVendorAccount ? (
                      <View className="mt-3 flex-row gap-2">
                        <Pressable
                          onPress={() => void handleToggleFollow()}
                          className={`rounded-[6px] px-3 py-1.5 ${isFollowingVendor ? "" : "bg-primary"}`}
                          style={isFollowingVendor ? { backgroundColor: colors.elevated } : undefined}
                        >
                          <Text className="text-[12px] font-semibold" style={{ color: isFollowingVendor ? colors.text : "#FFFFFF" }}>
                            {isFollowBusy ? "..." : isFollowingVendor ? "Following" : "Follow"}
                          </Text>
                        </Pressable>
                      </View>
                    ) : null}
                  </View>
                </View>

                <View className="mt-5 h-[1px] bg-primary/30" />
                <View className="mt-3 flex-row items-center justify-between px-1">
                  {(["Home", "Products", "Categories", "Reviews"] as const).map((tab) => (
                    <Pressable key={tab} className="items-center" onPress={() => setActiveTab(tab)}>
                      <Text className={`text-[14px] ${activeTab === tab ? "font-semibold text-primary" : ""}`} style={activeTab === tab ? undefined : { color: colors.textMuted }}>{tab}</Text>
                      {activeTab === tab ? <View className="mt-1 h-[2px] w-7 rounded-full bg-primary" /> : null}
                    </Pressable>
                  ))}
                </View>

                {activeTab === "Home" || activeTab === "Reviews" ? (
                  <>
                    <Text className="mt-5 text-[22px] font-medium" style={{ color: colors.text }}>About Vendor</Text>
                    {vendor?.description?.trim() ? <Text className="mt-2 text-[14px] leading-6" style={{ color: colors.text }}>{vendor.description.trim()}</Text> : null}
                    <View className="mt-3 gap-1.5">
                      {memberSince ? <Text className="text-[14px]" style={{ color: colors.textMuted }}><Text className="font-semibold text-primary">Member since:</Text> {memberSince}</Text> : null}
                      {vendor?.address ? <Text className="text-[14px]" style={{ color: colors.textMuted }}><Text className="font-semibold text-primary">Location:</Text> {vendor.address}</Text> : null}
                      {vendor?.shipping_on_time ? <Text className="text-[14px]" style={{ color: colors.textMuted }}><Text className="font-semibold text-primary">Avg. Delivery:</Text> {vendor.shipping_on_time}</Text> : null}
                    </View>
                    <Pressable onPress={() => void handleShareVendorProfile()} className="mt-5 items-center rounded-[6px] bg-primary py-3">
                      <Text className="text-[15px] font-semibold text-white">Share Vendor Profile</Text>
                    </Pressable>
                  </>
                ) : null}

                <View className="mt-5 h-[1px] bg-primary/30" />
                {activeTab !== "Reviews" ? (
                  <View className="mt-4 flex-row items-center justify-between px-1">
                    <Pressable onPress={() => setSortBy("default")}><Text className={`text-[14px] ${sortBy === "default" ? "text-primary" : ""}`} style={sortBy === "default" ? undefined : { color: colors.textMuted }}>Sort By</Text></Pressable>
                    <Pressable onPress={() => setCategoryFilter("")}><Text className={`text-[14px] ${!categoryFilter ? "text-primary" : ""}`} style={!categoryFilter ? undefined : { color: colors.textMuted }}>Category</Text></Pressable>
                    <Pressable onPress={() => setSortBy((p) => (p === "price_asc" ? "price_desc" : "price_asc"))}><Text className={`text-[14px] ${sortBy === "price_asc" || sortBy === "price_desc" ? "text-primary" : ""}`} style={sortBy === "price_asc" || sortBy === "price_desc" ? undefined : { color: colors.textMuted }}>Price</Text></Pressable>
                    <Pressable onPress={() => setSortBy("new")}><Text className={`text-[14px] ${sortBy === "new" ? "text-primary" : ""}`} style={sortBy === "new" ? undefined : { color: colors.textMuted }}>New</Text></Pressable>
                  </View>
                ) : null}
              </View>

              <View className="mt-6 flex-row items-center justify-between">
                <Text className="text-[24px] font-medium" style={{ color: colors.text }}>Vendor Products</Text>
                <Text className="text-[13px]" style={{ color: colors.textMuted }}>{filteredVendorProducts.length} items</Text>
              </View>

              {activeTab === "Categories" && vendorCategories.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
                  {vendorCategories.map((category) => (
                    <Pressable
                      key={category}
                      onPress={() => setCategoryFilter((p) => (p === category ? "" : category))}
                      className={`mr-2 rounded-full px-4 py-2 ${categoryFilter === category ? "bg-primary" : ""}`}
                      style={categoryFilter === category ? undefined : { backgroundColor: colors.elevated }}
                    >
                      <Text className="text-[12px]" style={{ color: categoryFilter === category ? "#FFFFFF" : colors.text }}>{category}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              ) : null}

              {activeTab === "Reviews" ? (
                <View className="mt-4 rounded-[10px] border p-4" style={{ borderColor: colors.border, backgroundColor: colors.card }}>
                  <Text className="text-[16px] font-semibold" style={{ color: colors.text }}>Vendor Reviews Summary</Text>
                  <Text className="mt-2 text-[14px]" style={{ color: colors.textMuted }}>Average rating: {vendorRating > 0 ? vendorRating.toFixed(1) : "N/A"}</Text>
                  <Text className="mt-1 text-[14px]" style={{ color: colors.textMuted }}>Published products: {vendorProducts.length}</Text>
                </View>
              ) : filteredVendorProducts.length === 0 ? (
                <Text className="py-12 text-center text-[14px]" style={{ color: colors.textMuted }}>No products found for this vendor yet.</Text>
              ) : (
                <View className="mt-4 flex-row flex-wrap justify-between">
                  {filteredVendorProducts.map((item) => (
                    <VendorProductCard
                      key={String(item.id ?? item.pid)}
                      item={item}
                      wishlisted={typeof item.id === "number" ? wishlistedProductIds.has(item.id) : false}
                      onToggleWishlist={(value) => void handleToggleWishlist(value)}
                    />
                  ))}
                </View>
              )}
              {isLoadingMoreProducts ? (
                <View className="items-center py-4">
                  <ActivityIndicator color={colors.primary} />
                </View>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  vendorAvatarWrap: {
    width: 72,
    height: 72,
  },
  vendorAvatarImage: {
    width: "100%",
    height: "100%",
  },
  productImageWrap: {
    width: "100%",
    height: 128,
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
});



