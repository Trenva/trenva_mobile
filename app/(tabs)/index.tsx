import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
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
  getFeaturedProducts,
  getFlashSaleProducts,
  getFlashSales,
  getPublishedProducts,
  getSliders,
  getWishlistItems,
  getWishlistProductId,
  resolveMediaUrl,
  toggleWishlistByProductId,
} from "../../lib/api/shop";
import { useProductFilterStore } from "../../store/product-filter-store";
import { notifyError, notifySuccess } from "../../lib/ui/notify";

type ProductCardItem = {
  productId?: number;
  slug: string;
  name: string;
  categoryKey?: string;
  price: string;
  imageUrl?: string;
};

function mapProductToCard(product: ApiProduct): ProductCardItem {
  return {
    productId: product.id,
    slug: String(product.id ?? product.pid),
    name: product.title ?? "Product",
    categoryKey: String(product.category ?? "").toLowerCase(),
    price: formatMoney(product.price),
    imageUrl: resolveMediaUrl(product.image),
  };
}

function mapFlashSaleProductToCard(item: ApiFlashSaleProduct): ProductCardItem | null {
  const details = item.product_details;
  if (!details) return null;
  const priceValue = item.flash_sale_price ?? item.effective_price ?? details.price ?? 0;
  return {
    productId: typeof details.id === "number" ? details.id : item.product,
    slug: String(details.id ?? details.pid ?? item.product),
    name: details.title ?? "Flash Sale Product",
    price: formatMoney(priceValue),
    imageUrl: resolveMediaUrl(details.image),
  };
}

function PromoCard({
  item,
  compact = false,
  wishlisted,
  onToggleWishlist,
}: {
  item: ProductCardItem;
  compact?: boolean;
  wishlisted: boolean;
  onToggleWishlist: (item: ProductCardItem) => void;
}) {
  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/product/[slug]",
          params: { slug: item.slug, name: item.name, price: item.price },
        })
      }
      className={`rounded-[6px] bg-white ${compact ? "mr-2 w-[140px]" : "w-[168px]"}`}
    >
      <View className={`relative overflow-hidden rounded-t-[6px] bg-[#EAEAEA] ${compact ? "h-[110px]" : "h-[122px]"}`}>
        {item.imageUrl ? <Image source={{ uri: item.imageUrl }} className="h-full w-full" resizeMode="cover" /> : null}
        <Pressable className="absolute right-3 top-3" onPress={() => onToggleWishlist(item)}>
          {wishlisted ? <HeartFilledIcon /> : <HeartOutlineIcon />}
        </Pressable>
      </View>
      <View className="border-x border-b border-[#EFEFEF] px-1.5 pb-2 pt-3">
        <Text numberOfLines={1} className="text-[11px] font-semibold text-[#4B4B4B]">
          {item.name}
        </Text>
        <Text className="mt-1 text-[10px] font-bold text-[#4B4B4B]">{item.price}</Text>
      </View>
    </Pressable>
  );
}

function CategoryChip({ title, imageUrl, onPress }: { title: string; imageUrl?: string; onPress?: () => void }) {
  return (
    <Pressable className="mr-4 items-center" onPress={onPress}>
      <View className="h-[42px] w-[42px] items-center justify-center overflow-hidden rounded-full bg-[#F7F1EA]">
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} className="h-full w-full" resizeMode="cover" />
        ) : (
          <Text className="text-base font-semibold text-primary">{(title?.charAt(0) ?? "C").toUpperCase()}</Text>
        )}
      </View>
      <Text className="mt-1.5 max-w-[74px] text-center text-[9px] text-[#6B7280]">{title}</Text>
    </Pressable>
  );
}

