import { View, Text, Pressable, Image } from "react-native";
import { TrashIcon } from "../ui/home-ui";
import { Path } from "react-native-svg";
import { Svg } from "react-native-svg";
// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── CartItem Component ───────────────────────────────────────────────────────

export function CartItem({
  name,
  price,
  quantity,
  stock,
  image,
  onDelete,
  onQuantityChange,
}: CartItemProps) {
  const isOutOfStock = stock === "Out of Stock";
  const isLowStock = stock.includes("left");

  const stockColor = isOutOfStock
    ? "text-red-500"
    : isLowStock
    ? "text-primary"
    : "text-green-500";

  return (
    <View className="mx-4 mb-4 rounded-md bg-gray-50 px-4 py-4 ">
      <View className="flex-row">
        {/* Product Image */}
        <Image
          source={image}
          className="h-24 w-24 rounded-xl"
          resizeMode="cover"
        />

        {/* Details */}
        <View className="ml-4 flex-1">
          {/* Name + Trash */}
          <View className="flex-row items-start justify-between">
            <Text className="flex-1 pr-2 text-sm font-semibold text-gray-800">
              {name}
            </Text>
            <Pressable onPress={onDelete} hitSlop={8}>
              <TrashIcon size={18} />
            </Pressable>
          </View>

          {/* Price */}
          <Text className="mt-1 text-base font-bold text-gray-800">
            ₹{price}
          </Text>

          {/* Quantity Stepper + Stock */}
          <View className="mt-3 flex-row items-center justify-between">
            {/* Stepper */}
            <View className="flex-row items-center gap-3">
              <Pressable
                onPress={() => onQuantityChange(Math.max(1, quantity - 1))}
                hitSlop={8}
              >
                <Text className="text-xl font-bold text-gray-800">−</Text>
              </Pressable>
              <Text className="text-sm font-semibold text-gray-800">
                {quantity}
              </Text>
              <Pressable
                onPress={() => onQuantityChange(quantity + 1)}
                hitSlop={8}
              >
                <Text className="text-xl font-bold text-gray-800">+</Text>
              </Pressable>
            </View>

            {/* Stock Status */}
            <Text className={`text-xs font-semibold ${stockColor}`}>
              {stock}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── PriceDetails Component ───────────────────────────────────────────────────

export function PriceDetails({
  items,
  subtotal,
  discount,
  delivery,
  total,
}: PriceDetailsProps) {
  return (
    <View className="mx-4 mt-2 mb-4 rounded-2xl bg-white px-5 py-5 shadow-sm">
      <Text className="mb-4 text-base font-bold text-gray-800">
        Price Details
      </Text>

      {/* Price Row */}
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-sm text-gray-500">Price ({items} Items)</Text>
        <Text className="text-sm font-semibold text-gray-800">₹{subtotal}</Text>
      </View>

      {/* Discount Row */}
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-sm text-gray-500">Discount</Text>
        <Text className="text-sm font-semibold text-gray-800">₹{discount}</Text>
      </View>

      {/* Delivery Row */}
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-sm text-gray-500">Delivery Charges</Text>
        <Text className="text-sm font-semibold text-gray-800">₹{delivery}</Text>
      </View>

      {/* Divider */}
      <View className="mb-4 h-px bg-gray-200" />

      {/* Total Row */}
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-bold text-gray-800">Total Amount</Text>
        <Text className="text-base font-bold text-gray-800">₹{total}</Text>
      </View>
    </View>
  );
}

export function BackIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12H19M5 12L9 16M5 12L9 8"
        stroke="#000"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
