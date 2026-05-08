import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import { Linking } from "react-native";
import { router } from "expo-router";
import { goBackOr } from "../../lib/navigation/go-back-or";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Rect } from "react-native-svg";
import { BackIcon, BellDarkIcon } from "../../components/ui/general-ui";
import { CachedImage } from "../../components/ui/cached-image";
import { fetchProfile } from "../../lib/api/auth";
import {
  formatMoney,
  getCartItems,
  getCartTotal,
  mobilePaystackInit,
  mobilePaystackVerify,
  mobileWalletCheckout,
  resolveMediaUrl,
  validateCouponCode,
} from "../../lib/api/shop";
import { notifyError, notifySuccess } from "../../lib/ui/notify";
import { useCheckoutStore } from "../../store/checkout-store";
import { useAppTheme } from "../../lib/theme/theme-provider";

function CardIcon() {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={11} fill="#2D2D2D" />
      <Rect x={6} y={8.5} width={12} height={7} rx={1.8} stroke="#F1F1F1" strokeWidth={1.3} />
      <Rect x={8} y={11} width={5} height={1.2} rx={0.6} fill="#F1F1F1" />
    </Svg>
  );
}

export default function CheckoutScreen() {
  const { colors, mode } = useAppTheme();
  const insets = useSafeAreaInsets();
  const selectedAddress = useCheckoutStore((state) => state.selectedAddress);
  const selectedPaymentMethod = useCheckoutStore((state) => state.selectedPaymentMethod);
  const setLastOrderId = useCheckoutStore((state) => state.setLastOrderId);
  const setAppliedCoupon = useCheckoutStore((state) => state.setAppliedCoupon);
  const appliedCoupon = useCheckoutStore((state) => state.appliedCoupon);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paystackReference, setPaystackReference] = useState<string | null>(null);
  const [isVerifyingPaystack, setIsVerifyingPaystack] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cartSnapshot, setCartSnapshot] = useState<{
    items: Awaited<ReturnType<typeof getCartItems>>;
    totalItems: number;
    totalPrice: number;
  } | null>(null);

  const firstCartItem = cartSnapshot?.items?.[0];
  const rawTotal = Number(cartSnapshot?.totalPrice ?? 0);
  const couponMinimumOrder = Number(appliedCoupon?.minimumOrder ?? 0);
  const couponEligible = !appliedCoupon || rawTotal >= couponMinimumOrder;
  const couponDiscount =
    appliedCoupon && couponEligible
      ? appliedCoupon.discountType === "percentage"
        ? Math.min((rawTotal * Number(appliedCoupon.discountValue ?? 0)) / 100, rawTotal)
        : Math.min(Number(appliedCoupon.discountValue ?? 0), rawTotal)
      : 0;
  const payableTotal = Math.max(0, rawTotal - couponDiscount);

  async function loadCheckoutSnapshot() {
    try {
      const [items, total] = await Promise.all([getCartItems(), getCartTotal()]);
      setCartSnapshot({
        items,
        totalItems: total.total_items ?? items.length,
        totalPrice: Number(total.total_price ?? 0),
      });
    } catch {
      setCartSnapshot({ items: [], totalItems: 0, totalPrice: 0 });
    } finally {
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    void loadCheckoutSnapshot();
  }, []);

  async function handleMakePayment() {
    if (!selectedAddress) {
      notifyError("Address required", "Please select a shipping address first.");
      router.push("/address");
      return;
    }

    if (!cartSnapshot || cartSnapshot.items.length === 0) {
      notifyError("Cart is empty", "Add items to cart before checkout.");
      router.push("/(tabs)/cart");
      return;
    }

    if (selectedPaymentMethod === "cash_on_delivery") {
      notifyError("Coming soon", "Pay on delivery is not enabled yet.");
      return;
    }

    if (selectedPaymentMethod === "flutterwave") {
      notifyError("Coming soon", "Flutterwave is not enabled in mobile checkout yet.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedPaymentMethod === "wallet") {
        const walletResult = await mobileWalletCheckout({
          addressId: selectedAddress.id,
          deliveryMethod: "Door Step Delivery",
          orderNote: "Null",
          couponCode: appliedCoupon?.code,
          couponId: appliedCoupon?.id,
        });

        if (!walletResult.success) {
          notifyError("Wallet payment failed", walletResult.error ?? "Could not complete wallet payment.");
          return;
        }

        setLastOrderId(walletResult.oid ?? null);
        notifySuccess("Payment successful", walletResult.message ?? "Wallet payment completed.");
        router.push({
          pathname: "/payment-success",
          params: {
            orderId: walletResult.oid ?? "",
            total: String(payableTotal),
            items: String(cartSnapshot.totalItems),
          },
        });
        return;
      }

      if (selectedPaymentMethod === "paystack") {
        await fetchProfile(); // keep auth/profile check in flow

        const initResult = await mobilePaystackInit({
          addressId: selectedAddress.id,
          deliveryMethod: "Door Step Delivery",
          orderNote: "Null",
          couponCode: appliedCoupon?.code,
          couponId: appliedCoupon?.id,
        });

        if (!initResult.success || !initResult.authorization_url || !initResult.reference) {
          notifyError("Paystack init failed", initResult.error ?? "Unable to start Paystack payment.");
          return;
        }

        setPaystackReference(initResult.reference);
        await Linking.openURL(initResult.authorization_url);
        notifySuccess("Continue payment", "Complete payment in Paystack, then tap Verify Payment.");
        return;
      }
    } catch {
      notifyError("Checkout failed", "We couldn't create your order right now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyPaystack() {
    if (!paystackReference) return;
    setIsVerifyingPaystack(true);
    try {
      const verifyResult = await mobilePaystackVerify(paystackReference);
      if (!verifyResult.success) {
        notifyError("Verification failed", verifyResult.error ?? "Payment is not verified yet.");
        return;
      }

      setLastOrderId(verifyResult.oid ?? null);
      notifySuccess("Payment verified", verifyResult.message ?? "Order placed successfully.");
      router.push({
        pathname: "/payment-success",
        params: {
          orderId: verifyResult.oid ?? "",
          total: String(payableTotal),
          items: String(cartSnapshot?.totalItems ?? 0),
        },
      });
    } catch {
      notifyError("Verification failed", "Could not verify Paystack payment.");
    } finally {
      setIsVerifyingPaystack(false);
    }
  }

  async function handleApplyCouponFromCheckout() {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      notifyError("Coupon required", "Enter a coupon code.");
      return;
    }

    setIsApplyingCoupon(true);
    try {
      const profile = await fetchProfile();
      const email = typeof profile?.email === "string" ? profile.email : undefined;
      const validation = await validateCouponCode({ couponCode: code, email });
      if (!validation.valid || !validation.coupon) {
        notifyError("Invalid coupon", validation.message ?? "Coupon is invalid.");
        return;
      }

      const selected = validation.coupon;
      const discountValue = Number(selected.discount ?? 0);
      setAppliedCoupon({
        id: selected.id,
        code: selected.coupon_code,
        discountValue: Number.isNaN(discountValue) ? 0 : discountValue,
        discountType: typeof selected.discount_type === "string" ? selected.discount_type : undefined,
        minimumOrder: Number(selected.minimum_order ?? 0) || 0,
      });
      setCouponInput("");
      notifySuccess("Coupon added", `${selected.coupon_code} added to checkout.`);
    } catch {
      notifyError("Apply failed", "Could not apply coupon right now.");
    } finally {
      setIsApplyingCoupon(false);
    }
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <View
        className="flex-row items-center justify-between px-4 pb-2"
        style={{ paddingTop: Math.max(insets.top + 4, 12) }}
      >
        <Pressable onPress={() => goBackOr(router)} className="h-8 w-8 items-center justify-center">
          <BackIcon />
        </Pressable>
        <Text className="text-[24px] font-medium" style={{ color: colors.text }}>Check out</Text>
        <BellDarkIcon />
      </View>

      <View className="px-5">
        <View className="mb-7 mt-1 flex-row gap-2">
          <View className="h-[4px] flex-1 rounded-full" style={{ backgroundColor: colors.border }} />
          <View className="h-[4px] flex-1 rounded-full" style={{ backgroundColor: colors.border }} />
          <View className="h-[4px] flex-1 rounded-full bg-primary" />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="px-4"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              void loadCheckoutSnapshot();
            }}
          />
        }
      >
        <Text className="text-[16px] font-medium" style={{ color: colors.text }}>Order Review</Text>

        <View className="mt-2 flex-row items-center px-3 py-2" style={{ backgroundColor: colors.elevated }}>
          <View className="h-[78px] w-[92px] overflow-hidden" style={{ backgroundColor: colors.elevated }}>
            {firstCartItem?.product_image ? (
              <CachedImage uri={resolveMediaUrl(firstCartItem.product_image)!} className="h-full w-full" />
            ) : null}
          </View>
          <View className="ml-2 flex-1">
            <Text className="text-[16px]" style={{ color: colors.text }}>{firstCartItem?.product_name ?? "Cart item"}</Text>
            <Text className="mt-2 text-[24px]" style={{ color: colors.text }}>{formatMoney(firstCartItem?.product_price)}</Text>
          </View>
        </View>

        <View className="mt-5 flex-row items-center justify-between">
          <Text className="text-[16px] font-medium" style={{ color: colors.text }}>Deliver to</Text>
          <Pressable onPress={() => router.push("/address")}>
            <Text className="text-[13px] underline" style={{ color: colors.text }}>Edit</Text>
          </Pressable>
        </View>
        <View className="mt-2 px-3 py-3 shadow-sm" style={{ borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card }}>
          <Text className="text-[16px]" style={{ color: colors.text }}>
            {[selectedAddress?.first_name, selectedAddress?.last_name].filter(Boolean).join(" ").trim() || "Selected address"}
          </Text>
          <Text className="text-[13px]" style={{ color: colors.textMuted }}>
            {[selectedAddress?.address, selectedAddress?.city, selectedAddress?.state, selectedAddress?.postal]
              .filter(Boolean)
              .join(", ")}
          </Text>
        </View>
        <View className="mt-2 flex-row items-center gap-2">
          <View className="flex-1 rounded-xl border px-3" style={{ borderColor: colors.border, backgroundColor: colors.card }}>
            <TextInput
              value={couponInput}
              onChangeText={setCouponInput}
              autoCapitalize="characters"
              placeholder="Enter coupon code"
              placeholderTextColor={colors.textMuted}
              className="py-3 text-[14px]"
              style={{ color: colors.text }}
            />
          </View>
          <Pressable
            onPress={handleApplyCouponFromCheckout}
            disabled={isApplyingCoupon}
            className="rounded-xl bg-primary px-4 py-3 disabled:opacity-70"
          >
            {isApplyingCoupon ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-[14px] font-medium text-white">Apply</Text>
            )}
          </Pressable>
        </View>

        <View className="mt-5 flex-row items-center justify-between">
          <Text className="text-[16px] font-medium" style={{ color: colors.text }}>Payment method</Text>
          <Pressable onPress={() => router.push("/payments")}>
            <Text className="text-[13px] underline" style={{ color: colors.text }}>Edit</Text>
          </Pressable>
        </View>
        <View className="mt-2 flex-row items-center gap-3 px-3 py-4 shadow-sm" style={{ borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card }}>
          <CardIcon />
          <Text className="text-[16px]" style={{ color: colors.text }}>{selectedPaymentMethod.replaceAll("_", " ")}</Text>
        </View>

        <View className="mt-5 flex-row items-center justify-between">
          <Text className="text-[16px] font-medium" style={{ color: colors.text }}>Coupon</Text>
          <Pressable onPress={() => router.push("/coupons")}>
            <Text className="text-[13px] underline" style={{ color: colors.text }}>
              {appliedCoupon ? "Change Coupon" : "Choose Coupon"}
            </Text>
          </Pressable>
        </View>
        <View className="mt-2 px-3 py-3 shadow-sm" style={{ borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card }}>
          {appliedCoupon ? (
            <>
              <Text className="text-[15px] font-medium" style={{ color: colors.text }}>Selected coupon: {appliedCoupon.code}</Text>
              {!couponEligible ? (
                <Text className="mt-1 text-[12px]" style={{ color: colors.textMuted }}>
                  Requires minimum order of {formatMoney(couponMinimumOrder)}
                </Text>
              ) : null}
            </>
          ) : (
            <Text className="text-[14px]" style={{ color: colors.textMuted }}>No coupon selected</Text>
          )}
        </View>

        <View className="mt-4 border-t pt-3" style={{ borderColor: colors.border }}>
          <Text className="text-[16px] font-medium" style={{ color: colors.text }}>Price Details</Text>
          <View className="mt-4 gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-[16px]" style={{ color: colors.text }}>Price ({cartSnapshot?.totalItems ?? 0} Items)</Text>
              <Text className="text-[16px]" style={{ color: colors.text }}>{formatMoney(rawTotal)}</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-[16px]" style={{ color: colors.text }}>Discount</Text>
              <Text className="text-[16px]" style={{ color: colors.text }}>{formatMoney(couponDiscount)}</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-[16px]" style={{ color: colors.text }}>Delivery Charges</Text>
              <Text className="text-[16px]" style={{ color: colors.text }}>{formatMoney(0)}</Text>
            </View>
          </View>

          <View className="mt-4 border-t pt-3" style={{ borderColor: mode === "dark" ? colors.border : "#8E8E8E" }}>
            <View className="flex-row items-center justify-between">
              <Text className="text-[18px] font-medium" style={{ color: colors.text }}>Total Amount</Text>
              <Text className="text-[18px] font-medium" style={{ color: colors.text }}>{formatMoney(payableTotal)}</Text>
            </View>
          </View>
        </View>

        <View className="mb-10 mt-6">
          <Pressable onPress={handleMakePayment} disabled={isSubmitting} className="rounded-full bg-primary py-3.5">
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-center text-[16px] font-medium text-white">Make Payment</Text>
            )}
          </Pressable>
          {selectedPaymentMethod === "paystack" && paystackReference ? (
            <Pressable onPress={handleVerifyPaystack} disabled={isVerifyingPaystack} className="mt-3 rounded-full border border-primary py-3.5" style={{ backgroundColor: colors.card }}>
              {isVerifyingPaystack ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Text className="text-center text-[15px] font-medium text-primary">Verify Payment</Text>
              )}
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}



