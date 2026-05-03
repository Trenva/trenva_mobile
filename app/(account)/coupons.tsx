import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { BackIcon } from "../../components/ui/general-ui";
import { TabIcon } from "../../components/ui/home-ui";
import { fetchProfile } from "../../lib/api/auth";
import { ApiCoupon, getCoupons, validateCouponCode } from "../../lib/api/shop";
import { notifyError, notifySuccess } from "../../lib/ui/notify";
import { useCheckoutStore } from "../../store/checkout-store";

type Coupon = {
  id: number;
  title: string;
  subtitle: string;
  dateLine?: string;
  usageLine?: string;
  code: string;
  statusTag?: "used" | "expired" | "used_expired";
};

function HelpIcon() {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9.2} stroke="#2D2D2D" strokeWidth={1.9} />
      <Path d="M12 17H12.01" stroke="#2D2D2D" strokeWidth={1.9} strokeLinecap="round" />
      <Path
        d="M9.5 9.8C9.9 8.6 10.9 8 12.1 8C13.5 8 14.4 8.8 14.4 10C14.4 10.9 13.9 11.4 13.1 11.9C12.4 12.4 12.1 12.9 12.1 13.8"
        stroke="#2D2D2D"
        strokeWidth={1.9}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function OrdersTabIcon({ active }: { active: boolean }) {
  const color = active ? "#FF9F0A" : "#D4A04A";
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M5 5H19V19H5V5Z" stroke={color} strokeWidth={1.8} />
      <Path d="M8 9H16M8 12H16M8 15H13" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function BottomQuickNav() {
  return (
    <View className="px-4 pb-3 pt-2">
      <View className="flex-row items-center justify-between rounded-[12px] bg-[#FAF5EF] px-7 py-4">
        <Pressable onPress={() => router.push("/(tabs)")}>
          <TabIcon routeName="index" color="#D4A04A" />
        </Pressable>
        <Pressable onPress={() => router.push("/(tabs)/cart")}>
          <TabIcon routeName="cart" color="#D4A04A" />
        </Pressable>
        <Pressable onPress={() => router.push("/(tabs)/wishlist")}>
          <TabIcon routeName="wishlist" color="#D4A04A" />
        </Pressable>
        <Pressable onPress={() => router.push("/orders")}>
          <OrdersTabIcon active />
        </Pressable>
        <Pressable onPress={() => router.push("/(tabs)/profile")}>
          <TabIcon routeName="profile" color="#D4A04A" />
        </Pressable>
      </View>
    </View>
  );
}

function CouponCard({
  item,
  expired,
  onUse,
  disabled,
  isApplied,
}: {
  item: Coupon;
  expired?: boolean;
  onUse?: () => void;
  disabled?: boolean;
  isApplied?: boolean;
}) {
  const gradientId = `couponGradient-${item.id}-${item.code}-${expired ? "expired" : "unused"}`;
  const ctaText = expired ? "Expired" : isApplied ? "Added to checkout" : "Use Coupon";

  const statusLabel =
    item.statusTag === "used_expired"
      ? "Used & Expired"
      : item.statusTag === "used"
      ? "Used"
      : item.statusTag === "expired"
      ? "Expired"
      : null;

  return (
    <View className="mb-4 overflow-hidden rounded-[12px] px-3 py-3">
      <View className="absolute inset-0">
        <Svg width="100%" height="100%" viewBox="0 0 420 180" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="1" x2="1" y2="0">
              <Stop offset="0" stopColor="#F8A100" />
              <Stop offset="0.55" stopColor="#FF4B24" />
              <Stop offset="1" stopColor="#FF1642" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="420" height="180" fill={`url(#${gradientId})`} />
        </Svg>
      </View>
      <View className="relative">
        <View className="flex-row items-start justify-between">
          <View className="max-w-[72%]">
            <Text className="text-[16px] font-semibold text-white">{item.title}</Text>
            <Text className="mt-1 text-[14px] text-[#1C1C1C] underline">{item.subtitle}</Text>
          </View>
          <Pressable
            onPress={onUse}
            disabled={expired || disabled || isApplied}
            className="rounded-full bg-[#FFCF4A] px-4 py-2 disabled:opacity-70"
          >
            <Text className="text-[14px] text-white">{ctaText}</Text>
          </Pressable>
          {expired && statusLabel ? (
            <View className="mt-2 self-end rounded-full border border-[#F5D5A1] bg-[#FFF4DF] px-3 py-1">
              <Text className="text-[11px] font-medium text-[#A9751A]">{statusLabel}</Text>
            </View>
          ) : null}
        </View>

        {item.dateLine ? <Text className="mt-5 text-[14px] text-[#1C1C1C]">{item.dateLine}</Text> : null}
        {item.usageLine ? <Text className="mt-1 text-[13px] text-[#1C1C1C]">{item.usageLine}</Text> : null}
        {!expired ? <Text className="mt-2 text-[14px] text-[#1C1C1C]">Valid on all products</Text> : null}
        <Text className="mt-2 self-end text-[18px] font-medium text-[#1C1C1C]">Code: {item.code}</Text>
      </View>
    </View>
  );
}

export default function CouponsScreen() {
  const [tab, setTab] = useState<"unused" | "expired">("unused");
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [expiredCoupons, setExpiredCoupons] = useState<Coupon[]>([]);
  const [isApplying, setIsApplying] = useState(false);
  const [loadingCoupons, setLoadingCoupons] = useState(true);
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const appliedCoupon = useCheckoutStore((state) => state.appliedCoupon);
  const setAppliedCoupon = useCheckoutStore((state) => state.setAppliedCoupon);

  const data = tab === "unused" ? availableCoupons : expiredCoupons;
  const hasApplied = Boolean(appliedCoupon?.code);

  function mapCouponToCard(item: ApiCoupon): Coupon {
    const discountValue = Number(item.discount ?? 0);
    const display = item.discount_type === "percentage" ? `${discountValue}%` : `₦${discountValue}`;
    const minimumOrder = Number(item.minimum_order ?? 0);
    const subtitle = minimumOrder > 0 ? `For purchases above ₦${minimumOrder.toLocaleString()}` : "No minimum order";
    const remainingUses =
      typeof item.usage_limit === "number" ? Math.max(0, item.usage_limit - Number(item.usage_count ?? 0)) : null;
    return {
      id: item.id,
      title: `Enjoy ${display} off`,
      subtitle,
      dateLine: item.expiry_date ? `Offer valid until ${new Date(item.expiry_date).toLocaleDateString()}` : undefined,
      usageLine: remainingUses !== null ? `${remainingUses} use${remainingUses === 1 ? "" : "s"} left` : "Unlimited uses",
      code: item.coupon_code,
    };
  }

  useEffect(() => {
    void (async () => {
      setLoadingCoupons(true);
      try {
        const profile = await fetchProfile();
        const email = typeof profile?.email === "string" ? profile.email : undefined;
        setUserEmail(email);

        const allCoupons = await getCoupons();
        const now = Date.now();
        const available: Coupon[] = [];
        const expired: Coupon[] = [];

        const validations = await Promise.all(
          allCoupons.map(async (coupon) => {
            try {
              const result = await validateCouponCode({
                couponCode: coupon.coupon_code,
                email,
              });
              return { coupon, result };
            } catch (error: any) {
              const message =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                "validation_error";
              return { coupon, result: { valid: false, message: String(message) } };
            }
          }),
        );

        validations.forEach(({ coupon, result }) => {
          const msg = (result.message ?? "").toLowerCase();
          const expiryMs = coupon.expiry_date ? new Date(coupon.expiry_date).getTime() : null;
          const isExpiredByDate = typeof expiryMs === "number" && Number.isFinite(expiryMs) ? expiryMs < now : false;
          const isExpiredByValidation = msg.includes("expired");
          const isUsedByValidation = msg.includes("already been used");
          const isUsageLimitReached = msg.includes("usage limit");
          const isNotForUser = msg.includes("not valid for your account");

          // Show only coupons assigned/valid for current user.
          if (isNotForUser) return;

          if (result.valid) {
            available.push(mapCouponToCard(coupon));
            return;
          }

          // Expired tab should show both expired and used coupons.
          if (isExpiredByDate || isExpiredByValidation || isUsedByValidation || isUsageLimitReached) {
            const card = mapCouponToCard(coupon);
            const expiredFlag = isExpiredByDate || isExpiredByValidation;
            const usedFlag = isUsedByValidation || isUsageLimitReached;
            card.statusTag = expiredFlag && usedFlag ? "used_expired" : usedFlag ? "used" : "expired";
            expired.push(card);
          }
        });

        setAvailableCoupons(available);
        setExpiredCoupons(expired);
      } catch {
        notifyError("Coupons unavailable", "You may not have permission yet. Ask backend to allow coupon list for users.");
      } finally {
        setLoadingCoupons(false);
      }
    })();
  }, []);

  async function applyCouponByCode(code: string) {
    if (!code.trim()) return;
    const normalized = code.trim().toUpperCase();

    setIsApplying(true);
    try {
      const validation = await validateCouponCode({
        couponCode: normalized,
        email: userEmail,
      });
      if (!validation.valid || !validation.coupon) {
        notifyError("Coupon unavailable", validation.message ?? "Coupon is not available.");
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
      notifySuccess("Coupon selected", `${selected.coupon_code} is added to checkout.`);
      router.push("/checkout");
    } catch {
      notifyError("Selection failed", "Could not select coupon right now.");
    } finally {
      setIsApplying(false);
    }
  }

  return (
    <View className="flex-1 bg-[#F7F7F7]">
      <View className="flex-row items-center justify-between px-4 pt-3">
        <Pressable onPress={() => router.back()} className="h-8 w-8 items-center justify-center">
          <BackIcon />
        </Pressable>
        <Text className="text-center text-[24px] font-medium leading-8 text-[#2F2F2F]">
          Trenva{"\n"}Coupons & Deals
        </Text>
        <Pressable className="h-8 w-8 items-center justify-center">
          <HelpIcon />
        </Pressable>
      </View>

      <View className="mt-5 px-4">
        <View className="flex-row">
          {[
            { key: "unused", label: "Unused" },
            { key: "expired", label: "Expired" },
          ].map((t) => {
            const active = tab === (t.key as typeof tab);
            return (
              <Pressable key={t.key} onPress={() => setTab(t.key as typeof tab)} className="flex-1 items-center pb-3">
                <Text className="text-[17px] text-[#1F1F1F]">{t.label}</Text>
                {active ? <View className="mt-3 h-[3px] w-full bg-primary" /> : <View className="mt-3 h-[1px] w-full bg-[#D9D9D9]" />}
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-4">
        {tab === "unused" ? (
          <View className="mt-4">
            <Text className="text-[17px] font-medium text-[#2F2F2F]">Available coupons</Text>
            <Text className="mt-1 text-[14px] leading-6 text-[#2F2F2F]">Tap any available coupon to add it to checkout.</Text>
            {hasApplied ? <Text className="mt-2 text-[13px] text-[#0A7A28]">Added to checkout: {appliedCoupon?.code}</Text> : null}
          </View>
        ) : null}

        <View className="mt-3">
          {tab === "expired" && !loadingCoupons && expiredCoupons.length === 0 ? (
            <View className="items-center py-12">
              <Text className="text-[14px] text-[#777]">No expired coupons to show.</Text>
            </View>
          ) : null}

          {tab === "unused" && loadingCoupons ? (
            <View className="items-center py-10">
              <ActivityIndicator color="#FF9B00" />
            </View>
          ) : null}

          {data.map((coupon) => (
            <View key={coupon.id} className="border-t border-[#D7D7D7] pt-4">
              <CouponCard
                item={coupon}
                expired={tab === "expired"}
                disabled={isApplying}
                isApplied={Boolean(appliedCoupon && coupon.code.toUpperCase() === appliedCoupon.code.toUpperCase())}
                onUse={() => {
                  void applyCouponByCode(coupon.code);
                }}
              />
            </View>
          ))}
        </View>
      </ScrollView>

      <BottomQuickNav />
    </View>
  );
}
