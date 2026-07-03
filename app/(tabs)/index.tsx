import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, RefreshControl, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import {
  BellIcon,
  CouponIcon,
  HeartFilledIcon,
  HeartOutlineIcon,
  LocationPinIcon,
  SearchIcon,
  SectionTitle,
} from "../../components/ui/home-ui";
import {
  type ApiCategory,
  type ApiFlashSaleProduct,
  type ApiProduct,
  type ApiSlider,
  formatMoney,
  getCategories,
  getFeaturedProductsPage,
  getFlashSaleProductsPage,
  getFlashSales,
  isExplicitlyOutOfStock,
  getPublishedProductsPage,
  getPublishedProductsFiltered,
  resolveProductCardImageUrl,
  getSliders,
  getWishlistItems,
  getWishlistProductId,
  resolveMediaUrl,
  toggleWishlistByProductId,
} from "../../lib/api/shop";
import { useProductFilterStore } from "../../store/product-filter-store";
import { clearAuthTokens, getAccessToken } from "../../lib/auth/tokens";
import { notifyError, notifySuccess } from "../../lib/ui/notify";
import { CachedImage, ProductCardImage, prefetchImageUris } from "../../components/ui/cached-image";
import { fontStyles } from "../../lib/ui/typography";
import { useAppTheme } from "../../lib/theme/theme-provider";
import { HomeFeedSkeleton } from "../../components/ui/loading-skeleton";
import { deleteCached } from "../../lib/cache/memory-cache";
import { isUnauthorizedError } from "../../lib/api/errors";
import { promptLoginRequired } from "../../lib/ui/login-required";
import { getResponsiveProductGrid } from "../../lib/ui/responsive-product-grid";
import { fetchProfile } from "../../lib/api/auth";

type ProductCardItem = {
  productId?: number;
  slug: string;
  name: string;
  categoryKey?: string;
  price: string;
  oldPrice?: string;
  discountPercentage?: number;
  inStock?: unknown;
  imageUrl?: string;
};

const HOME_ALL_PRODUCTS_MAX_PAGES = 3;
const ICON_HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 } as const;

function getSaleRemainingSeconds(sale?: { remaining_time?: { days?: number; hours?: number; minutes?: number; seconds?: number; expired?: boolean } }) {
  const remaining = sale?.remaining_time;
  if (!remaining || remaining.expired) return 0;
  const days = Number(remaining.days ?? 0);
  const hours = Number(remaining.hours ?? 0);
  const minutes = Number(remaining.minutes ?? 0);
  const seconds = Number(remaining.seconds ?? 0);
  return Math.max(0, days * 86400 + hours * 3600 + minutes * 60 + seconds);
}

function formatCountdown(totalSeconds?: number | null) {
  if (!totalSeconds || totalSeconds <= 0) return "Ended";
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return days > 0 ? `${days}d ${hh}h : ${mm}m : ${ss}s` : `${hh}h : ${mm}m : ${ss}s`;
}

function mapProductToCard(product: ApiProduct): ProductCardItem {
  return {
    productId: product.id,
    slug: String(product.id ?? product.pid),
    name: product.title ?? "Product",
    categoryKey: String(product.category ?? "").toLowerCase(),
    price: formatMoney(product.price),
    oldPrice: product.old_price ? formatMoney(product.old_price) : undefined,
    discountPercentage: Number(product.discount_percentage ?? 0) || undefined,
    inStock: product.in_stock,
    imageUrl: resolveProductCardImageUrl(product.image),
  };
}

