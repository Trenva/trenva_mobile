import { useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { CartItem, PriceDetails } from "../../components/product/CartItem";
import { BackIcon, SearchGrayIcon, BellDarkIcon } from "../../components/ui/general-ui";

type CartItemType = {
  id: number;
  name: string;
  price: string;
  quantity: number;
  stock: string;
  image: any;
};

const initialCartItems: CartItemType[] = [
  {
    id: 1,
    name: "Bloom Craft Pots",
    price: "2000",
    quantity: 1,
    stock: "Stock: 10 left",
    image: require("../../assets/cart-logo.png"),
  },
  {
    id: 2,
    name: "Bloom Craft Pots",
    price: "2000",
    quantity: 1,
    stock: "Out of Stock",
    image: require("../../assets/cart-logo.png"),
  },
  {
    id: 3,
    name: "Bloom Craft Pots",
    price: "4500",
    quantity: 1,
    stock: "Stock: 2 left",
    image: require("../../assets/cart-logo.png"),
  },
  {
    id: 4,
    name: "Bloom Craft Pots",
    price: "3500",
    quantity: 1,
    stock: "Out of Stock",
    image: require("../../assets/cart-logo.png"),
  },
];


export default function CartScreen() {
  const [cartItems, setCartItems] = useState<CartItemType[]>(initialCartItems);

  const handleDelete = (id: number) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleQuantityChange = (id: number, qty: number) => {
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: qty } : item))
    );
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      {/* Scrollable Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="bg-white px-4 pt-3 pb-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Pressable className="h-8 w-8 items-center justify-center" onPress={() => router.back()}>
              <BackIcon />
            </Pressable>
            <View className="flex-row items-center gap-4">
              <Pressable onPress={() => router.push("/search")}>
                <SearchGrayIcon />
              </Pressable>
              <BellDarkIcon />
            </View>
          </View>

          <View className="mt-4">
            <Text className="text-[28px] font-medium text-[#303030]">Cart</Text>
          </View>
        </View>

        {/* Cart Items */}
        {cartItems.map((item) => (
          <CartItem
            key={item.id}
            name={item.name}
            price={item.price}
            quantity={item.quantity}
            stock={item.stock}
            image={item.image}
            onDelete={() => handleDelete(item.id)}
            onQuantityChange={(qty) => handleQuantityChange(item.id, qty)}
          />
        ))}

        {/* Price Details */}
        <PriceDetails
          items={cartItems.length}
          subtotal="12000"
          discount="2500"
          delivery="145"
          total="9645"
        />

        {/* Make Payment Button */}
        <Pressable
          onPress={() => router.push("/address")}
          className="mx-4 mt-2 rounded-full bg-primary py-4"
          android_ripple={{ color: "#e08800" }}
        >
          <Text className="text-center text-base font-bold text-white">
            Make Payment
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
