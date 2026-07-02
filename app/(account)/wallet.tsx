import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { goBackOr } from "../../lib/navigation/go-back-or";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { BackIcon } from "../../components/ui/general-ui";
import { clearAuthTokens } from "../../lib/auth/tokens";
import { getApiErrorMessage, isUnauthorizedError } from "../../lib/api/errors";
import { formatMoney, getTransactions, getWallets, type ApiTransaction } from "../../lib/api/shop";
import { notifyError, notifyInfo, notifySuccess } from "../../lib/ui/notify";
import { useAppTheme } from "../../lib/theme/theme-provider";
import { promptLoginRequired } from "../../lib/ui/login-required";
const ICON_HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 } as const;

function DownIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9L12 15L18 9" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DownDarkIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9L12 15L18 9" stroke="#606060" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function toTransactionAmount(transaction: ApiTransaction) {
  const amount = Number(transaction.amount ?? 0);
  const positive = String(transaction.transaction_type ?? "").toLowerCase() === "credit";
  const signed = positive ? amount : -Math.abs(amount);
  const pretty = `${positive ? "+" : "-"} ${formatMoney(Math.abs(signed))}`;
  return { text: pretty, positive };
}

export default function WalletScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [errorText, setErrorText] = useState<string | null>(null);

  const displayAccountName = useMemo(() => {
    const raw = (accountName || "").trim();
    if (!raw) return "TRENVA/USER";
    const normalized = raw.toUpperCase();
    const withoutPrefix = normalized.startsWith("TRENVA/") ? normalized.slice("TRENVA/".length) : normalized;
    const firstToken = withoutPrefix.trim().split(/\s+/)[0] || "USER";
    return `TRENVA/${firstToken}`;
  }, [accountName]);

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const aTime = new Date(a.created_at ?? a.formatted_date ?? 0).getTime();
      const bTime = new Date(b.created_at ?? b.formatted_date ?? 0).getTime();
      return bTime - aTime;
    });
  }, [transactions]);

  const previewTransactions = useMemo(() => sortedTransactions.slice(0, 5), [sortedTransactions]);

  const loadWallet = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setIsLoading(true);
      setErrorText(null);

      const [wallets, txns] = await Promise.all([getWallets(), getTransactions({ status: "success" })]);
      const firstWallet = wallets[0];
      setWalletBalance(Number(firstWallet?.balance ?? 0) || 0);
      setAccountNumber(String(firstWallet?.account_number ?? "").trim());
      setBankName(String(firstWallet?.bank_name ?? "").trim());
      setAccountName(String(firstWallet?.account_name ?? firstWallet?.user_name ?? "").trim());
      setTransactions(txns);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        await clearAuthTokens();
        promptLoginRequired(router, "Please sign in to view your wallet.");
        return;
      }

      const message = getApiErrorMessage(error, "Could not load wallet right now.");
      setErrorText(message);
      notifyError("Wallet error", message);
    } finally {
      if (showLoader) setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadWallet(true);
  }, [loadWallet]);

  const today = useMemo(
    () => new Date().toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" }),
    [],
  );

  const activityData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const totals: Record<string, number> = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0 };

    transactions.forEach((txn) => {
      const source = txn.created_at ?? txn.formatted_date;
      if (!source) return;
      const date = new Date(source);
      if (Number.isNaN(date.getTime())) return;
      const day = date.toLocaleDateString("en-US", { weekday: "short" });
      if (!Object.prototype.hasOwnProperty.call(totals, day)) return;
      totals[day] += Math.abs(Number(txn.amount ?? 0));
    });

    const values = days.map((day) => totals[day] || 0);
    const max = Math.max(...values, 0);
    return days.map((day) => {
      const raw = totals[day] || 0;
      const height = max > 0 ? Math.max(16, Math.round((raw / max) * 68)) : 16;
      return { day, height };
    });
  }, [transactions]);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
        contentContainerStyle={{ paddingBottom: 26 }}
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
        <View className="flex-row items-center px-3 pb-3" style={{ paddingTop: Math.max(insets.top + 4, 12), backgroundColor: colors.background }}>
          <Pressable className="h-8 w-8 items-center justify-center" onPress={() => goBackOr(router)} hitSlop={ICON_HIT_SLOP}>
            <BackIcon />
          </Pressable>
          <Text className="flex-1 text-center text-[24px] font-medium" style={{ color: colors.text }}>Trenva Wallet</Text>
          <View className="w-8" />
        </View>

        <View className="px-5 pt-8">
          <Text className="text-[28px] font-semibold text-primary">Your Balance</Text>

          <View className="mt-5 overflow-hidden rounded-[18px] px-4 py-4">
            <View className="absolute inset-0">
              <Svg width="100%" height="100%" viewBox="0 0 420 220" preserveAspectRatio="none">
                <Defs>
                  <LinearGradient id="walletCardGradient" x1="0" y1="1" x2="1" y2="0">
                    <Stop offset="0" stopColor="#F8A100" />
                    <Stop offset="0.6" stopColor="#F99B66" />
                    <Stop offset="1" stopColor="#EC7FA1" />
                  </LinearGradient>
                </Defs>
                <Rect x="0" y="0" width="420" height="220" fill="url(#walletCardGradient)" />
              </Svg>
            </View>
            <View className="relative">
              <Text className="text-[12px] text-white">{today}</Text>
              <View className="mt-3 flex-row items-center justify-between">
                <Text className="text-[32px] font-semibold text-white">
                  {isLoading ? "Loading..." : formatMoney(walletBalance)}
                </Text>
                <View className="flex-row items-center gap-1">
                  <Text className="text-[20px] font-semibold text-white">NGN</Text>
                  <DownIcon />
                </View>
              </View>
              <Text className="mt-4 text-[13px] text-white">For refunds, rewards and shopping credits.</Text>
            </View>
          </View>

          <Pressable disabled className="mt-8 rounded-[12px] py-3.5" style={{ backgroundColor: colors.border }}>
            <Text className="text-center text-[16px] text-white">Withdraw (Unavailable)</Text>
          </Pressable>

          <View className="mt-5 rounded-[14px] border p-4" style={{ borderColor: colors.border, backgroundColor: colors.card }}>
            <Text className="text-[16px] font-semibold text-primary">Virtual Account</Text>
            {accountNumber ? (
              <>
                <Text className="mt-3 text-[12px]" style={{ color: colors.textMuted }}>Account Name</Text>
                <Text className="text-[15px] font-medium" style={{ color: colors.text }}>
                  {displayAccountName}
                </Text>
                <Text className="mt-2 text-[12px]" style={{ color: colors.textMuted }}>Bank</Text>
                <Text className="text-[15px] font-medium" style={{ color: colors.text }}>
                  {bankName || "Paystack Partner Bank"}
                </Text>
                <Text className="mt-2 text-[12px]" style={{ color: colors.textMuted }}>Account Number</Text>
                <View className="mt-1 flex-row items-center justify-between">
                  <Text selectable className="text-[19px] font-semibold tracking-[1px]" style={{ color: colors.text }}>
                    {accountNumber}
                  </Text>
                  <Pressable
                    onPress={async () => {
                      try {
                        await Clipboard.setStringAsync(accountNumber);
                        notifySuccess("Copied", "Account number copied.");
                      } catch {
                        notifyError("Copy failed", "Unable to copy account number right now.");
                      }
                    }}
                    className="rounded-full px-3 py-1.5"
                    style={{ backgroundColor: colors.elevated }}
                  >
                    <Text className="text-[12px] font-medium" style={{ color: colors.text }}>Copy</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <Text className="mt-2 text-[14px]" style={{ color: colors.textMuted }}>
                Your virtual account is being prepared. Please check back shortly.
              </Text>
            )}
          </View>

          <View className="mt-8 border-b border-dashed" style={{ borderColor: colors.border }} />
          

          <View className="mt-8 flex-row items-center justify-between">
            <Text className="text-[18px] font-semibold text-primary">Activities</Text>
            <View className="flex-row items-center gap-1">
              <Text className="text-[12px]" style={{ color: colors.textMuted }}>Weekly</Text>
              <DownDarkIcon />
            </View>
          </View>

          <View className="mt-6 flex-row items-end justify-between px-4">
            {activityData.map((item) => (
              <View key={item.day} className="items-center">
                <View className="h-[20px] w-[20px] rounded-full border-[5px] border-primary" style={{ backgroundColor: colors.card }} />
                <View className="w-[12px] rounded-full bg-primary" style={{ height: item.height }} />
              </View>
            ))}
          </View>
          <View className="mt-3 flex-row justify-between px-4">
            {activityData.map((item) => (
              <Text key={item.day} className="w-[44px] text-center text-[14px]" style={{ color: colors.text }}>
                {item.day}
              </Text>
            ))}
          </View>

          <View className="mt-12 flex-row items-center justify-between">
            <Text className="text-[18px] font-semibold text-primary">Recent transactions</Text>
            <View className="flex-row items-center gap-3">
              <Pressable onPress={() => router.push("/transactions")} hitSlop={ICON_HIT_SLOP}>
                <Text className="text-[12px] underline" style={{ color: colors.text }}>View all</Text>
              </Pressable>
              <Pressable onPress={() => void loadWallet(true)} hitSlop={ICON_HIT_SLOP}>
                <Text className="text-[12px] underline" style={{ color: colors.textMuted }}>Refresh</Text>
              </Pressable>
            </View>
          </View>

          {errorText ? (
            <View className="mt-6 rounded-xl border p-3" style={{ borderColor: colors.error, backgroundColor: colors.errorSoft }}>
              <Text className="text-[14px]" style={{ color: colors.error }}>{errorText}</Text>
            </View>
          ) : null}

          {!isLoading && sortedTransactions.length === 0 ? (
            <Text className="mt-6 text-[14px]" style={{ color: colors.textMuted }}>No wallet transactions yet.</Text>
          ) : null}

          <View className="mt-6 gap-5">
            {previewTransactions.map((transaction) => {
              const amount = toTransactionAmount(transaction);
              return (
                <View key={String(transaction.id)} className="flex-row items-center justify-between">
                  <View className="h-10 w-10 rounded-full" style={{ backgroundColor: colors.elevated }} />
                  <View className="ml-4 flex-1 pr-3">
                    <Text className="text-[16px] font-semibold" style={{ color: colors.text }}>
                      {transaction.description || transaction.reference || "Wallet transaction"}
                    </Text>
                    <Text className="text-[13px]" style={{ color: colors.textMuted }}>{transaction.formatted_date || "Unknown time"}</Text>
                  </View>
                  <Text className="text-right text-[18px] font-medium" style={{ color: amount.positive ? colors.success : colors.error, minWidth: 96 }}>
                    {amount.text}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}





