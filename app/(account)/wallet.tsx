import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { goBackOr } from "../../lib/navigation/go-back-or";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { BackIcon } from "../../components/ui/general-ui";
import { clearAuthTokens } from "../../lib/auth/tokens";
import { getApiErrorMessage, isUnauthorizedError } from "../../lib/api/errors";
import { formatMoney, getTransactions, getWallets, type ApiTransaction } from "../../lib/api/shop";
import { notifyError, notifySuccess } from "../../lib/ui/notify";
import { useAppTheme } from "../../lib/theme/theme-provider";
import { promptLoginRequired } from "../../lib/ui/login-required";
import { TransactionDetailsSheet } from "../../components/ui/transaction-details-sheet";

const ICON_HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 } as const;

function EyeIcon({ visible }: { visible: boolean }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"
        stroke="#FFFFFF"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={12} r={3} stroke="#FFFFFF" strokeWidth={1.8} />
      {!visible ? <Path d="M4 4l16 16" stroke="#FFFFFF" strokeWidth={1.8} strokeLinecap="round" /> : null}
    </Svg>
  );
}

function KeyIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Circle cx={8} cy={15} r={3.2} stroke="#FFFFFF" strokeWidth={1.8} />
      <Path d="M10.3 12.7L19 4M15.5 8.2L18 10.5M17.7 6L20 8.3" stroke="#FFFFFF" strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function BellIcon() {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3a5 5 0 00-5 5v3.2c0 .6-.2 1.2-.6 1.7L5 15h14l-1.4-2.1c-.4-.5-.6-1.1-.6-1.7V8a5 5 0 00-5-5z"
        stroke="#FFFFFF"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path d="M10 18a2 2 0 004 0" stroke="#FFFFFF" strokeWidth={1.6} strokeLinecap="round" />
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
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<ApiTransaction | null>(null);


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

  const formattedBalance = balanceVisible ? formatMoney(walletBalance) : "₦••••••••";

  async function handleCopyAccountNumber() {
    try {
      await Clipboard.setStringAsync(accountNumber);
      setCopied(true);
      notifySuccess("Copied", "Account number copied.");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      notifyError("Copy failed", "Unable to copy account number right now.");
    }
  }

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
          <Text className="flex-1 text-center text-[22px] font-bold" style={{ color: colors.text }}>TRENVA Wallet</Text>
          <View className="w-8" />
        </View>

        <View className="px-4 pt-3">
          {/* Balance card */}
          <View className="overflow-hidden rounded-[20px] px-5 py-5">
            <View className="absolute inset-0">
              <Svg width="100%" height="100%" viewBox="0 0 420 220" preserveAspectRatio="none">
                <Defs>
                  <LinearGradient id="walletBalanceGradient" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor="#FFB020" />
                    <Stop offset="1" stopColor="#FF8A00" />
                  </LinearGradient>
                </Defs>
                <Rect x="0" y="0" width="420" height="220" fill="url(#walletBalanceGradient)" />
              </Svg>
            </View>
            <View className="relative">
              <Text className="text-[13px] font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>
                Your Balance
              </Text>
              <View className="mt-2 flex-row items-center gap-2.5">
                <Text className="text-[26px] font-extrabold text-white">
                  {isLoading ? "Loading..." : formattedBalance}
                </Text>
                <Pressable onPress={() => setBalanceVisible((v) => !v)} hitSlop={ICON_HIT_SLOP}>
                  <EyeIcon visible={balanceVisible} />
                </Pressable>
              </View>
              <Text className="mt-2 text-[12px]" style={{ color: "rgba(255,255,255,0.85)" }}>
                For refunds, rewards and shopping credits
              </Text>
            </View>
          </View>

          {/* Virtual account card */}
          <View className="mt-4 overflow-hidden rounded-[20px] px-5 py-5">
            <View className="absolute inset-0">
              <Svg width="100%" height="100%" viewBox="0 0 420 420" preserveAspectRatio="none">
                <Defs>
                  <LinearGradient id="walletAccountGradient" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor="#8A7FE0" />
                    <Stop offset="1" stopColor="#5B4FD1" />
                  </LinearGradient>
                </Defs>
                <Rect x="0" y="0" width="420" height="420" fill="url(#walletAccountGradient)" />
              </Svg>
            </View>

            <View className="relative">
              <Text className="text-center text-[16px] font-bold text-white">Your Personal Account</Text>
              <Text className="mt-1 text-center text-[13px]" style={{ color: "rgba(255,255,255,0.8)" }}>
                Fund via bank transfer
              </Text>

              {accountNumber ? (
                <>
                  <View
                    className="mt-4 items-center rounded-[14px] py-4"
                    style={{ backgroundColor: "rgba(255,255,255,0.16)" }}
                  >
                    <Text selectable className="text-[22px] font-extrabold tracking-wider text-white">
                      {accountNumber}
                    </Text>
                  </View>

                  <Pressable
                    onPress={handleCopyAccountNumber}
                    className="mt-4 flex-row items-center justify-center gap-2 self-center rounded-full px-5 py-2.5"
                    style={{ backgroundColor: "rgba(255,255,255,0.22)" }}
                  >
                    <KeyIcon />
                    <Text className="text-[13px] font-semibold text-white">
                      {copied ? "Copied!" : "Copy Account Number"}
                    </Text>
                  </Pressable>

                  <View className="mt-3 items-center rounded-[14px] px-4 py-3" style={{ backgroundColor: "rgba(255,255,255,0.14)" }}>
                    <Text className="text-[11px]" style={{ color: "rgba(255,255,255,0.75)" }}>Bank Name</Text>
                    <Text className="mt-0.5 text-[15px] font-semibold text-white">
                      {bankName || "Paystack-Titan"}
                    </Text>
                  </View>

                  <View className="mt-3 items-center rounded-[14px] px-4 py-3" style={{ backgroundColor: "rgba(255,255,255,0.14)" }}>
                    <Text className="text-[11px]" style={{ color: "rgba(255,255,255,0.75)" }}>Account Name</Text>
                    <Text className="mt-0.5 text-[15px] font-semibold text-white">{displayAccountName}</Text>
                  </View>

                  <View
                    className="mt-4 flex-row items-center gap-2 rounded-[14px] px-4 py-3"
                    style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
                  >
                    <BellIcon />
                    <Text className="flex-1 text-[11.5px]" style={{ color: "rgba(255,255,255,0.9)" }}>
                      Transfer any amount to this account and it will be automatically credited to your wallet
                    </Text>
                  </View>
                </>
              ) : (
                <Text className="mt-4 text-center text-[14px]" style={{ color: "rgba(255,255,255,0.85)" }}>
                  Your virtual account is being prepared. Please check back shortly.
                </Text>
              )}
            </View>
          </View>

          {/* create a section that tells the user that they can add funds to their wallet and a button that takes them to the wallet topup page or do a bank transfer to their account number above */}
          <View className="mt-6 rounded-[20px] px-5 py-5" style={{ backgroundColor: colors.card }}>
            <Text className="text-[16px] font-bold" style={{ color: colors.text }}>
              Funding Options
            </Text>
            <View className="mt-2 flex gap-1 p-5 rounded-[12px]" style={{ backgroundColor: colors.elevated }}>
                <Text className="text-[16px] font-semibold text-primary">
                  🏦 Bank Transfer
                </Text>
                <Text className="text-[14px]" style={{ color: colors.textMuted }}>
                  Transfer to your personal account number above. Funds are automatically credited within minutes.
                </Text>
            </View>
            
            <View className="mt-2 flex gap-1 p-5 rounded-[12px]" style={{ backgroundColor: colors.elevated }}>
              <Text className="text-[16px] font-semibold text-primary">
                💳 Fund your wallet
              </Text>
              <Text className="text-[14px]" style={{ color: colors.textMuted }}>
                Processed securely via Paystack.
              </Text>
            </View>
          </View> 

          <Pressable
            onPress={() => router.push("/wallet-topup")}
            className="mt-4 rounded-md bg-primary py-3.5"
          >
            <Text className="text-center text-[16px] font-medium text-white">Add Funds to Wallet</Text>
          </Pressable>

          <View className="mt-9 flex-row items-center justify-between">
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
                <Pressable
                  key={String(transaction.id)}
                  onPress={() => setSelectedTransaction(transaction)}
                  className="flex-row items-center justify-between"
                >
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
                </Pressable>
              );
            })}
          </View>          
        </View>
      </ScrollView>
      <TransactionDetailsSheet
        transaction={selectedTransaction}
        visible={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />
    </View>
  );
}