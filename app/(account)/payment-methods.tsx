import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { goBackOr } from "../../lib/navigation/go-back-or";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackIcon } from "../../components/ui/general-ui";
import { formatMoney, getWallets } from "../../lib/api/shop";
import { notifyError } from "../../lib/ui/notify";
import { useCheckoutStore } from "../../store/checkout-store";
import { useAppTheme } from "../../lib/theme/theme-provider";

type MethodId = "wallet" | "card";

function MethodCard({
  id,
  title,
  subtitle,
  active,
  onSelect,
  colors,
}: {
  id: MethodId;
  title: string;
  subtitle: string;
  active: boolean;
  onSelect: (id: MethodId) => void;
  colors: { card: string; border: string; elevated: string; text: string; textMuted: string; primary: string };
}) {
  return (
    <Pressable
      onPress={() => onSelect(id)}
      className="mb-3 rounded-2xl border px-4 py-4"
      style={{ borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.elevated : colors.card }}
    >
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-[15px] font-semibold" style={{ color: colors.text }}>{title}</Text>
          <Text className="mt-1 text-[13px]" style={{ color: colors.textMuted }}>{subtitle}</Text>
        </View>
        <View className="h-5 w-5 rounded-full border-2 items-center justify-center" style={{ borderColor: active ? colors.primary : colors.border }}>
          {active ? <View className="h-2.5 w-2.5 rounded-full bg-primary" /> : null}
        </View>
      </View>
    </Pressable>
  );
}

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const selectedPaymentMethod = useCheckoutStore((state) => state.selectedPaymentMethod);
  const setSelectedPaymentMethod = useCheckoutStore((state) => state.setSelectedPaymentMethod);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState<MethodId>(selectedPaymentMethod === "wallet" ? "wallet" : "card");

  useEffect(() => {
    setSelectedMethod(selectedPaymentMethod === "wallet" ? "wallet" : "card");
  }, [selectedPaymentMethod]);

  function handleSelectMethod(method: MethodId) {
    setSelectedMethod(method);
    setSelectedPaymentMethod(method === "wallet" ? "wallet" : "paystack");
  }

  const loadWallet = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setIsLoading(true);
      const wallets = await getWallets();
      const balance = Number(wallets?.[0]?.balance ?? 0);
      setWalletBalance(Number.isFinite(balance) ? balance : 0);
    } catch {
      setWalletBalance(0);
      notifyError("Payment methods failed", "Unable to load payment methods right now.");
    } finally {
      if (showLoader) setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadWallet(true);
  }, [loadWallet]);

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
              void loadWallet(false);
            }}
          />
        }
      >
        <View className="flex-row items-center justify-between px-5 pb-3" style={{ paddingTop: Math.max(insets.top + 4, 12), backgroundColor: colors.background }}>
          <Pressable onPress={() => goBackOr(router)} className="h-8 w-8 items-center justify-center" hitSlop={12}>
            <BackIcon />
          </Pressable>
          <Text className="text-[22px] font-semibold" style={{ color: colors.text }}>Payment Methods</Text>
          <View className="w-8" />
        </View>

        <View className="px-5">
          <View className="mb-4 rounded-2xl border px-4 py-4" style={{ borderColor: colors.border, backgroundColor: colors.card }}>
            <Text className="text-[13px]" style={{ color: colors.textMuted }}>Wallet Balance</Text>
            <Text className="mt-1 text-[24px] font-semibold" style={{ color: colors.text }}>
              {isLoading ? "Loading..." : formatMoney(walletBalance)}
            </Text>
          </View>

          <MethodCard
            id="wallet"
            title="Trenva Wallet"
            subtitle="Use wallet balance during checkout"
            active={selectedMethod === "wallet"}
            onSelect={handleSelectMethod}
            colors={colors}
          />
          <MethodCard
            id="card"
            title="Card / Paystack"
            subtitle="Pay with your debit or credit card"
            active={selectedMethod === "card"}
            onSelect={handleSelectMethod}
            colors={colors}
          />

          <View className="mt-2 rounded-2xl border px-4 py-4" style={{ borderColor: colors.border, backgroundColor: colors.card }}>
            <Text className="text-[13px] leading-5" style={{ color: colors.textMuted }}>
              Payment method selection is applied during checkout. Tap
              <Text className="font-semibold text-primary"> Continue to Checkout </Text>
              to complete your order.
            </Text>
          </View>

          <Pressable onPress={() => router.push("/checkout")} className="mt-5 rounded-xl bg-primary px-4 py-3">
            <Text className="text-center text-[14px] font-semibold text-white">Continue to Checkout</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}