function ProductRow({
  items,
  compact = false,
  wishlistedProductIds,
  onToggleWishlist,
}: {
  items: ProductCardItem[];
  compact?: boolean;
  wishlistedProductIds: Set<number>;
  onToggleWishlist: (item: ProductCardItem) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-4" contentContainerStyle={{ paddingRight: 16 }}>
      {items.map((item) => (
        <PromoCard
          key={item.slug}
          item={item}
          compact={compact}
          wishlisted={typeof item.productId === "number" ? wishlistedProductIds.has(item.productId) : false}
          onToggleWishlist={onToggleWishlist}
        />
      ))}
    </ScrollView>
  );
}

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const heroWidth = Math.max(280, width - 32);
  const heroScrollRef = useRef<ScrollView | null>(null);
  const heroIndexRef = useRef(0);

  const [heroIndex, setHeroIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [sliders, setSliders] = useState<ApiSlider[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<ProductCardItem[]>([]);
  const [saleProducts, setSaleProducts] = useState<ProductCardItem[]>([]);
  const [allProducts, setAllProducts] = useState<ProductCardItem[]>([]);
  const [wishlistedProductIds, setWishlistedProductIds] = useState<Set<number>>(new Set());

  const resetFilters = useProductFilterStore((state) => state.resetFilters);
  const setFilters = useProductFilterStore((state) => state.setFilters);

  useEffect(() => {
    let isMounted = true;
    async function loadHomeData() {
      try {
        const [categoryResult, featuredResult, saleResult, productsResult, sliderResult] = await Promise.allSettled([
          getCategories(),
          getFeaturedProducts(),
          (async () => {
            const sales = await getFlashSales({ active: true, featured: true });
            const saleIds = sales.map((sale) => sale.id);
            const rows = await getFlashSaleProducts({ active: true });
            return saleIds.length ? rows.filter((row) => saleIds.includes(row.flash_sale)) : rows;
          })(),
          getPublishedProducts(),
          getSliders(),
        ]);

        const categoryData = categoryResult.status === "fulfilled" ? categoryResult.value : [];
        const featuredData = featuredResult.status === "fulfilled" ? featuredResult.value : [];
        const saleData = saleResult.status === "fulfilled" ? saleResult.value : [];
        const productsData = productsResult.status === "fulfilled" ? productsResult.value : [];
        const sliderData = sliderResult.status === "fulfilled" ? sliderResult.value : [];

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

        const mappedProducts = productsData.map(mapProductToCard);
        const mappedFlashProducts = saleData
          .map((row) => mapFlashSaleProductToCard(row as ApiFlashSaleProduct))
          .filter((row): row is ProductCardItem => row !== null);

        setCategories(categoryData);
        setSliders(sliderData.filter((row) => Boolean(row.image)));
        setFeaturedProducts((featuredData.length ? featuredData : productsData).map(mapProductToCard));
        setSaleProducts(mappedFlashProducts);
        setAllProducts(mappedProducts);
        setWishlistedProductIds(wishlistIds);
      } catch {
        if (!isMounted) return;
        setCategories([]);
        setSliders([]);
        setFeaturedProducts([]);
        setSaleProducts([]);
        setAllProducts([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadHomeData();
    return () => {
      isMounted = false;
    };
  }, []);

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

  async function handleToggleWishlist(item: ProductCardItem) {
    if (!item.productId) {
      notifyError("Wishlist failed", "This product cannot be wishlisted yet.");
      return;
    }
    try {
      const result = await toggleWishlistByProductId(item.productId);
      setWishlistedProductIds((prev) => {
        const next = new Set(prev);
        if (result.action === "added") next.add(item.productId!);
        else next.delete(item.productId!);
        return next;
      });
      notifySuccess(result.action === "added" ? "Added to wishlist" : "Removed from wishlist", item.name);
    } catch {
      notifyError("Wishlist failed", "Unable to update wishlist right now.");
    }
  }

  const suggestedRows = useMemo(() => {
    const rows: ProductCardItem[][] = [];
    for (let i = 0; i < allProducts.length; i += 2) rows.push(allProducts.slice(i, i + 2));
    return rows;
  }, [allProducts]);

  const categorySections = useMemo(
    () =>
      categories
        .map((category) => {
          const normalizedTitle = category.title.toLowerCase();
          const items = allProducts.filter((product) => {
            const key = product.categoryKey ?? "";
            return key === category.cid || key === normalizedTitle;
          });
          return { category, items };
        })
        .filter((entry) => entry.items.length > 0)
        .slice(0, 4),
    [allProducts, categories],
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F7F7F3]" edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false} stickyHeaderIndices={[0]}>
        <View className="bg-[#F7F7F3] px-4 pb-3 pt-3">
          <View className="mb-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5">
              <LocationPinIcon />
              <Text className="text-[13px] font-medium text-[#4B4B4B]">Uyo, Nigeria</Text>
              <Text className="text-[11px] text-[#6B7280]">▼</Text>
            </View>
            <BellIcon />
          </View>
          <Pressable
            onPress={() => {
              resetFilters();
              router.push("/search");
            }}
            className="flex-row items-center rounded-[14px] border border-primary bg-white px-3 py-3"
          >
            <SearchIcon />
            <Text className="pl-3 text-[15px] text-[#98A2B3]">Search</Text>
          </Pressable>
        </View>

        <View className="px-4">
          {sliders.length > 0 ? (
            <View className="mb-8">
              <ScrollView
                ref={heroScrollRef}
                horizontal
                pagingEnabled
                snapToInterval={heroWidth}
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(event) => {
                  const next = Math.round(event.nativeEvent.contentOffset.x / heroWidth);
                  heroIndexRef.current = next;
                  setHeroIndex(next);
                }}
              >
                {sliders.map((slider) => (
                  <View key={`slider-${slider.id}`} className="h-[170px] overflow-hidden rounded-[10px] bg-[#E2E2E2]" style={{ width: heroWidth }}>
                    <Image source={{ uri: resolveMediaUrl(slider.image) }} className="h-full w-full" resizeMode="cover" />
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
                      className={`mx-1 rounded-full ${heroIndex === index ? "bg-primary" : "bg-[#D3D3D3]"}`}
                      style={{ width: heroIndex === index ? 14 : 6, height: 6 }}
                    />
                  ))}
                </View>
              ) : null}
            </View>
          ) : (
            <View className="mb-8 h-[170px] rounded-[10px] bg-[#E2E2E2]" />
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

        <View className="mt-8 bg-[#F91509] px-4 py-5">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <CouponIcon />
              <View>
                <Text className="text-[13px] font-bold text-white">Flash Sales</Text>
                <Text className="mt-1 text-[11px] font-medium tracking-[0.3px] text-white">LIVE DEALS</Text>
              </View>
            </View>
            <Pressable
              onPress={() => {
                setFilters({ query: "", category: "", subcategory: "", leveltwo: "" });
                router.push("/flash-sales");
              }}
            >
              <Text className="text-[12px] font-semibold text-white underline">See All</Text>
            </Pressable>
          </View>
        </View>

        {isLoading ? (
          <View className="items-center py-8">
            <ActivityIndicator color="#FF9B00" />
          </View>
        ) : (
          <>
            <View className="mt-5">
              <ProductRow items={(saleProducts.length ? saleProducts : allProducts).slice(0, 10)} compact wishlistedProductIds={wishlistedProductIds} onToggleWishlist={handleToggleWishlist} />
            </View>

            <View className="mt-7 bg-primary px-4 py-5">
              <View className="flex-row items-center justify-between">
                <Text className="text-[15px] font-semibold text-white">Featured</Text>
                <Pressable
                  onPress={() => {
                    setFilters({ query: "", category: "", subcategory: "", leveltwo: "" });
                    router.push("/featured");
                  }}
                >
                  <Text className="text-[12px] font-semibold text-white">See All</Text>
                </Pressable>
              </View>
            </View>

            <View className="mt-5">
              <ProductRow items={(featuredProducts.length ? featuredProducts : allProducts).slice(0, 10)} compact wishlistedProductIds={wishlistedProductIds} onToggleWishlist={handleToggleWishlist} />
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
                    router.push({ pathname: "/category-products", params: { category: category.title, title: category.title } });
                  }}
                />
                <ProductRow items={items.slice(0, 10)} compact wishlistedProductIds={wishlistedProductIds} onToggleWishlist={handleToggleWishlist} />
              </View>
            ))}

            {allProducts.slice(0, 20).length > 0 ? (
              <>
                <SectionTitle title="Suggested for you" hideViewAll />
                <View className="px-4 pb-10">
                  {suggestedRows.slice(0, 10).map((row, rowIndex) => (
                    <View key={`suggested-row-${rowIndex}`} className={`${rowIndex < suggestedRows.length - 1 ? "mb-4" : ""} flex-row justify-center gap-3`}>
                      {row.map((item) => (
                        <PromoCard key={item.slug} item={item} wishlisted={typeof item.productId === "number" ? wishlistedProductIds.has(item.productId) : false} onToggleWishlist={handleToggleWishlist} />
                      ))}
                    </View>
                  ))}
                </View>
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
