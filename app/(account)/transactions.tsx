import { useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackIcon } from "../../components/ui/general-ui";
import { goBackOr } from "../../lib/navigation/go-back-or";
import { formatMoney, getTransactions, type ApiTransaction } from "../../lib/api/shop";
import { useAppTheme } from "../../lib/theme/theme-provider";
import { getApiErrorMessage, isUnauthorizedError } from "../../lib/api/errors";
import { clearAuthTokens } from "../../lib/auth/tokens";
import { promptLoginRequired } from "../../lib/ui/login-required";

const ICON_HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 } as const;

function toTransactionAmount(transaction: ApiTransaction) {
  const amount = Number(transaction.amount ?? 0);
  const positive = String(transaction.transaction_type ?? "").toLowerCase() === "credit";
  const signed = positive ? amount : -Math.abs(amount);
  const pretty = `${positive ? "+" : "-"} ${formatMoney(Math.abs(signed))}`;
  return { text: pretty, positive };
}

export default function TransactionsScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [errorText, setErrorText] = useState<string | null>(null);

  async function loadTransactions() {
    try {
      const rows = await getTransactions({ status: "success" });
      setTransactions(rows);
      setErrorText(null);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        await clearAuthTokens();
        promptLoginRequired(router, "Please sign in to view your transactions.");
        return;
      }
      setErrorText(getApiErrorMessage(error, "Could not load transactions right now."));
      setTransactions([]);
    } finally {
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    void loadTransactions();
  }, []);

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const aTime = new Date(a.created_at ?? a.formatted_date ?? 0).getTime();
      const bTime = new Date(b.created_at ?? b.formatted_date ?? 0).getTime();
      return bTime - aTime;
    });
  }, [transactions]);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              void loadTransactions();
            }}
          />
        }
      >
        <View className="flex-row items-center px-3 pb-3" style={{ paddingTop: Math.max(insets.top + 4, 12), backgroundColor: colors.background }}>
          <Pressable className="h-8 w-8 items-center justify-center" onPress={() => goBackOr(router)} hitSlop={ICON_HIT_SLOP}>
            <BackIcon />
          </Pressable>
          <Text className="flex-1 text-center text-[24px] font-medium" style={{ color: colors.text }}>Transactions</Text>
          <View className="w-8" />
        </View>

        <View className="px-5 pb-8">
          {errorText ? <Text className="mt-3 text-[14px]" style={{ color: colors.error }}>{errorText}</Text> : null}
          {!errorText && sortedTransactions.length === 0 ? (
            <Text className="mt-6 text-[14px]" style={{ color: colors.textMuted }}>No wallet transactions yet.</Text>
          ) : null}

          <View className="mt-4 gap-5">
            {sortedTransactions.map((transaction) => {
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

