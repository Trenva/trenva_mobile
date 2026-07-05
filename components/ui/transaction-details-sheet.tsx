import { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  Text,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import Svg, { Path } from "react-native-svg";
import { formatMoney, type ApiTransaction } from "../../lib/api/shop";
import { notifySuccess } from "../../lib/ui/notify";
import { useAppTheme } from "../../lib/theme/theme-provider";

const SCREEN_HEIGHT = Dimensions.get("window").height;

function CloseIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M5 5l14 14M19 5L5 19" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function CopyIcon({ color }: { color: string }) {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
      <Path d="M8 8h10v10H8z" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
      <Path d="M5 15V5h10" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
    </Svg>
  );
}

function CheckCircleIcon({ color }: { color: string }) {
  return (
    <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21a9 9 0 100-18 9 9 0 000 18z"
        stroke={color}
        strokeWidth={1.6}
      />
      <Path d="M8 12.5l2.5 2.5L16 9.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function toTransactionAmount(transaction: ApiTransaction) {
  const amount = Number(transaction.amount ?? 0);
  const positive = String(transaction.transaction_type ?? "").toLowerCase() === "credit";
  const signed = positive ? amount : -Math.abs(amount);
  return { text: `${positive ? "+" : "-"} ${formatMoney(Math.abs(signed))}`, positive };
}

function DetailRow({
  label,
  value,
  colors,
  copyable,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useAppTheme>["colors"];
  copyable?: boolean;
}) {
  async function handleCopy() {
    await Clipboard.setStringAsync(value);
    notifySuccess("Copied", `${label} copied.`);
  }

  return (
    <View className="flex-row items-center justify-between border-b py-3.5" style={{ borderColor: colors.border }}>
      <Text className="text-[13px]" style={{ color: colors.textMuted }}>{label}</Text>
      <View className="flex-1 flex-row items-center justify-end gap-2 pl-6">
        <Text
          numberOfLines={1}
          ellipsizeMode="middle"
          className="text-[13.5px] font-medium"
          style={{ color: colors.text, flexShrink: 1 }}
        >
          {value}
        </Text>
        {copyable ? (
          <Pressable onPress={handleCopy} hitSlop={10}>
            <CopyIcon color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function TransactionDetailsSheet({
  transaction,
  visible,
  onClose,
}: {
  transaction: ApiTransaction | null;
  visible: boolean;
  onClose: () => void;
}) {
  const { colors } = useAppTheme();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 4 }),
        Animated.timing(backdropOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  function animateClose() {
    Animated.parallel([
      Animated.timing(translateY, { toValue: SCREEN_HEIGHT, duration: 220, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose());
  }

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 6,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) translateY.setValue(gesture.dy);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 100) {
          animateClose();
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
        }
      },
    }),
  ).current;

  if (!transaction) return null;

  const amount = toTransactionAmount(transaction);
  const statusColor =
    transaction.status === "success" ? colors.success : transaction.status === "failed" ? colors.error : colors.textMuted;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={animateClose}>
      <View style={{ flex: 1 }}>
        <Animated.View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", opacity: backdropOpacity }}>
          <Pressable style={{ flex: 1 }} onPress={animateClose} />
        </Animated.View>

        <Animated.View
          style={{
            transform: [{ translateY }],
            backgroundColor: colors.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: 32,
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          <View {...panResponder.panHandlers} className="items-center pb-2 pt-3">
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
          </View>

          <View className="flex-row items-center justify-between px-5 pb-2">
            <Text className="text-[17px] font-semibold" style={{ color: colors.text }}>
              Transaction Details
            </Text>
            <Pressable onPress={animateClose} hitSlop={10} className="h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: colors.elevated }}>
              <CloseIcon color={colors.text} />
            </Pressable>
          </View>

          <View className="items-center px-5 pb-5 pt-3">
            <CheckCircleIcon color={amount.positive ? colors.success : colors.error} />
            <Text
              className="mt-3 text-[28px] font-extrabold"
              style={{ color: amount.positive ? colors.success : colors.error }}
            >
              {amount.text}
            </Text>
            <Text className="mt-1 text-[13px]" style={{ color: colors.textMuted }}>
              {transaction.description || "Wallet transaction"}
            </Text>
          </View>

          <View className="px-5">
            <DetailRow
              label="Status"
              value={(transaction.status || "unknown").toUpperCase()}
              colors={{ ...colors, text: statusColor }}
            />
            <DetailRow label="Type" value={(transaction.transaction_type || "").toUpperCase()} colors={colors} />
            <DetailRow label="Reference" value={transaction.reference || "N/A"} colors={colors} copyable />
            <DetailRow label="Date" value={transaction.formatted_date || "Unknown"} colors={colors} />
            <DetailRow label="Balance After" value={formatMoney(Number(transaction.balance_after ?? 0))} colors={colors} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}