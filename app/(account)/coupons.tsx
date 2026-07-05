import { useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import { goBackOr } from "../../lib/navigation/go-back-or";
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { BackIcon } from "../../components/ui/general-ui";
import { TabIcon } from "../../components/ui/home-ui";
import { fetchProfile } from "../../lib/api/auth";
import { ApiCoupon, getCoupons, validateCouponCode } from "../../lib/api/shop";
import { notifyError, notifySuccess } from "../../lib/ui/notify";
import { useCheckoutStore } from "../../store/checkout-store";
import { useAppTheme } from "../../lib/theme/theme-provider";

type Coupon = {
  id: number;
  title: string;
  subtitle: string;
  dateLine?: string;
  code: string;
  statusTag?: "used" | "expired" | "used_expired";
};

function HelpIcon({ color }: { color: string }) {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9.2} stroke={color} strokeWidth={1.9} />
      <Path d="M12 17H12.01" stroke={color} strokeWidth={1.9} strokeLinecap="round" />
      <Path
        d="M9.5 9.8C9.9 8.6 10.9 8 12.1 8C13.5 8 14.4 8.8 14.4 10C14.4 10.9 13.9 11.4 13.1 11.9C12.4 12.4 12.1 12.9 12.1 13.8"
        stroke={color}
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

function TicketIcon({ color, size = 34 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 8a2 2 0 012-2h14a2 2 0 012 2v2a1.5 1.5 0 000 3v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a1.5 1.5 0 000-3V8z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path d="M14 6v12" stroke={color} strokeWidth={1.6} strokeDasharray="2.5 2.5" />
    </Svg>
  );
}

function CopyIcon({ color, size = 13 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M8 8h10v10H8z" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
      <Path d="M5 15V5h10" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
    </Svg>
  );
}

function CouponSkeletonCard() {
  const { colors } = useAppTheme();
  return (
    <View
      className="mb-4 overflow-hidden rounded-[16px]"
      style={{ backgroundColor: colors.elevated, height: 150, opacity: 0.6 }}
    />
  );
}

function EmptyState({ label, colors }: { label: string; colors: ReturnType<typeof useAppTheme>["colors"] }) {
  return (
    <View className="items-center py-16">
      <View
        className="h-16 w-16 items-center justify-center rounded-full"
        style={{ backgroundColor: colors.elevated }}
      >
        <TicketIcon color={colors.textMuted} size={28} />
      </View>
      <Text className="mt-4 text-[14px]" style={{ color: colors.textMuted }}>{label}</Text>
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
  const { colors } = useAppTheme();
  const gradientId = `couponGradient-${item.id}-${item.code}-${expired ? "expired" : "unused"}`;
  const ctaText = expired ? "Expired" : isApplied ? "Added ✓" : "Use Coupon";

  const statusLabel =
    item.statusTag === "used_expired"
      ? "Used & Expired"
      : item.statusTag === "used"
      ? "Used"
      : item.statusTag === "expired"
      ? "Expired"
      : null;

  async function handleCopyCode() {
    await Clipboard.setStringAsync(item.code);
    notifySuccess("Copied", `Code ${item.code} copied.`);
  }

  return (
    <View
      className="mb-4 overflow-hidden rounded-[16px]"
      style={{
        backgroundColor: colors.card,
        shadowColor: "#000",
        shadowOpacity: expired ? 0.09 : 0.09,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
        elevation: expired ? 0 : 2,
        opacity: expired ? 0.85 : 1,
      }}
    >
      {/* Top gradient banner with discount + status */}
      <View className="relative overflow-hidden px-4 pb-5 pt-4">
        {!expired ? (
          <View className="absolute inset-0">
            <Svg width="100%" height="100%" viewBox="0 0 420 140" preserveAspectRatio="none">
              <Defs>
                <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#FF7A18" />
                  <Stop offset="1" stopColor="#FF3E6C" />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width="420" height="140" fill={`url(#${gradientId})`} />
            </Svg>
          </View>
        ) : null}

        <View className="flex-row items-start justify-between">
          <View className="flex-row items-center gap-2.5">
            <View
              className="h-9 w-9 items-center justify-center rounded-full"
              style={{ backgroundColor: expired ? colors.elevated : "rgba(255,255,255,0.25)" }}
            >
              <TicketIcon color={expired ? colors.textMuted : "#fff"} size={18} />
            </View>
            <View className="max-w-[190px]">
              <Text
                className="text-[16px] font-semibold"
                style={{ color: expired ? colors.text : "#fff" }}
              >
                {item.title}
              </Text>
              <Text
                className="mt-0.5 text-[12.5px]"
                style={{ color: expired ? colors.textMuted : "rgba(255,255,255,0.9)" }}
              >
                {item.subtitle}
              </Text>
            </View>
          </View>

          {statusLabel ? (
            <View className="rounded-full bg-white/90 px-2.5 py-1">
              <Text className="text-[10.5px] font-semibold" style={{ color: "#A9751A" }}>{statusLabel}</Text>
            </View>
          ) : null}
        </View>

        {!expired ? (
          <Text className="mt-3 text-[12.5px]" style={{ color: "rgba(255,255,255,0.9)" }}>
            Valid on all products{item.dateLine ? ` • ${item.dateLine}` : ""}
          </Text>
        ) : null}
      </View>

      {/* Dashed divider with coupon "notches" */}
      <View className="relative flex-row items-center">
        <View
          className="absolute -left-2.5 h-5 w-5 rounded-full"
          style={{ backgroundColor: colors.background }}
        />
        <View className="mx-3 h-0 flex-1 border-t border-dashed" style={{ borderColor: colors.border }} />
        <View
          className="absolute -right-2.5 h-5 w-5 rounded-full"
          style={{ backgroundColor: colors.background }}
        />
      </View>

      {/* Code + CTA row */}
      <View className="flex-row items-center justify-between px-4 py-3.5">
        <Pressable onPress={handleCopyCode} className="flex-row items-center gap-2 rounded-[8px] px-2.5 py-1.5" style={{ backgroundColor: colors.elevated }}>
          <Text className="text-[15px] font-semibold tracking-wider" style={{ color: colors.text }}>
            {item.code}
          </Text>
          <CopyIcon color={colors.textMuted} />
        </Pressable>

        <Pressable
          onPress={onUse}
          disabled={expired || disabled || isApplied}
          className="rounded-full px-5 py-2.5"
          style={{
            backgroundColor: expired || isApplied ? colors.elevated : colors.primary,
            opacity: disabled ? 0.6 : 1,
          }}
        >
          <Text
            className="text-[13px] font-semibold"
            style={{ color: expired || isApplied ? colors.textMuted : colors.background }}
          >
            {ctaText}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function BottomQuickNav({
  colors,
  onNavigate,
}: {
  colors: ReturnType<typeof useAppTheme>["colors"];
  onNavigate: (path: "/(tabs)" | "/(tabs)/cart" | "/(tabs)/wishlist" | "/orders" | "/(tabs)/profile") => void;
}) {
  return (
    <View className="px-4 pb-3 pt-2">
      <View
        className="flex-row items-center justify-between rounded-[18px] px-7 py-4"
        style={{
          backgroundColor: colors.card,
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -2 },
          elevation: 4,
        }}
      >
        <Pressable onPress={() => onNavigate("/(tabs)")}>
          <TabIcon routeName="index" color="#D4A04A" />
        </Pressable>
        <Pressable onPress={() => onNavigate("/(tabs)/cart")}>
          <TabIcon routeName="cart" color="#D4A04A" />
        </Pressable>
        <Pressable onPress={() => onNavigate("/(tabs)/wishlist")}>
          <TabIcon routeName="wishlist" color="#D4A04A" />
        </Pressable>
        <Pressable onPress={() => onNavigate("/orders")}>
          <OrdersTabIcon active />
        </Pressable>
        <Pressable onPress={() => onNavigate("/(tabs)/profile")}>
          <TabIcon routeName="profile" color="#D4A04A" />
        </Pressable>
      </View>
    </View>
  );
}

export default function CouponsScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<"unused" | "expired">("unused");
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [expiredCoupons, setExpiredCoupons] = useState<Coupon[]>([]);
  const [isApplying, setIsApplying] = useState(false);
  const [loadingCoupons, setLoadingCoupons] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
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
    return {
      id: item.id,
      title: `Enjoy ${display} off`,
      subtitle,
      dateLine: item.expiry_date ? `Valid until ${new Date(item.expiry_date).toLocaleDateString()}` : undefined,
      code: item.coupon_code,
    };
  }

  async function loadCoupons(showLoader = true) {
    if (showLoader) setLoadingCoupons(true);
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

        if (isNotForUser) return;

        if (result.valid) {
          available.push(mapCouponToCard(coupon));
          return;
        }

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
      if (showLoader) setLoadingCoupons(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    void loadCoupons(true);
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
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <View
        className="flex-row items-center justify-between px-4"
        style={{ paddingTop: Math.max(insets.top + 4, 12) }}
      >
        <Pressable onPress={() => goBackOr(router)} className="h-8 w-8 items-center justify-center" hitSlop={12}>
          <BackIcon />
        </Pressable>
        <Text className="text-center text-[20px] font-semibold" style={{ color: colors.text }}>Coupons</Text>
        <Pressable onPress={() => router.push("/help-center")} className="h-8 w-8 items-center justify-center" hitSlop={12}>
          <HelpIcon color={colors.textMuted} />
        </Pressable>
      </View>

      {/* Segmented pill tabs */}
      <View className="mt-5 px-4">
        <View className="flex-row rounded-full p-1" style={{ backgroundColor: colors.elevated }}>
          {[
            { key: "unused", label: "Unused" },
            { key: "expired", label: "Expired" },
          ].map((t) => {
            const active = tab === (t.key as typeof tab);
            return (
              <Pressable
                key={t.key}
                onPress={() => setTab(t.key as typeof tab)}
                className="flex-1 items-center rounded-full py-2.5"
                style={{ backgroundColor: active ? colors.card : "transparent" }}
              >
                <Text
                  className="text-[14px] font-medium"
                  style={{ color: active ? colors.text : colors.textMuted }}
                >
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1 px-4"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              void loadCoupons(false);
            }}
          />
        }
      >
        {tab === "unused" ? (
          <View className="mt-5">
            <Text className="text-[13px]" style={{ color: colors.textMuted }}>
              Tap any available coupon to add it to checkout.
            </Text>
            {hasApplied ? (
              <View className="mt-2.5 flex-row items-center gap-1.5 self-start rounded-full px-3 py-1.5" style={{ backgroundColor: "#E8F5E9" }}>
                <Text className="text-[12.5px] font-medium" style={{ color: "#0A7A28" }}>
                  ✓ Added to checkout: {appliedCoupon?.code}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <View className="mt-4 pb-6">
          {tab === "unused" && loadingCoupons ? (
            <>
              <CouponSkeletonCard />
              <CouponSkeletonCard />
            </>
          ) : null}

          {tab === "expired" && !loadingCoupons && expiredCoupons.length === 0 ? (
            <EmptyState label="No expired coupons to show." colors={colors} />
          ) : null}

          {tab === "unused" && !loadingCoupons && availableCoupons.length === 0 ? (
            <EmptyState label="No coupons available right now." colors={colors} />
          ) : null}

          {data.map((coupon) => (
            <CouponCard
              key={coupon.id}
              item={coupon}
              expired={tab === "expired"}
              disabled={isApplying}
              isApplied={Boolean(appliedCoupon && coupon.code.toUpperCase() === appliedCoupon.code.toUpperCase())}
              onUse={() => {
                void applyCouponByCode(coupon.code);
              }}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}