function mapFlashSaleProductToCard(
  item: ApiFlashSaleProduct,
  stockByProductKey?: Map<string, unknown>,
): ProductCardItem | null {
  const details = item.product_details;
  if (!details) return null;
  const priceValue = item.flash_sale_price ?? item.effective_price ?? details.price ?? 0;
  const detailIdKey = typeof details.id === "number" ? `id:${details.id}` : null;
  const detailPidKey = details.pid ? `pid:${String(details.pid)}` : null;
  const rawInStock =
    details.in_stock ??
    (detailIdKey ? stockByProductKey?.get(detailIdKey) : undefined) ??
    (detailPidKey ? stockByProductKey?.get(detailPidKey) : undefined);
  return {
    productId: typeof details.id === "number" ? details.id : item.product,
    slug: String(details.id ?? details.pid ?? item.product),
    name: details.title ?? "Flash Sale Product",
    price: formatMoney(priceValue),
    oldPrice: details.old_price ? formatMoney(details.old_price) : undefined,
    discountPercentage: Number(details.discount_percentage ?? 0) || undefined,
    inStock: rawInStock,
    imageUrl: resolveProductCardImageUrl(details.image),
  };
}

function PromoCard({
  item,
  compact = false,
  width,
  imageHeight,
  wishlisted,
  onToggleWishlist,
  onPress,
}: {
  item: ProductCardItem;
  compact?: boolean;
  width?: number;
  imageHeight?: number;
  wishlisted: boolean;
  onToggleWishlist: (item: ProductCardItem) => void;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  const hasOldPrice = Boolean(item.oldPrice && item.oldPrice !== item.price);
  const discount = Number(item.discountPercentage ?? 0);
  const isOutOfStock = isExplicitlyOutOfStock(item.inStock);
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-[6px] ${compact ? "mr-2 w-[140px]" : "w-[168px]"}`}
      style={[{ backgroundColor: colors.card }, !compact && width ? { width } : null]}
    >
      <View
        className={"relative overflow-hidden rounded-t-[6px]"}
        style={{ backgroundColor: colors.elevated, height: imageHeight ?? (compact ? 110 : 122) }}
      >
        {discount > 0 ? (
          <View className="absolute left-2 top-2 z-10 rounded-full bg-primary px-2 py-0.5">
            <Text className="text-[9px] font-semibold text-white">{`-${Math.round(discount)}%`}</Text>
          </View>
        ) : null}
        {item.imageUrl ? <ProductCardImage uri={item.imageUrl} className="h-full w-full" /> : null}
        {isOutOfStock ? (
          <View className="absolute z-20 rounded-full bg-black/65 px-2 py-0.5" style={{ left: 8, bottom: 8 }}>
            <Text className="text-[9px] font-semibold text-white">Out of stock</Text>
          </View>
        ) : null}
        <Pressable className="absolute right-3 top-3" onPress={() => onToggleWishlist(item)} hitSlop={ICON_HIT_SLOP}>
          {wishlisted ? <HeartFilledIcon /> : <HeartOutlineIcon />}
        </Pressable>
      </View>
      <View className="border-x border-b px-1.5 pb-2 pt-3" style={{ borderColor: colors.border }}>
        <Text numberOfLines={1} className="text-[11px] font-semibold" style={[fontStyles.semibold, { color: colors.text }]}>
          {item.name}
        </Text>
        <View className="mt-1 flex-row items-center gap-1">
          <Text className="text-[12px] font-bold" style={[fontStyles.bold, { color: colors.text }]}>
            {item.price}
          </Text>
          {hasOldPrice ? (
            <Text className="text-[9px] line-through" style={{ color: colors.textMuted }}>
              {item.oldPrice}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

function CategoryChip({ title, imageUrl, onPress }: { title: string; imageUrl?: string; onPress?: () => void }) {
  const { colors } = useAppTheme();
  return (
    <Pressable className="mr-4 items-center" onPress={onPress} hitSlop={ICON_HIT_SLOP}>
      <View className="h-[42px] w-[42px] items-center justify-center overflow-hidden rounded-full" style={{ backgroundColor: colors.elevated }}>
        {imageUrl ? (
          <CachedImage uri={imageUrl} className="h-full w-full" />
        ) : (
          <Text className="text-base font-semibold text-primary" style={fontStyles.semibold}>
            {(title?.charAt(0) ?? "C").toUpperCase()}
          </Text>
        )}
      </View>
      <Text className="mt-1.5 max-w-[74px] text-center text-[9px]" style={[fontStyles.medium, { color: colors.textMuted }]}>
        {title}
      </Text>
    </Pressable>
  );
}

function ProductRow({
  items,
  compact = false,
  compactCardWidth,
  compactImageHeight,
  wishlistedProductIds,
  onToggleWishlist,
  onProductPress,
}: {
  items: ProductCardItem[];
  compact?: boolean;
  compactCardWidth?: number;
  compactImageHeight?: number;
  wishlistedProductIds: Set<number>;
  onToggleWishlist: (item: ProductCardItem) => void;
  onProductPress: (item: ProductCardItem) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-4" contentContainerStyle={{ paddingRight: 16 }}>
      {items.map((item) => (
        <PromoCard
          key={item.slug}
          item={item}
          compact={compact}
          width={compact ? compactCardWidth : undefined}
          imageHeight={compact ? compactImageHeight : undefined}
          wishlisted={typeof item.productId === "number" ? wishlistedProductIds.has(item.productId) : false}
          onPress={() => onProductPress(item)}
          onToggleWishlist={onToggleWishlist}
        />
      ))}
    </ScrollView>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { colors, mode } = useAppTheme();
  const insets = useSafeAreaInsets();
  const flashHeaderTextColor = "#FFFFFF";
  const { width } = useWindowDimensions();
  const [heroWidth, setHeroWidth] = useState(Math.max(280, width - 32));
  const heroScrollRef = useRef<ScrollView | null>(null);
  const heroIndexRef = useRef(0);

  const [heroIndex, setHeroIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [sliders, setSliders] = useState<ApiSlider[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<ProductCardItem[]>([]);
  const [saleProducts, setSaleProducts] = useState<ProductCardItem[]>([]);
  const [allProducts, setAllProducts] = useState<ProductCardItem[]>([]);
  const [homeCategorySections, setHomeCategorySections] = useState<Array<{ category: ApiCategory; items: ProductCardItem[] }>>([]);
  const [wishlistedProductIds, setWishlistedProductIds] = useState<Set<number>>(new Set());
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [locationLabel, setLocationLabel] = useState("Location unavailable");
  const [featuredNextUrl, setFeaturedNextUrl] = useState<string | null>(null);
  const [activeFlashSaleIds, setActiveFlashSaleIds] = useState<number[]>([]);
  const [flashSaleRemainingSeconds, setFlashSaleRemainingSeconds] = useState<number>(0);
  const [flashSaleEndsAtMs, setFlashSaleEndsAtMs] = useState<number | null>(null);
  const suggestedGrid = getResponsiveProductGrid({ width });
  const horizontalCardWidth = width >= 1100 ? 172 : width >= 768 ? 164 : undefined;
  const horizontalImageHeight = width >= 1100 ? 128 : width >= 768 ? 122 : undefined;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const resetFilters = useProductFilterStore((state) => state.resetFilters);
  const setFilters = useProductFilterStore((state) => state.setFilters);

  useEffect(() => {
    let isMounted = true;
      
    async function fetchUserProfile() {
      try {
      const token = await getAccessToken();
        if (!token) {
          return;
        }

      const profile = await fetchProfile();
      setName((profile?.first_name as string | undefined)?.trim() ?? "");
      setEmail((profile?.email as string | undefined)?.trim() ?? "");

      return profile;
      } catch {
        if (isMounted) {
          setName("");
          setEmail("");
        }
      }
  }

    void fetchUserProfile()
    return () => {
      isMounted = false;
    };
  }, []);


  useEffect(() => {
    let isMounted = true;
    async function getHomeProductsWindow() {
      const collected: ApiProduct[] = [];
      let page = 1;
      let nextUrl: string | null = null;

      while (page <= HOME_ALL_PRODUCTS_MAX_PAGES) {
        const res: Awaited<ReturnType<typeof getPublishedProductsPage>> = nextUrl
          ? await getPublishedProductsPage({ nextUrl })
          : await getPublishedProductsPage({ page });
        collected.push(...res.results);
        nextUrl = res.next;
        if (!nextUrl) break;
        page += 1;
      }
      return collected;
    }

    async function loadHomeData() {
      try {
        const [categoryResult, featuredResult, salesResult, saleProductsResult, productsResult, sliderResult, allProductsResult] = await Promise.allSettled([
          getCategories(),
          getFeaturedProductsPage({ page: 1 }),
          getFlashSales({ active: true, featured: true }),
          getFlashSaleProductsPage({ active: true, page: 1 }),
          getPublishedProductsPage({ page: 1 }),
          getSliders(),
          getHomeProductsWindow(),
        ]);

        const categoryData = categoryResult.status === "fulfilled" ? categoryResult.value : [];
        const featuredPage = featuredResult.status === "fulfilled" ? featuredResult.value : { results: [], next: null };
        const salesData = salesResult.status === "fulfilled" ? salesResult.value : [];
        const saleProductsPage = saleProductsResult.status === "fulfilled" ? saleProductsResult.value : { results: [], next: null };
        const productsPage = productsResult.status === "fulfilled" ? productsResult.value : { results: [], next: null };
        const sliderData = sliderResult.status === "fulfilled" ? sliderResult.value : [];
        const allProductsData = allProductsResult.status === "fulfilled" ? allProductsResult.value : productsPage.results;
        const saleIds = salesData.map((sale) => sale.id);
        const firstActiveSale = salesData[0];

        let wishlistIds = new Set<number>();
        try {
          const wishlistItems = await getWishlistItems();
          wishlistIds = new Set(
            wishlistItems.map((item) => getWishlistProductId(item)).filter((value): value is number => typeof value === "number"),
          );
        } catch {
          wishlistIds = new Set();
        }

        if (!isMounted) return;

        const mappedProducts = allProductsData.map(mapProductToCard);
        const stockByProductKey = new Map<string, unknown>();
        allProductsData.forEach((product) => {
          if (typeof product.id === "number") stockByProductKey.set(`id:${product.id}`, product.in_stock);
          if (product.pid) stockByProductKey.set(`pid:${String(product.pid)}`, product.in_stock);
        });
        const mappedFlashProducts = saleProductsPage.results
          .map((row) => mapFlashSaleProductToCard(row as ApiFlashSaleProduct, stockByProductKey))
          .filter((row): row is ProductCardItem => row !== null);
        const filteredFlashProducts =
          saleIds.length > 0
            ? mappedFlashProducts.filter((row) => {
                const source = saleProductsPage.results.find(
                  (item) => String(item.product_details?.id ?? item.product_details?.pid ?? item.product) === row.slug,
                );
                return source ? saleIds.includes(source.flash_sale) : true;
              })
            : mappedFlashProducts;

        const topHomeCategories = categoryData.slice(0, 10);
        const categorySectionRows = await Promise.allSettled(
          topHomeCategories.map(async (category) => {
            let rows = await getPublishedProductsFiltered({
              categoryTitle: category.title,
            });
            if (rows.length === 0 && category.cid) {
              rows = await getPublishedProductsFiltered({
                categoryCid: category.cid,
              });
            }
            return {
              category,
              items: rows.slice(0, 10).map(mapProductToCard),
            };
          }),
        );
        const mappedSections = categorySectionRows
          .map((result, index) => {
            if (result.status === "fulfilled") return result.value;
            const category = topHomeCategories[index];
            if (!category) return null;
            const fallbackItems = mappedProducts
              .filter((product) => {
                const key = product.categoryKey ?? "";
                const normalizedTitle = category.title.toLowerCase();
                return key === category.cid || key === normalizedTitle;
              })
              .slice(0, 10);
            return { category, items: fallbackItems };
          })
          .filter((entry): entry is { category: ApiCategory; items: ProductCardItem[] } => Boolean(entry))
          .filter((entry) => entry.items.length > 0)
          .slice(0, 4);

        setCategories(categoryData);
        setSliders(sliderData.filter((row) => Boolean(row.image)));
        setFeaturedProducts((featuredPage.results.length ? featuredPage.results : productsPage.results).map(mapProductToCard));
        setSaleProducts(filteredFlashProducts);
        setAllProducts(mappedProducts);
        setHomeCategorySections(mappedSections);
        setWishlistedProductIds(wishlistIds);
        setFeaturedNextUrl(featuredPage.next);
        setActiveFlashSaleIds(saleIds);
        const initialRemaining = getSaleRemainingSeconds(firstActiveSale);
        setFlashSaleRemainingSeconds(initialRemaining);
        setFlashSaleEndsAtMs(initialRemaining > 0 ? Date.now() + initialRemaining * 1000 : null);
      } catch {
        if (!isMounted) return;
        setCategories([]);
        setSliders([]);
        setFeaturedProducts([]);
        setSaleProducts([]);
        setAllProducts([]);
        setFeaturedNextUrl(null);
        setActiveFlashSaleIds([]);
        setFlashSaleRemainingSeconds(0);
        setFlashSaleEndsAtMs(null);
        setHomeCategorySections([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    }

    void loadHomeData();
    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  useEffect(() => {
    setHeroWidth(Math.max(280, width - 32));
  }, [width]);

  useEffect(() => {
    if (sliders.length <= 1) return;
    const timer = setInterval(() => {
      const next = (heroIndexRef.current + 1) % sliders.length;
      heroIndexRef.current = next;
      setHeroIndex(next);
      heroScrollRef.current?.scrollTo({ x: next * heroWidth, animated: true });
    }, 3500);
    return () => clearInterval(timer);
  }, [heroWidth, sliders.length]);

  useEffect(() => {
    if (!flashSaleEndsAtMs) return;
    const tick = () => {
      const next = Math.max(0, Math.ceil((flashSaleEndsAtMs - Date.now()) / 1000));
      setFlashSaleRemainingSeconds(next);
      if (next === 0) setFlashSaleEndsAtMs(null);
    };
    tick();
    const timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  }, [flashSaleEndsAtMs]);

  useEffect(() => {
    let mounted = true;
    async function reverseByOpenStreetMap(latitude: number, longitude: number) {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
      );
      if (!response.ok) throw new Error("Reverse geocode failed");
      const data = await response.json();
      const address = data?.address ?? {};
      const city =
        address.city ||
        address.town ||
        address.village ||
        address.county ||
        address.state ||
        "Your Area";
      const country = address.country || "Unknown";
      return `${city}, ${country}`;
    }

    async function loadUserLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          if (mounted) setLocationLabel("Location permission denied");
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        let label = "Location unavailable";
        // Prefer native reverse geocode on device for better stability.
        if (Platform.OS !== "web") {
          try {
            const place = await Location.reverseGeocodeAsync({ latitude, longitude });
            const first = place[0];
            const city = first?.city || first?.district || first?.subregion || first?.region || "Your Area";
            const country = first?.country || "Nigeria";
            label = `${city}, ${country}`;
          } catch {
            // Fallback to OpenStreetMap if native reverse geocode fails.
            try {
              label = await reverseByOpenStreetMap(latitude, longitude);
            } catch {
              label = "Your Area, Nigeria";
            }
          }
        } else {
          try {
            label = await reverseByOpenStreetMap(latitude, longitude);
          } catch {
            label = "Your Area, Nigeria";
          }
        }

        if (mounted) setLocationLabel(label);
      } catch {
        if (mounted) setLocationLabel("Location unavailable");
      }
    }
    void loadUserLocation();
    return () => {
      mounted = false;
    };
  }, []);

  async function loadMoreFeeds() {
    if (isLoading || isLoadingMore) return;
    if (!featuredNextUrl) return;

    setIsLoadingMore(true);
    try {
      const featuredPage = await getFeaturedProductsPage({ nextUrl: featuredNextUrl });

      if (featuredPage) {
        setFeaturedProducts((prev) => [...prev, ...featuredPage.results.map(mapProductToCard)]);
        setFeaturedNextUrl(featuredPage.next);
      }
    } catch {
      // No-op: keep current data and allow retry on next scroll.
    } finally {
      setIsLoadingMore(false);
    }
  }

  function handleScroll(event: {
    nativeEvent: {
      layoutMeasurement: { height: number };
      contentOffset: { y: number };
      contentSize: { height: number };
    };
  }) {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const remaining = contentSize.height - (layoutMeasurement.height + contentOffset.y);
    if (remaining < 180) void loadMoreFeeds();
  }

  async function handleToggleWishlist(item: ProductCardItem) {
    if (!item.productId) {
      notifyError("Wishlist failed", "This product cannot be wishlisted yet.");
      return;
    }
    const productId = item.productId;
    const wasWishlisted = wishlistedProductIds.has(productId);
    setWishlistedProductIds((prev) => {
      const next = new Set(prev);
      if (wasWishlisted) next.delete(productId);
      else next.add(productId);
      return next;
    });
    try {
      const result = await toggleWishlistByProductId(productId);
      notifySuccess(result.action === "added" ? "Added to wishlist" : "Removed from wishlist", item.name);
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

  const categorySections = homeCategorySections;
  const hasActiveFlashSales =
    activeFlashSaleIds.length > 0 &&
    saleProducts.length > 0 &&
    flashSaleRemainingSeconds > 0;
  const flashCountdownLabel = formatCountdown(flashSaleRemainingSeconds);

  useEffect(() => {
    prefetchImageUris(
      [
        ...sliders.slice(0, 4).map((row) => resolveMediaUrl(row.image)),
        ...saleProducts.slice(0, 10).map((row) => row.imageUrl),
        ...featuredProducts.slice(0, 10).map((row) => row.imageUrl),
        ...allProducts.slice(0, 10).map((row) => row.imageUrl),
      ],
      28,
    );
  }, [allProducts, featuredProducts, saleProducts, sliders]);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }} edges={[]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={true}
        stickyHeaderIndices={[0]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              deleteCached("public:sliders");
              deleteCached("public:categories");
              deleteCached("public:flash-sales:true:true");
              setReloadKey((prev) => prev + 1);
            }}
          />
        }
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View className="px-4 pb-3" style={{ backgroundColor: colors.background, paddingTop: Math.max(insets.top + 4, 12) }}>
          <View className="mb-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5">
              <LocationPinIcon />
              <Text className="text-[13px] font-medium" style={[fontStyles.medium, { color: colors.text }]}>
                {locationLabel}
              </Text>
              <Text className="text-[11px]" style={{ color: colors.textMuted }}>▼</Text>
            </View>
            <Pressable onPress={() => router.push("/notifications")} hitSlop={12}>
              <BellIcon />
            </Pressable>
          </View>
          <Pressable
            onPress={() => {
              resetFilters();
              router.push("/search");
            }}
            className="flex-row items-center rounded-[14px] border border-primary px-3 py-3"
            style={{ backgroundColor: colors.card }}
          >
            <SearchIcon />
            <Text className="pl-3 text-[15px]" style={[fontStyles.regular, { color: colors.textMuted }]}>
              Search
            </Text>
          </Pressable>
        </View>

        <View className="px-4">
          {sliders.length > 0 ? (
            <View
              className="overflow-hidden rounded-[10px]"
              onLayout={(event) => {
                const measuredWidth = event.nativeEvent.layout.width;
                if (measuredWidth > 0 && measuredWidth !== heroWidth) {
                  setHeroWidth(measuredWidth);
                }
              }}
            >
              <ScrollView
                ref={heroScrollRef}
                horizontal
                pagingEnabled
                snapToInterval={heroWidth}
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                bounces={false}
                overScrollMode="never"
                onMomentumScrollEnd={(event) => {
                  const next = Math.round(event.nativeEvent.contentOffset.x / heroWidth);
                  heroIndexRef.current = next;
                  setHeroIndex(next);
                }}
              >
                {sliders.map((slider) => (
                  <View key={`slider-${slider.id}`} className="h-[180px] overflow-hidden rounded-[10px]" style={{ width: heroWidth, backgroundColor: colors.elevated }}>
                    <CachedImage uri={resolveMediaUrl(slider.image)!} className="h-full w-full" />
                  </View>
                ))}
              </ScrollView>
              {sliders.length > 1 ? (
                <View className="mt-3 flex-row items-center justify-center">
                  {sliders.map((slider, index) => (
                    <Pressable
                      key={`hero-dot-${slider.id}`}
                      onPress={() => {
                        heroIndexRef.current = index;
                        setHeroIndex(index);
                        heroScrollRef.current?.scrollTo({ x: index * heroWidth, animated: true });
                      }}
                      hitSlop={ICON_HIT_SLOP}
                      className="mx-1 rounded-full"
                      style={{
                        backgroundColor: heroIndex === index ? colors.primary : colors.border,
                        width: heroIndex === index ? 14 : 6,
                        height: 6,
                      }}
                    />
                  ))}
                </View>
              ) : null}
            </View>
          ) : (
            <View className="mb-8 h-[170px] rounded-[10px]" style={{ backgroundColor: colors.elevated }} />
          )}
        </View>

        <SectionTitle title="Category" onPressViewAll={() => router.push("/categories")} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-4" contentContainerStyle={{ paddingRight: 16 }}>
          {categories.slice(0, 10).map((category) => (
            <CategoryChip
              key={category.cid}
              title={category.title}
              imageUrl={resolveMediaUrl(category.image)}
              onPress={() =>
                router.push({
                  pathname: "/category/[slug]",
                  params: { slug: category.cid, title: category.title },
                })
              }
            />
          ))}
        </ScrollView>

        {hasActiveFlashSales ? (
          <View className="mt-8 px-4 py-3" style={{ backgroundColor: mode === "dark" ? "#B91C1C" : "#DC2626" }}>
            <View className="flex-row items-start justify-between">
              <View className="flex-1 flex-row items-start gap-3 pr-3">
                <CouponIcon />
                <View className="flex-1">
                  <Text className="text-[15px] font-bold" style={[fontStyles.bold, { color: flashHeaderTextColor }]}>
                    Flash Sales
                  </Text>
                  <View className="mt-1 self-start rounded-[8px] px-2.5 py-1" style={{ backgroundColor: "rgba(17,24,39,0.28)" }}>
                    <Text className="text-[14px] font-semibold tracking-[0.2px] text-white" style={fontStyles.semibold}>
                      {flashCountdownLabel}
                    </Text>
                  </View>
                </View>
              </View>
              <Pressable
                onPress={() => {
                  setFilters({ query: "", category: "", subcategory: "", leveltwo: "" });
                  router.push("/flash-sales");
                }}
                hitSlop={12}
              >
                <Text className="text-[12px] font-semibold underline" style={[fontStyles.semibold, { color: flashHeaderTextColor }]}>
                  See All
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {isLoading ? (
          <HomeFeedSkeleton />
        ) : (
          <>
            {hasActiveFlashSales ? (
              <View className="mt-5">
                <ProductRow
                  items={saleProducts.slice(0, 10)}
                  compact
                  compactCardWidth={horizontalCardWidth}
                  compactImageHeight={horizontalImageHeight}
                  wishlistedProductIds={wishlistedProductIds}
                  onProductPress={(item) =>
                    router.push({
                      pathname: "/product/[slug]",
                      params: { slug: item.slug, name: item.name, price: item.price },
                    })
                  }
                  onToggleWishlist={handleToggleWishlist}
                />
              </View>
            ) : null}

            <View className="mt-7 bg-primary px-4 py-5">
              <View className="flex-row items-center justify-between">
                <Text className="text-[15px] font-semibold text-white" style={fontStyles.semibold}>
                  Featured
                </Text>
                <Pressable
                  onPress={() => {
                    setFilters({ query: "", category: "", subcategory: "", leveltwo: "" });
                    router.push("/featured");
                  }}
                  hitSlop={12}
                >
                  <Text className="text-[12px] font-semibold text-white" style={fontStyles.semibold}>
                    See All
                  </Text>
                </Pressable>
              </View>
            </View>

            <View className="mt-5">
              <ProductRow
                items={(featuredProducts.length ? featuredProducts : allProducts).slice(0, 10)}
                compact
                compactCardWidth={horizontalCardWidth}
                compactImageHeight={horizontalImageHeight}
                wishlistedProductIds={wishlistedProductIds}
                onProductPress={(item) =>
                  router.push({
                    pathname: "/product/[slug]",
                    params: { slug: item.slug, name: item.name, price: item.price },
                  })
                }
                onToggleWishlist={handleToggleWishlist}
              />
            </View>

            {categorySections.map(({ category, items }) => (
              <View key={`home-category-section-${category.cid}`} className="pb-2">
                <SectionTitle
                  title={category.title}
                  onPressViewAll={() => {
                    setFilters({
                      query: "",
                      category: category.title,
                      subcategory: "",
                      leveltwo: "",
                    });
                    router.push({
                      pathname: "/category-products",
                      params: { category: category.title, title: category.title, cid: category.cid },
                    });
                  }}
                />
                <ProductRow
                  items={items.slice(0, 10)}
                  compact
                  compactCardWidth={horizontalCardWidth}
                  compactImageHeight={horizontalImageHeight}
                  wishlistedProductIds={wishlistedProductIds}
                  onProductPress={(item) =>
                    router.push({
                      pathname: "/product/[slug]",
                      params: { slug: item.slug, name: item.name, price: item.price },
                    })
                  }
                  onToggleWishlist={handleToggleWishlist}
                />
              </View>
            ))}

            {allProducts.length > 0 ? (
              <>
                <SectionTitle title="Suggested for you" hideViewAll />
                <View className="px-4 pb-10">
                  <View className="flex-row flex-wrap justify-center gap-3">
                    {allProducts.map((item) => (
                      <PromoCard
                        key={item.slug}
                        item={item}
                        width={suggestedGrid.cardWidth}
                        imageHeight={suggestedGrid.imageHeight}
                        wishlisted={typeof item.productId === "number" ? wishlistedProductIds.has(item.productId) : false}
                        onPress={() =>
                          router.push({
                            pathname: "/product/[slug]",
                            params: { slug: item.slug, name: item.name, price: item.price },
                          })
                        }
                        onToggleWishlist={handleToggleWishlist}
                      />
                    ))}
                  </View>
                </View>
              </>
            ) : (
              <View className="px-6 pb-10 pt-4">
                <Text className="text-center text-[14px]" style={{ color: colors.textMuted }}>
                  No products available right now.
                </Text>
                <Pressable
                  onPress={() => setReloadKey((prev) => prev + 1)}
                  className="mt-5 self-center rounded-full bg-primary px-6 py-3"
                >
                  <Text className="text-[13px] font-semibold text-white">Explore Products</Text>
                </Pressable>
              </View>
            )}
            {isLoadingMore ? (
              <View className="items-center pb-10 pt-2">
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
