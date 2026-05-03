import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { BackIcon } from "../../components/ui/general-ui";
import { LoadingListSkeleton } from "../../components/ui/loading-skeleton";
import { TabIcon } from "../../components/ui/home-ui";
import { clearAuthTokens } from "../../lib/auth/tokens";
import { getApiErrorMessage, isUnauthorizedError } from "../../lib/api/errors";
import {
  addOrIncrementCartItemWithOptions,
  createProductReview,
  type ApiOrder,
  type ApiProduct,
  formatMoney,
  getOrders,
  getPublishedProducts,
  resolveMediaUrl,
} from "../../lib/api/shop";
import { notifyError, notifySuccess } from "../../lib/ui/notify";

function OrdersTabIcon({ active }: { active: boolean }) {
  const color = active ? "#FF9F0A" : "#D4A04A";
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M5 5H19V19H5V5Z" stroke={color} strokeWidth={1.8} />
      <Path d="M8 9H16M8 12H16M8 15H13" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function Star({
  active,
  onPress,
}: {
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="px-1 py-1">
      <Text className={`text-[24px] ${active ? "text-primary" : "text-[#BFBFBF]"}`}>★</Text>
    </Pressable>
  );
}

function BottomOrdersNav() {
  return (
    <View className="px-4 pb-4 pt-2">
      <View className="flex-row items-center justify-between rounded-[12px] bg-[#FAF5EF] px-7 py-4">
        <Pressable onPress={() => router.push("/(tabs)")}>
          <TabIcon routeName="index" color="#D4A04A" />
        </Pressable>
        <Pressable onPress={() => router.push("/(tabs)/cart")}>
          <TabIcon routeName="cart" color="#D4A04A" />
        </Pressable>
        <Pressable onPress={() => router.push("/(tabs)/wishlist")}>
          <TabIcon routeName="wishlist" color="#D4A04A" />
        </Pressable>
        <Pressable>
          <OrdersTabIcon active />
        </Pressable>
        <Pressable onPress={() => router.push("/(tabs)/profile")}>
          <TabIcon routeName="profile" color="#D4A04A" />
        </Pressable>
      </View>
    </View>
  );
}

type OrderRow = {
  id: string;
  orderOid: string;
  orderNumericId?: number;
  trackingId?: string | null;
  status: string;
  name: string;
  price: string | number | null;
  orderNo: string;
  date: string;
  image?: string | null;
  qty?: number;
  productColor?: string | null;
  productSize?: string | null;
};

function ItemArtwork({ imageUrl }: { imageUrl?: string | null }) {
  return (
    <View className="h-[92px] w-[92px] overflow-hidden bg-[#DCC6AA]">
      {imageUrl ? <Image source={{ uri: imageUrl }} className="h-full w-full" resizeMode="cover" /> : null}
    </View>
  );
}

function ActiveCard({ item, onTrack }: { item: OrderRow; onTrack: (item: OrderRow) => void }) {
  return (
    <View className="border-b border-[#D7D7D7] py-4">
      <View className="flex-row items-center">
        <ItemArtwork imageUrl={resolveMediaUrl(item.image)} />
        <View className="ml-3 flex-1">
          <Text className="text-[15px] text-[#2D2D2D]">{item.name}</Text>
          <Text className="mt-2 text-[15px] text-[#2D2D2D]">{formatMoney(item.price)}</Text>
        </View>
        <Pressable onPress={() => onTrack(item)} className="rounded-full bg-primary px-4 py-2">
          <Text className="text-[14px] text-white">Track Order</Text>
        </Pressable>
      </View>
    </View>
  );
}

function CompletedCard({ item, onLeaveReview }: { item: OrderRow; onLeaveReview: (item: OrderRow) => void }) {
  return (
    <View className="border-b border-[#D7D7D7] py-4">
      <View className="flex-row items-center">
        <ItemArtwork imageUrl={resolveMediaUrl(item.image)} />
        <View className="ml-3 flex-1">
          <Text className="text-[15px] text-[#2D2D2D]">{item.name}</Text>
          <Text className="mt-2 text-[15px] text-[#2D2D2D]">{formatMoney(item.price)}</Text>
        </View>
        <Pressable onPress={() => onLeaveReview(item)} className="rounded-full bg-primary px-4 py-2">
          <Text className="text-[14px] text-white">Leave Review</Text>
        </Pressable>
      </View>
    </View>
  );
}

function CancelledCard({ item, onReorder }: { item: OrderRow; onReorder: (item: OrderRow) => void }) {
  return (
    <View className="border-b border-[#D7D7D7] py-4">
      <View className="flex-row items-center">
        <ItemArtwork imageUrl={resolveMediaUrl(item.image)} />
        <View className="ml-3 flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="text-[15px] text-[#2D2D2D]">{item.name}</Text>
            <Text className="text-[15px] text-[#2D2D2D]">Order No:{item.orderNo}</Text>
          </View>
          <View className="mt-1 self-start bg-primary px-2 py-0.5">
            <Text className="text-[11px] font-semibold text-[#2D2D2D]">REFUNDED</Text>
          </View>
          <Text className="mt-1 text-[15px] text-[#3A3A3A]">On {item.date}</Text>
          <Text className="mt-1 text-[15px] text-[#2D2D2D]">{formatMoney(item.price)}</Text>
        </View>
        <Pressable onPress={() => onReorder(item)} className="rounded-full bg-primary px-4 py-2">
          <Text className="text-[14px] text-white">Re - Order</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function OrdersScreen() {
  const [tab, setTab] = useState<"active" | "completed" | "cancelled">("active");
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<OrderRow | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  async function loadOrders() {
    try {
      setIsLoading(true);
      const [ordersData, productsData] = await Promise.all([getOrders(), getPublishedProducts()]);
      setOrders(ordersData);
      setProducts(productsData);
      setErrorText(null);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        await clearAuthTokens();
        notifyError("Session expired", "Please log in again.");
        router.replace("/(auth)/login");
        return;
      }
      setOrders([]);
      setProducts([]);
      setErrorText(getApiErrorMessage(error, "Unable to load orders right now."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    async function bootstrap() {
      await loadOrders();
      if (!mounted) return;
    }
    void bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  const flattenedRows = useMemo(() => {
    const rows: Array<OrderRow> = [];
    for (const order of orders) {
      const orderDate = order.order_date ? new Date(order.order_date).toLocaleDateString() : "";
      const orderStatus = String(order.product_status ?? "").toLowerCase();
      const orderItems = order.items ?? [];
      for (const item of orderItems) {
        rows.push({
          id: `${order.oid}-${item.id ?? Math.random()}`,
          orderOid: order.oid,
          orderNumericId: order.id,
          trackingId: order.tracking_id,
          name: item.product_name ?? item.item ?? "Product",
          price: item.total ?? item.price ?? order.price ?? 0,
          orderNo: order.oid,
          date: item.order_date ? new Date(item.order_date).toLocaleDateString() : orderDate,
          image: item.image ?? null,
          qty: item.qty ?? 1,
          productColor: item.product_color ?? "Default",
          productSize: item.product_size ?? "Default",
          status: String(item.product_status ?? orderStatus).toLowerCase(),
        });
      }
      if (orderItems.length === 0) {
        rows.push({
          id: `${order.oid}-empty`,
          orderOid: order.oid,
          orderNumericId: order.id,
          trackingId: order.tracking_id,
          name: "Order",
          price: order.price ?? 0,
          orderNo: order.oid,
          date: orderDate,
          image: null,
          qty: 1,
          productColor: "Default",
          productSize: "Default",
          status: orderStatus,
        });
      }
    }
    return rows;
  }, [orders]);

  const activeRows = useMemo(
    () =>
      flattenedRows.filter((row) =>
        ["placed", "processing", "shipped", "pending"].some((status) => row.status.includes(status)),
      ),
    [flattenedRows],
  );

  const completedRows = useMemo(
    () => flattenedRows.filter((row) => row.status.includes("delivered") || row.status.includes("completed")),
    [flattenedRows],
  );

  const cancelledRows = useMemo(
    () =>
      flattenedRows.filter((row) =>
        ["cancel", "refund", "rejected", "failed"].some((status) => row.status.includes(status)),
      ),
    [flattenedRows],
  );

  const productLookup = useMemo(() => {
    const map = new Map<string, ApiProduct>();
    for (const product of products) {
      map.set((product.title ?? "").trim().toLowerCase(), product);
    }
    return map;
  }, [products]);

  async function handleTrackOrder(item: OrderRow) {
    router.push({
      pathname: "/order-track",
      params: {
        oid: item.orderOid,
        status: item.status,
        trackingId: item.trackingId ?? "",
      },
    });
  }

  function handleLeaveReview(item: OrderRow) {
    setReviewTarget(item);
    setReviewRating(5);
    setReviewText("");
    setReviewModalVisible(true);
  }

  async function handleSubmitReview() {
    if (!reviewTarget) return;

    const text = reviewText.trim();
    if (!text) {
      notifyError("Review required", "Please type a short review message.");
      return;
    }

    const item = reviewTarget;
    const matched = productLookup.get(item.name.trim().toLowerCase());
    const productId = matched?.id;
    if (!productId) {
      notifyError("Review failed", "Product could not be matched for review.");
      return;
    }

    setIsSubmittingReview(true);
    try {
      await createProductReview({
        productId,
        rating: reviewRating,
        review: text,
      });
      notifySuccess("Review submitted", "Thanks for your feedback.");
      setReviewModalVisible(false);
      setReviewTarget(null);
      setReviewText("");
    } catch {
      notifyError("Review failed", "Unable to submit review right now.");
    } finally {
      setIsSubmittingReview(false);
    }
  }

  async function handleReorder(item: OrderRow) {
    const matched = productLookup.get(item.name.trim().toLowerCase());
    const productId = matched?.id;
    if (!productId) {
      notifyError("Re-order failed", "Product could not be matched.");
      return;
    }

    try {
      await addOrIncrementCartItemWithOptions({
        productId,
        qty: item.qty ?? 1,
        productColor: item.productColor ?? "Default",
        productSize: item.productSize ?? "Default",
      });
      notifySuccess("Added to cart", `${item.name} added back to cart.`);
      router.push("/(tabs)/cart");
    } catch {
      notifyError("Re-order failed", "Unable to add this item to cart.");
    }
  }

  const currentRows = tab === "active" ? activeRows : tab === "completed" ? completedRows : cancelledRows;

  return (
    <View className="flex-1 bg-[#F7F7F7]">
      <View className="flex-row items-center px-3 pt-3">
        <Pressable className="h-8 w-8 items-center justify-center" onPress={() => router.back()}>
          <BackIcon />
        </Pressable>
        <Text className="flex-1 text-center text-[25px] font-medium text-[#2F2F2F]">My Orders</Text>
        <View className="w-8" />
      </View>

      <View className="mt-4 px-4">
        <View className="flex-row">
          {[
            { key: "active", label: "Active" },
            { key: "completed", label: "Completed" },
            { key: "cancelled", label: "Cancelled" },
          ].map((t) => {
            const isActive = tab === (t.key as typeof tab);
            return (
              <Pressable
                key={t.key}
                onPress={() => setTab(t.key as typeof tab)}
                className="flex-1 items-center pb-3"
              >
                <Text className={`text-[17px] ${isActive ? "font-medium text-[#2D2D2D]" : "text-[#222222]"}`}>
                  {t.label}
                </Text>
                {isActive ? <View className="mt-3 h-[3px] w-full bg-primary" /> : <View className="mt-3 h-[1px] w-full bg-[#D9D9D9]" />}
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-4">
        <View className="pt-1">
          {isLoading ? (
            <View className="px-1">
              <LoadingListSkeleton rows={4} />
            </View>
          ) : errorText ? (
            <View className="items-center py-10">
              <Text className="text-center text-[14px] text-[#777]">{errorText}</Text>
              <Pressable onPress={() => void loadOrders()} className="mt-4 rounded-full bg-primary px-5 py-2.5">
                <Text className="text-[13px] text-white">Retry</Text>
              </Pressable>
            </View>
          ) : null}
          {!isLoading && currentRows.length === 0 ? (
            <View className="items-center py-10">
              <Text className="text-[14px] text-[#777]">No {tab} orders yet.</Text>
            </View>
          ) : null}
          {!isLoading && tab === "active" && activeRows.map((item) => <ActiveCard key={item.id} item={item} onTrack={handleTrackOrder} />)}
          {!isLoading && tab === "completed" && completedRows.map((item) => <CompletedCard key={item.id} item={item} onLeaveReview={handleLeaveReview} />)}
          {!isLoading && tab === "cancelled" && cancelledRows.map((item) => <CancelledCard key={item.id} item={item} onReorder={handleReorder} />)}
        </View>
      </ScrollView>

      <Modal transparent visible={reviewModalVisible} animationType="fade" onRequestClose={() => setReviewModalVisible(false)}>
        <View className="flex-1 items-center justify-center bg-black/35 px-5">
          <View className="w-full max-w-[340px] rounded-[14px] bg-white p-4">
            <Text className="text-[18px] font-medium text-[#2F2F2F]">Leave Review</Text>
            <Text className="mt-1 text-[13px] text-[#666]">{reviewTarget?.name ?? "Product"}</Text>

            <View className="mt-3 flex-row">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={`star-${star}`} active={star <= reviewRating} onPress={() => setReviewRating(star)} />
              ))}
            </View>

            <TextInput
              value={reviewText}
              onChangeText={setReviewText}
              placeholder="Write your review..."
              multiline
              textAlignVertical="top"
              className="mt-3 min-h-[90px] rounded-[10px] border border-[#DDD] px-3 py-2 text-[14px] text-[#2F2F2F]"
            />

            <View className="mt-4 flex-row justify-end gap-2">
              <Pressable onPress={() => setReviewModalVisible(false)} className="rounded-[8px] border border-[#CCC] px-4 py-2">
                <Text className="text-[14px] text-[#555]">Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSubmitReview} disabled={isSubmittingReview} className="rounded-[8px] bg-primary px-4 py-2">
                {isSubmittingReview ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text className="text-[14px] text-white">Submit</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <BottomOrdersNav />
    </View>
  );
}
