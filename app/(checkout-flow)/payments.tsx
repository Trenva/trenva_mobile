import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Rect } from "react-native-svg";
import { BackIcon, BellDarkIcon } from "../../components/ui/general-ui";
import { notifySuccess } from "../../lib/ui/notify";
import { useCheckoutStore } from "../../store/checkout-store";
import { formatMoney, getWallets } from "../../lib/api/shop";
import { useAppTheme } from "../../lib/theme/theme-provider";

const methods = [
  { id: "paystack", label: "Paystack", type: "paystack" },
  { id: "flutterwave", label: "Flutterwave", type: "flutterwave" },
  { id: "wallet", label: "Trenva Wallet", type: "wallet" },
  { id: "cod", label: "Cash On Delivery", type: "cash" },
] as const;

function MethodIcon({ type }: { type: (typeof methods)[number]["type"] }) {
  if (type === "paystack") {
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Rect x={3} y={7} width={18} height={4} rx={1} fill="#00A6D6" />
        <Rect x={3} y={12} width={14} height={4} rx={1} fill="#00A6D6" opacity={0.75} />
      </Svg>
    );
  }

  if (type === "flutterwave") {
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Path d="M5 8L10 16" stroke="#F39C12" strokeWidth={1.8} strokeLinecap="round" />
        <Path d="M19 8L14 16" stroke="#1E8449" strokeWidth={1.8} strokeLinecap="round" />
        <Path d="M8 8H16" stroke="#E74C3C" strokeWidth={1.8} strokeLinecap="round" />
      </Svg>
    );
  }

  if (type === "wallet") {
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Rect x={3} y={6} width={18} height={12} rx={2.5} stroke="#2D2D2D" strokeWidth={1.6} />
        <Rect x={14} y={10} width={7} height={4} rx={1.5} stroke="#2D2D2D" strokeWidth={1.6} />
      </Svg>
    );
  }

  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x={4} y={7} width={16} height={10} rx={2.5} stroke="#2D2D2D" strokeWidth={1.6} />
      <Path d="M7 12H17" stroke="#2D2D2D" strokeWidth={1.6} />
    </Svg>
  );
}

function PaymentRow({
  label,
  type,
  active,
  disabled,
  colors,
  onPress,
}: {
  label: string;
  type: (typeof methods)[number]["type"];
  active: boolean;
  disabled?: boolean;
  colors: ReturnType<typeof useAppTheme>["colors"];
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="mb-3 flex-row items-center justify-between rounded-[12px] border px-3 py-3.5"
      style={{ borderColor: colors.border, backgroundColor: disabled ? colors.elevated : colors.card }}
    >
      <View className="flex-row items-center gap-3">
        <MethodIcon type={type} />
        <Text className="text-[15px]" style={{ color: disabled ? colors.textMuted : colors.text }}>{label}</Text>
      </View>
      <View className="h-6 w-6 rounded-full border-2" style={{ borderColor: active ? colors.primary : colors.border }}>
        {active ? <View className="m-[4px] h-3 w-3 rounded-full bg-primary" /> : null}
      </View>
    </Pressable>
  );
}

export default function PaymentsScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState("paystack");
  const [isLoadingWallet, setIsLoadingWallet] = useState(true);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const setSelectedPaymentMethod = useCheckoutStore((state) => state.setSelectedPaymentMethod);
  
  useEffect(() => {
    let mounted = true;
    async function loadWallet() {
      try {
        const wallets = await getWallets();
        if (!mounted) return;
        const firstWallet = wallets[0];
        setWalletBalance(Number(firstWallet?.balance ?? 0));
      } catch {
        if (!mounted) return;
        setWalletBalance(0);
      } finally {
        if (mounted) setIsLoadingWallet(false);
      }
    }
    void loadWallet();
    return () => {
      mounted = false;
    };
  }, []);

  const backendPaymentValue = useMemo(() => {
    if (selected === "paystack") return "paystack";
    if (selected === "flutterwave") return "flutterwave";
    if (selected === "wallet") return "wallet";
    return "cash_on_delivery";
  }, [selected]);
  
  function handleContinuePayment() {
    const activeMethod = methods.find((method) => method.id === selected)?.label ?? "Payment method";
    setSelectedPaymentMethod(backendPaymentValue);
    notifySuccess("Payment method selected", `${activeMethod} selected.`);
    router.push("/checkout");
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <View
        className="flex-row items-center justify-between px-4 pb-2"
        style={{ paddingTop: Math.max(insets.top + 4, 12) }}
      >
        <Pressable onPress={() => router.back()} className="h-8 w-8 items-center justify-center">
          <BackIcon />
        </Pressable>
        <Text className="text-[24px] font-medium" style={{ color: colors.text }}>Payments</Text>
        <BellDarkIcon />
      </View>

      <View className="px-5">
        <View className="mb-7 mt-1 flex-row gap-2">
          <View className="h-[4px] flex-1 rounded-full" style={{ backgroundColor: colors.border }} />
          <View className="h-[4px] flex-1 rounded-full bg-primary" />
          <View className="h-[4px] flex-1 rounded-full" style={{ backgroundColor: colors.border }} />
        </View>

        <Text className="mb-5 text-[16px] font-medium" style={{ color: colors.text }}>Payment Options</Text>
        {methods.slice(0, 3).map((method) => (
          <PaymentRow
            key={method.id}
            label={
              method.id === "wallet"
                ? `${method.label} (${isLoadingWallet ? "..." : formatMoney(walletBalance)})`
                : method.id === "flutterwave"
                  ? `${method.label} (Coming soon)`
                : method.label
            }
            type={method.type}
            active={selected === method.id}
            disabled={method.id === "flutterwave"}
            colors={colors}
            onPress={() => setSelected(method.id)}
          />
        ))}
        {isLoadingWallet ? (
          <View className="mb-2 mt-1 flex-row items-center">
            <ActivityIndicator color={colors.primary} size="small" />
            <Text className="ml-2 text-[12px]" style={{ color: colors.textMuted }}>Loading wallet...</Text>
          </View>
        ) : null}

        <Text className="mb-4 mt-5 text-[16px] font-medium" style={{ color: colors.text }}>Cash on Delivery</Text>
        <PaymentRow
          label={`${methods[3].label} (Coming soon)`}
          type={methods[3].type}
          active={selected === methods[3].id}
          disabled
          colors={colors}
          onPress={() => setSelected(methods[3].id)}
        />
      </View>

      <View className="mt-auto px-9 pb-8 pt-3">
        <Pressable onPress={handleContinuePayment} className="rounded-full bg-primary py-3.5">
          <Text className="text-center text-[16px] font-medium text-white">Continue Payment</Text>
        </Pressable>
      </View>
    </View>
  );
}
