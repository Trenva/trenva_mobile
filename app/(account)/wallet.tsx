import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { BackIcon } from "../../components/ui/general-ui";
import { clearAuthTokens } from "../../lib/auth/tokens";
import { getApiErrorMessage, isUnauthorizedError } from "../../lib/api/errors";
import { formatMoney, getTransactions, getWallets, type ApiTransaction } from "../../lib/api/shop";
import { notifyError, notifyInfo } from "../../lib/ui/notify";

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
  const [isLoading, setIsLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [errorText, setErrorText] = useState<string | null>(null);

  const loadWallet = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorText(null);

      const [wallets, txns] = await Promise.all([getWallets(), getTransactions({ status: "success" })]);
      const firstWallet = wallets[0];
      setWalletBalance(Number(firstWallet?.balance ?? 0) || 0);
      setTransactions(txns.slice(0, 10));
    } catch (error) {
      if (isUnauthorizedError(error)) {
        await clearAuthTokens();
        notifyInfo("Session expired", "Please log in again.");
        router.replace("/(auth)/login");
        return;
      }

      const message = getApiErrorMessage(error, "Could not load wallet right now.");
      setErrorText(message);
      notifyError("Wallet error", message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWallet();
  }, [loadWallet]);

  const today = useMemo(
    () => new Date().toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" }),
    [],
  );

  return (
    <View className="flex-1 bg-[#F7F7F7]">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 26 }}>
        <View className="flex-row items-center px-3 pt-3">
          <Pressable className="h-8 w-8 items-center justify-center" onPress={() => router.back()}>
            <BackIcon />
          </Pressable>
          <Text className="flex-1 text-center text-[24px] font-medium text-[#2F2F2F]">Trenva Wallet</Text>
          <View className="w-8" />
        </View>

        <View className="px-5 pt-8">
          <Text className="text-[34px] font-semibold text-primary">Your Balance</Text>

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
                <Text className="text-[36px] font-semibold text-white">
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

          <Pressable
            onPress={() => notifyInfo("Coming soon", "Withdraw flow will be enabled shortly.")}
            className="mt-8 rounded-[12px] bg-primary py-3.5"
          >
            <Text className="text-center text-[16px] text-white">Withdraw</Text>
          </Pressable>

          <View className="mt-8 border-b border-dashed border-[#797979]" />
          <View className="flex-row items-center justify-between border-b border-[#8F8F8F] py-3">
            <View>
              <Text className="text-[18px] font-semibold text-primary">PIN</Text>
              <Text className="-mt-1 text-[18px] text-[#161337]">••••</Text>
            </View>
            <Pressable onPress={() => notifyInfo("Coming soon", "PIN change flow will be enabled shortly.")}>
              <Text className="text-[18px] font-semibold text-primary">Change PIN</Text>
            </Pressable>
          </View>

          <View className="mt-8 flex-row items-center justify-between">
            <Text className="text-[18px] font-semibold text-primary">Activities</Text>
            <Pressable className="flex-row items-center gap-1">
              <Text className="text-[12px] text-[#6A6A6A]">Weekly</Text>
              <DownDarkIcon />
            </Pressable>
          </View>

          <View className="mt-6 flex-row items-end justify-between px-4">
            {[68, 34, 50, 62, 30].map((height, index) => (
              <View key={`${height}-${index}`} className="items-center">
                <View className="h-[20px] w-[20px] rounded-full border-[5px] border-primary bg-[#F7F7F7]" />
                <View className="w-[12px] rounded-full bg-primary" style={{ height }} />
              </View>
            ))}
          </View>
          <View className="mt-3 flex-row justify-between px-4">
            {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => (
              <Text key={day} className="w-[44px] text-center text-[14px] text-[#2F2F2F]">
                {day}
              </Text>
            ))}
          </View>

          <View className="mt-12 flex-row items-center justify-between">
            <Text className="text-[18px] font-semibold text-primary">Recent transactions</Text>
            <Pressable onPress={() => void loadWallet()}>
              <Text className="text-[12px] text-[#6A6A6A] underline">Refresh</Text>
            </Pressable>
          </View>

          {errorText ? (
            <View className="mt-6 rounded-xl border border-[#E7B8B8] bg-[#FFF3F3] p-3">
              <Text className="text-[14px] text-[#8A2B2B]">{errorText}</Text>
            </View>
          ) : null}

          {!isLoading && transactions.length === 0 ? (
            <Text className="mt-6 text-[14px] text-[#7A7A7A]">No wallet transactions yet.</Text>
          ) : null}

          <View className="mt-6 gap-5">
            {transactions.map((transaction) => {
              const amount = toTransactionAmount(transaction);
              return (
                <View key={String(transaction.id)} className="flex-row items-center">
                  <View className="h-10 w-10 rounded-full bg-[#D7D7D7]" />
                  <View className="ml-4 flex-1">
                    <Text className="text-[16px] font-semibold text-[#303030]">
                      {transaction.description || transaction.reference || "Wallet transaction"}
                    </Text>
                    <Text className="text-[13px] text-[#9A9A9A]">{transaction.formatted_date || "Unknown time"}</Text>
                  </View>
                  <Text className={`text-[18px] font-medium ${amount.positive ? "text-[#1EB959]" : "text-[#EE3C3C]"}`}>
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
