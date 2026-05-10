import { useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { goBackOr } from "../../lib/navigation/go-back-or";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LoadingListSkeleton } from "../../components/ui/loading-skeleton";
import { CartItem, PriceDetails } from "../../components/product/CartItem";
import { BackIcon, SearchGrayIcon, BellDarkIcon } from "../../components/ui/general-ui";
import { clearAuthTokens } from "../../lib/auth/tokens";
import { getApiErrorMessage, isUnauthorizedError } from "../../lib/api/errors";
import {
  type ApiCartItem,
  formatMoney,
  getCartItems,
  getCartTotal,
  removeCartItem,
  resolveMediaUrl,
  updateCartItemQty,
} from "../../lib/api/shop";
import { notifyError, notifySuccess } from "../../lib/ui/notify";
import { useAppTheme } from "../../lib/theme/theme-provider";

type CartTotal = {
  total_items: number;
  total_price: number;
};

export default function CartScreen() {
  const router = useRouter();
  const { colors, mode } = useAppTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const contentMaxWidth = width >= 900 ? 980 : undefined;
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cartItems, setCartItems] = useState<ApiCartItem[]>([]);
  const [cartTotal, setCartTotal] = useState<CartTotal>({ total_items: 0, total_price: 0 });
  const [errorText, setErrorText] = useState<string | null>(null);

  async function loadCartData(isPullRefresh = false, showPageLoader = true) {
    try {
      if (isPullRefresh) {
        setIsRefreshing(true);
      } else if (showPageLoader) {
        setIsLoading(true);
      }

      const [items, total] = await Promise.all([getCartItems(), getCartTotal()]);
      setCartItems(items);
      setCartTotal(total);
      setErrorText(null);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        await clearAuthTokens();
        notifyError("Session expired", "Please log in again.");
        router.replace("/(auth)/login");
        return;
      }

      setCartItems([]);
      setCartTotal({ total_items: 0, total_price: 0 });
      setErrorText(getApiErrorMessage(error, "Could not load cart right now."));
    } finally {
      if (showPageLoader || isPullRefresh) {
        setIsLoading(false);
      }
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    void loadCartData();
  }, []);

  async function handleDelete(id: number) {
    const previousItems = cartItems;
    const previousTotal = cartTotal;
    const nextItems = cartItems.filter((item) => item.id !== id);
    const nextTotalPrice = nextItems.reduce((acc, item) => {
      const total = Number(item.total_price ?? 0);
      return acc + (Number.isNaN(total) ? 0 : total);
    }, 0);

    setCartItems(nextItems);
    setCartTotal({
      total_items: nextItems.length,
      total_price: nextTotalPrice,
    });

    try {
      await removeCartItem(id);
      await loadCartData(false, false);
      notifySuccess("Removed from cart", "Product removed successfully.");
    } catch {
      setCartItems(previousItems);
      setCartTotal(previousTotal);
      notifyError("Remove failed", "Unable to remove this item right now.");
    }
  }

  async function handleQuantityChange(id: number, qty: number) {
    const nextQty = Math.max(1, qty);
    const previous = cartItems;
    setCartItems((prev) => prev.map((item) => (item.id === id ? { ...item, qty: nextQty } : item)));

    try {
      await updateCartItemQty(id, nextQty);
      await loadCartData(false, false);
    } catch {
      setCartItems(previous);
      notifyError("Update failed", "Unable to update quantity right now.");
    }
  }

  const subtotalNumber = cartItems.reduce((acc, item) => {
    const total = Number(item.total_price ?? 0);
    return acc + (Number.isNaN(total) ? 0 : total);
  }, 0);

  const subtotalText = subtotalNumber.toLocaleString();
  const totalText = Number(cartTotal.total_price ?? subtotalNumber).toLocaleString();

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
        bounces={true}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: cartItems.length > 0 ? 120 : 32 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadCartData(true)} />}
      >
        <View
          className="px-4 pb-4"
          style={{ width: "100%", maxWidth: contentMaxWidth, alignSelf: "center", paddingTop: Math.max(insets.top + 4, 12), backgroundColor: colors.background }}
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

          <View className="mt-4">
            <Text className="text-[24px] font-medium" style={{ color: colors.text }}>Cart</Text>
          </View>
        </View>

        {isLoading ? (
          <View style={{ width: "100%", maxWidth: contentMaxWidth, alignSelf: "center" }} className="px-4">
            <LoadingListSkeleton rows={3} />
          </View>
        ) : errorText ? (
          <View className="px-6 py-10">
            <Text className="text-center text-[14px]" style={{ color: colors.textMuted }}>{errorText}</Text>
            <Pressable onPress={() => void loadCartData()} className="mt-4 self-center rounded-full bg-primary px-5 py-2.5">
              <Text className="text-[13px] text-white">Retry</Text>
            </Pressable>
          </View>
        ) : cartItems.length === 0 ? (
          <View className="px-6 py-12">
            <Text className="text-center text-[16px]" style={{ color: colors.textMuted }}>Your cart is empty.</Text>
            <Pressable onPress={() => router.push("/(tabs)")} className="mt-5 self-center rounded-full bg-primary px-6 py-3">
              <Text className="text-[13px] font-semibold text-white">Explore Products</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {cartItems.map((item) => (
              <CartItem
                key={item.id}
                name={item.product_name ?? "Product"}
                price={String(item.product_price ?? 0)}
                quantity={item.qty ?? 1}
                stock="In Stock"
                image={resolveMediaUrl(item.product_image) ? { uri: resolveMediaUrl(item.product_image) } : require("../../assets/cart-logo.png")}
                onDelete={() => void handleDelete(item.id)}
                onQuantityChange={(qty) => void handleQuantityChange(item.id, qty)}
              />
            ))}

            <PriceDetails
              items={cartTotal.total_items || cartItems.length}
              subtotal={subtotalText}
              discount="0"
              delivery="0"
              total={totalText}
            />
          </>
        )}

      </ScrollView>

      {!isLoading && !errorText && cartItems.length > 0 ? (
        <View className="border-t px-4 pb-4 pt-3" style={{ borderColor: colors.border, backgroundColor: colors.card }}>
          <View style={{ width: "100%", maxWidth: contentMaxWidth, alignSelf: "center" }}>
          <Pressable onPress={() => router.push("/address")} className="rounded-full bg-primary py-4" android_ripple={{ color: "#e08800" }}>
            <Text className="text-center text-base font-bold text-white">
              {`Make Payment (${formatMoney(cartTotal.total_price)})`}
            </Text>
          </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}




