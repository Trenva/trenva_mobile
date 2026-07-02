import { Image, Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useAppTheme } from "../../lib/theme/theme-provider";
import { TrashIcon } from "../ui/home-ui";

type CartItemProps = {
  name: string;
  price: string;
  quantity: number;
  stock: string;
  image: any;
  onDelete: () => void;
  onQuantityChange: (qty: number) => void;
};

type PriceDetailsProps = {
  items: number;
  subtotal: string;
  discount: string;
  delivery: string;
  total: string;
};

export function CartItem({
  name,
  price,
  quantity,
  stock,
  image,
  onDelete,
  onQuantityChange,
}: CartItemProps) {
  const { colors } = useAppTheme();
  const naira = "\u20A6";
  const normalizedPrice = Number(String(price ?? "0").replace(/[^\d.-]/g, ""));
  const displayPrice = Number.isNaN(normalizedPrice) ? "0" : normalizedPrice.toLocaleString();

  const isOutOfStock = stock === "Out of Stock";
  const isLowStock = stock.includes("left");
  const stockColor = isOutOfStock ? "#EF4444" : isLowStock ? colors.primary : "#22C55E";

  return (
    <View className="mx-4 mb-4 rounded-md px-4 py-4" style={{ backgroundColor: colors.elevated }}>
      <View className="flex-row">
        <Image source={image} className="h-24 w-24 rounded-xl" resizeMode="cover" />

        <View className="ml-4 flex-1">
          <View className="flex-row items-start justify-between">
            <Text className="flex-1 pr-2 text-sm font-semibold" style={{ color: colors.text }}>
              {name}
            </Text>
            <Pressable onPress={onDelete} hitSlop={8}>
              <TrashIcon size={18} />
            </Pressable>
          </View>

          <Text className="mt-1 text-base font-bold" style={{ color: colors.text }}>
            {`${naira}${displayPrice}`}
          </Text>

          <View className="mt-3 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <Pressable onPress={() => onQuantityChange(Math.max(1, quantity - 1))} hitSlop={8}>
                <Text className="text-xl font-bold" style={{ color: colors.text }}>-</Text>
              </Pressable>
              <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                {quantity}
              </Text>
              <Pressable onPress={() => onQuantityChange(quantity + 1)} hitSlop={8}>
                <Text className="text-xl font-bold" style={{ color: colors.text }}>+</Text>
              </Pressable>
            </View>

            <Text className="text-xs font-semibold" style={{ color: stockColor }}>
              {stock}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export function PriceDetails({ items, subtotal, discount, delivery, total }: PriceDetailsProps) {
  const { colors } = useAppTheme();
  const naira = "\u20A6";

  return (
    <View className="mx-4 mt-2 mb-4 rounded-2xl px-5 py-5 shadow-sm" style={{ backgroundColor: colors.card }}>
      <Text className="mb-4 text-base font-bold" style={{ color: colors.text }}>
        Price Details
      </Text>

      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-sm" style={{ color: colors.textMuted }}>{`Price (${items} Items)`}</Text>
        <Text className="text-sm font-semibold" style={{ color: colors.text }}>{`${naira}${subtotal}`}</Text>
      </View>

      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-sm" style={{ color: colors.textMuted }}>Discount</Text>
        <Text className="text-xs font-semibold  bg-primary rounded-xl px-1 py-0.5 text-white">Discount can be added at checkout</Text>
      </View>

      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-sm" style={{ color: colors.textMuted }}>Delivery Charges</Text>
        <Text className="text-xs font-semibold bg-primary rounded-xl px-1 py-0.5 text-white">Delivery fee will be added at checkout</Text>
      </View>

      <View className="mb-4 h-px" style={{ backgroundColor: colors.border }} />

      <View className="flex-row items-center justify-between">
        <Text className="text-base font-bold" style={{ color: colors.text }}>Total Amount</Text>
        <Text className="text-base font-bold" style={{ color: colors.text }}>{`${naira}${total}`}</Text>
      </View>
    </View>
  );
}

export function BackIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12H19M5 12L9 16M5 12L9 8" stroke="#1F2937" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
