import { useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { WebView, type WebViewNavigation } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackIcon } from "../../components/ui/general-ui";
import { goBackOr } from "../../lib/navigation/go-back-or";
import { API_BASE_URL } from "../../lib/api/config";
import { mobileWalletTopupInit, mobileWalletTopupVerify } from "../../lib/api/shop";
import { notifyError, notifySuccess } from "../../lib/ui/notify";
import { useAppTheme } from "../../lib/theme/theme-provider";

// Matches the path Django resolves for reverse('verify_topup') — adjust if your API_BASE_URL
// doesn't already include the scheme+host your backend uses for build_absolute_uri.
const WALLET_VERIFY_PATH = "/wallet/verify-topup/";

const QUICK_AMOUNTS = [1000, 5000, 10000, 25000, 50000];

type Stage = "form" | "checkout" | "verifying" | "success" | "error";

export default function WalletTopupScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState("");
  const [stage, setStage] = useState<Stage>("form");
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [creditedAmount, setCreditedAmount] = useState<string | null>(null);
  const referenceRef = useRef<string | null>(null);
  const verifyingRef = useRef(false);

  const numericAmount = Number(amount);
  const isValidAmount = Number.isFinite(numericAmount) && numericAmount >= 100 && numericAmount % 100 === 0;

  async function handleStartTopup() {
    if (!isValidAmount) {
      notifyError("Invalid amount", "Enter an amount of at least ₦100, in multiples of 100.");
      return;
    }

    try {
      const result = await mobileWalletTopupInit({ amount: numericAmount });
      if (!result.success || !result.authorization_url || !result.reference) {
        notifyError("Could not start top-up", result.error || "Please try again.");
        return;
      }
      referenceRef.current = result.reference;
      setCheckoutUrl(result.authorization_url);
      setStage("checkout");
    } catch {
      notifyError("Network error", "Could not reach the server. Please try again.");
    }
  }

  async function handleVerify(reference: string) {
    if (verifyingRef.current) return;
    verifyingRef.current = true;
    setStage("verifying");

    try {
      const result = await mobileWalletTopupVerify(reference);
      if (result.success) {
        setCreditedAmount(result.amount ?? amount);
        setStage("success");
        notifySuccess("Wallet funded", "Your wallet has been credited successfully.");
      } else {
        setErrorMessage(result.error || "We couldn't verify this payment.");
        setStage("error");
      }
    } catch {
      setErrorMessage("Network error while verifying payment.");
      setStage("error");
    } finally {
      verifyingRef.current = false;
    }
  }

  function handleNavigationChange(navState: WebViewNavigation) {
    if (navState.url.includes(WALLET_VERIFY_PATH) && referenceRef.current) {
      void handleVerify(referenceRef.current);
    }
  }

  function handleDone() {
    router.replace("/wallet");
  }

  function handleRetry() {
    setStage("form");
    setErrorMessage(null);
    setCheckoutUrl(null);
    referenceRef.current = null;
  }

  const header = useMemo(
    () => (
      <View
        className="flex-row items-center px-3 pb-3"
        style={{ paddingTop: Math.max(insets.top + 4, 12), backgroundColor: colors.background }}
      >
        <Pressable
          className="h-8 w-8 items-center justify-center"
          onPress={() => (stage === "checkout" ? handleRetry() : goBackOr(router))}
          hitSlop={12}
        >
          <BackIcon />
        </Pressable>
        <Text className="flex-1 text-center text-[20px] font-semibold" style={{ color: colors.text }}>
          Fund Wallet
        </Text>
        <View className="w-8" />
      </View>
    ),
    [stage, colors, insets],
  );

  if (stage === "checkout" && checkoutUrl) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        {header}
        <WebView
          source={{ uri: checkoutUrl }}
          onNavigationStateChange={handleNavigationChange}
          startInLoadingState
          renderLoading={() => (
            <View className="absolute inset-0 items-center justify-center" style={{ backgroundColor: colors.background }}>
              <ActivityIndicator color={colors.primary} size="large" />
            </View>
          )}
        />
      </View>
    );
  }

  if (stage === "verifying") {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text className="mt-4 text-[15px]" style={{ color: colors.textMuted }}>Confirming your payment...</Text>
      </View>
    );
  }

  if (stage === "success") {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        {header}
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-[20px] font-semibold" style={{ color: colors.text }}>Payment Successful</Text>
          <Text className="mt-2 text-center text-[14px]" style={{ color: colors.textMuted }}>
            ₦{Number(creditedAmount ?? 0).toLocaleString()} has been added to your wallet.
          </Text>
          <Pressable onPress={handleDone} className="mt-8 w-full rounded-full bg-primary py-3.5">
            <Text className="text-center text-[16px] font-medium text-white">Back to Wallet</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (stage === "error") {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        {header}
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-[20px] font-semibold" style={{ color: colors.text }}>Payment Not Confirmed</Text>
          <Text className="mt-2 text-center text-[14px]" style={{ color: colors.textMuted }}>
            {errorMessage}
          </Text>
          <Pressable onPress={handleRetry} className="mt-8 w-full rounded-full bg-primary py-3.5">
            <Text className="text-center text-[16px] font-medium text-white">Try Again</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {header}
      <View className="px-5 pt-4">
        <Text className="text-[15px] font-medium" style={{ color: colors.text }}>Amount (NGN)</Text>
        <TextInput
          value={amount}
          onChangeText={(text) => setAmount(text.replace(/[^0-9]/g, ""))}
          keyboardType="number-pad"
          placeholder="Enter amount"
          placeholderTextColor={colors.textMuted}
          className="mt-2 rounded-[12px] border px-4 py-3.5 text-[18px]"
          style={{ borderColor: colors.border, color: colors.text }}
        />
        <Text className="mt-1.5 text-[12px]" style={{ color: colors.textMuted }}>
          Minimum amount is ₦100, in multiples of 100
        </Text>

        <View className="mt-4 flex-row flex-wrap gap-2">
          {QUICK_AMOUNTS.map((value) => (
            <Pressable
              key={value}
              onPress={() => setAmount(String(value))}
              className="rounded-full border px-4 py-2"
              style={{ borderColor: colors.border, backgroundColor: colors.elevated }}
            >
              <Text className="text-[13px] font-medium" style={{ color: colors.text }}>
                ₦{value.toLocaleString()}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={handleStartTopup}
          disabled={!isValidAmount}
          className="mt-8 rounded-full bg-primary py-3.5"
          style={{ opacity: isValidAmount ? 1 : 0.5 }}
        >
          <Text className="text-center text-[16px] font-medium text-white">Proceed to Payment</Text>
        </Pressable>
      </View>
    </View>
  );
}