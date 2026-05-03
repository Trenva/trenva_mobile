import { useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
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

type CartTotal = {
  total_items: number;
  total_price: number;
};

export default function CartScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cartItems, setCartItems] = useState<ApiCartItem[]>([]);
  const [cartTotal, setCartTotal] = useState<CartTotal>({ total_items: 0, total_price: 0 });
  const [errorText, setErrorText] = useState<string | null>(null);

  async function loadCartData(isPullRefresh = false) {
    try {
      if (isPullRefresh) {
        setIsRefreshing(true);
      } else {
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
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    void loadCartData();
  }, []);

  async function handleDelete(id: number) {
    try {
      await removeCartItem(id);
      await loadCartData();
      notifySuccess("Removed from cart", "Product removed successfully.");
    } catch {
      notifyError("Remove failed", "Unable to remove this item right now.");
    }
  }

  async function handleQuantityChange(id: number, qty: number) {
    const nextQty = Math.max(1, qty);
    const previous = cartItems;
    setCartItems((prev) => prev.map((item) => (item.id === id ? { ...item, qty: nextQty } : item)));

    try {
      await updateCartItemQty(id, nextQty);
      await loadCartData();
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
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadCartData(true)} />}
      >
        <View className="bg-white px-4 pb-4 pt-3">
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

          <View className="mt-4">
            <Text className="text-[28px] font-medium text-[#303030]">Cart</Text>
          </View>
        </View>

        {isLoading ? (
          <View className="px-4">
            <LoadingListSkeleton rows={3} />
          </View>
        ) : errorText ? (
          <View className="px-6 py-10">
            <Text className="text-center text-[14px] text-[#666666]">{errorText}</Text>
            <Pressable onPress={() => void loadCartData()} className="mt-4 self-center rounded-full bg-primary px-5 py-2.5">
              <Text className="text-[13px] text-white">Retry</Text>
            </Pressable>
          </View>
        ) : cartItems.length === 0 ? (
          <View className="px-6 py-12">
            <Text className="text-center text-[16px] text-[#666666]">Your cart is empty.</Text>
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

        <Pressable onPress={() => router.push("/address")} className="mx-4 mt-2 rounded-full bg-primary py-4" android_ripple={{ color: "#e08800" }}>
          <Text className="text-center text-base font-bold text-white">
            {cartItems.length ? `Make Payment (${formatMoney(cartTotal.total_price)})` : "Make Payment"}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
