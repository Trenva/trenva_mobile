import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Modal, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { goBackOr } from "../../lib/navigation/go-back-or";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackIcon } from "../../components/ui/general-ui";
import { LoadingListSkeleton } from "../../components/ui/loading-skeleton";
import { ProductCardImage, prefetchImageUris } from "../../components/ui/cached-image";
import { clearAuthTokens } from "../../lib/auth/tokens";
import { getApiErrorMessage, isUnauthorizedError } from "../../lib/api/errors";
import {
  addOrIncrementCartItemWithOptions,
  createProductReview,
  type ApiOrder,
  type ApiOrderItemReturn,
  type ApiProduct,
  formatMoney,
  getMyOrderItemsReturnInfo,
  getOrders,
  getPublishedProductsFiltered,
  isExplicitlyOutOfStock,
  resolveProductCardImageUrl,
} from "../../lib/api/shop";
import { notifyError, notifySuccess } from "../../lib/ui/notify";
import { useAppTheme } from "../../lib/theme/theme-provider";
import { promptLoginRequired } from "../../lib/ui/login-required";

const ICON_HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 } as const;

function Star({ active, onPress }: { active: boolean; onPress: () => void }) {
  const { colors } = useAppTheme();
  return (
    <Pressable onPress={onPress} className="px-1 py-1" hitSlop={ICON_HIT_SLOP}>
      <Text className={`text-[24px] ${active ? "text-primary" : ""}`} style={active ? undefined : { color: colors.textMuted }}>
        ★
      </Text>
    </Pressable>
  );
}

type OrderRow = {
  id: string;
  itemId?: string;
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

function StatusPill({ status, colors }: { status: string; colors: ReturnType<typeof useAppTheme>["colors"] }) {
  const normalized = status.toLowerCase();
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown";
  let bg = colors.elevated;
  let fg = colors.textMuted;

  if (["placed", "processing", "pending"].some((s) => normalized.includes(s))) {
    bg = "#FFF3E0";
    fg = "#F57C00";
  } else if (normalized.includes("shipped")) {
    bg = "#E3F2FD";
    fg = "#1976D2";
  } else if (normalized.includes("delivered") || normalized.includes("completed")) {
    bg = "#E8F5E9";
    fg = "#2E7D32";
  } else if (["cancel", "refund", "rejected", "failed"].some((s) => normalized.includes(s))) {
    bg = "#FFEBEE";
    fg = "#C62828";
  }

  return (
    <View className="self-start rounded-full px-2.5 py-1" style={{ backgroundColor: bg }}>
      <Text className="text-[10.5px] font-semibold" style={{ color: fg }}>
        {label}
      </Text>
    </View>
  );
}

function OrderItemCard({
  item,
  primaryAction,
  onReorder,
  onViewDetails,
  colors,
}: {
  item: OrderRow;
  primaryAction: { label: string; onPress: (item: OrderRow) => void } | null;
  onReorder: (item: OrderRow) => void;
  onViewDetails: (item: OrderRow) => void;
  colors: ReturnType<typeof useAppTheme>["colors"];
}) {
  const imageUrl = resolveProductCardImageUrl(item.image);

  return (
    <View
      className="mb-1 rounded-[16px] p-3.5 w-full"
      style={{
        backgroundColor: colors.card,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
      }}
    >
      <Pressable onPress={() => onViewDetails(item)} hitSlop={ICON_HIT_SLOP}>
      <View className="flex-row items-center justify-between">
        <Text className="text-[12px] font-medium" style={{ color: colors.textMuted }}>
          Order No: {item.orderNo}
        </Text>
        <Text className="text-[11px]" style={{ color: colors.textMuted }}>
          {item.date}
        </Text>
      </View>

      <View className="mt-2.5 flex-row items-center">
        <View className="h-[76px] w-[76px] overflow-hidden rounded-[10px]" style={{ backgroundColor: colors.elevated }}>
          {imageUrl ? <ProductCardImage uri={imageUrl} className="h-full w-full" /> : null}
        </View>
        <View className="ml-3 flex-1 pr-2">
          <Text numberOfLines={2} className="text-[14px] font-medium" style={{ color: colors.text }}>
            {item.name}
          </Text>
          <Text className="mt-1 text-[12px]" style={{ color: colors.textMuted }}>
            Qty: {item.qty ?? 1}
          </Text>
          <Text className="mt-1 text-[15px] font-semibold" style={{ color: colors.text }}>
            {formatMoney(item.price)}
          </Text>
        </View>
        <StatusPill status={item.status} colors={colors} />
      </View>

      <View className="mt-3.5 flex-row items-center justify-between">
        <View className="flex-row gap-2">
          {primaryAction ? (
            <Pressable
              onPress={() => primaryAction.onPress(item)}
              className="rounded-full bg-primary px-4 py-2"
              hitSlop={ICON_HIT_SLOP}
            >
              <Text className="text-[13px] font-medium" style={{ color: colors.background }}>
                {primaryAction.label}
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => onReorder(item)}
            className="rounded-full border px-4 py-2"
            style={{ borderColor: colors.primary }}
            hitSlop={ICON_HIT_SLOP}
          >
            <Text className="text-[13px] font-medium text-primary">Buy Again</Text>
          </Pressable>
        </View>
      </View>
      </Pressable>
    </View>
  );
}

export default function OrdersScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<"active" | "completed" | "cancelled" | "returns">("active");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<OrderRow | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [returnInfoByItemId, setReturnInfoByItemId] = useState<Map<string, ApiOrderItemReturn>>(new Map());

  const flattenedRows = useMemo(() => {
      const rows: Array<OrderRow> = [];
      for (const order of orders) {
        const orderDate = order.order_date ? new Date(order.order_date).toLocaleDateString() : "";
        const orderStatus = String(order.product_status ?? "").toLowerCase();
        const orderItems = order.items ?? [];

        if (orderItems.length === 0) {
          rows.push({
            id: `${order.oid}-empty`,
            itemId: undefined,
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
          continue;
        }

        for (const orderItem of orderItems) {
          const returnEntry = returnInfoByItemId.get(String(orderItem.id));
          const baseStatus = String(order.product_status ?? orderItem.product_status ?? orderStatus).toLowerCase();
          // If this specific item has an active return, it moves to the Returns tab on its own —
          // sibling items in the same order keep their original status untouched.
          const displayStatus = returnEntry?.already_returned
            ? `return ${returnEntry.return_status ?? "pending"}`
            : baseStatus;

          rows.push({
            id: `${order.oid}-${orderItem.id}`,
            itemId: String(orderItem.id),
            orderOid: order.oid,
            orderNumericId: order.id,
            trackingId: order.tracking_id,
            name: orderItem.product_name ?? orderItem.item ?? "Product",
            price: orderItem.total ?? orderItem.price ?? 0,
            orderNo: order.oid,
            date: orderDate || (orderItem.order_date ? new Date(orderItem.order_date).toLocaleDateString() : ""),
            image: orderItem.image ?? null,
            qty: orderItem.qty ?? 1,
            productColor: orderItem.product_color ?? "Default",
            productSize: orderItem.product_size ?? "Default",
            status: displayStatus,
          });
        }
      }
      return rows;
    }, [orders, returnInfoByItemId]);

    async function loadOrders(showLoader = true) {
      try {
        if (showLoader) setIsLoading(true);
        const [ordersData, returnItems] = await Promise.all([
          getOrders(),
          getMyOrderItemsReturnInfo().catch(() => [] as ApiOrderItemReturn[]),
        ]);
        setOrders(ordersData);
        setReturnInfoByItemId(new Map(returnItems.map((item) => [String(item.id), item])));
        setErrorText(null);
      } catch (error) {
        if (isUnauthorizedError(error)) {
          await clearAuthTokens();
          promptLoginRequired(router, "Please sign in to view your orders.");
          return;
        }
        setOrders([]);
        setProducts([]);
        setReturnInfoByItemId(new Map());
        setErrorText(getApiErrorMessage(error, "Unable to load orders right now."));
      } finally {
        if (showLoader) setIsLoading(false);
        setIsRefreshing(false);
      }
    }


  useEffect(() => {
    let mounted = true;
    async function bootstrap() {
      await loadOrders(true);
      if (!mounted) return;
    }
    void bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function hydrateOrderProducts() {
      const uniqueNames = Array.from(
        new Set(
          flattenedRows
            .map((row) => row.name?.trim())
            .filter((name): name is string => Boolean(name && name.length > 0 && name.toLowerCase() !== "order")),
        ),
      ).slice(0, 24);
      if (uniqueNames.length === 0) {
        if (mounted) setProducts([]);
        return;
      }
      try {
        const results = await Promise.all(
          uniqueNames.map((name) => getPublishedProductsFiltered({ query: name })),
        );
        if (!mounted) return;
        const byTitle = new Map<string, ApiProduct>();
        results.flat().forEach((product) => {
          const key = (product.title ?? "").trim().toLowerCase();
          if (key && !byTitle.has(key)) byTitle.set(key, product);
        });
        setProducts(Array.from(byTitle.values()));
      } catch {
        if (mounted) setProducts([]);
      }
    }
    void hydrateOrderProducts();
    return () => {
      mounted = false;
    };
  }, [flattenedRows]);

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

  const returnRows = useMemo(
    () => flattenedRows.filter((row) => row.status.includes("return")),
    [flattenedRows],
  );

  const productLookup = useMemo(() => {
    const map = new Map<string, ApiProduct>();
    for (const product of products) {
      map.set((product.title ?? "").trim().toLowerCase(), product);
    }
    return map;
  }, [products]);

  useEffect(() => {
    prefetchImageUris(flattenedRows.map((row) => resolveProductCardImageUrl(row.image)), 20);
  }, [flattenedRows]);

  function handleTrackOrder(item: OrderRow) {
    router.push({ pathname: "/order-details", params: { oid: item.orderOid, itemId: item.itemId } });
  }

  function handleViewOrderDetails(item: OrderRow) {
    router.push({ pathname: "/order-details", params: { oid: item.orderOid, itemId: item.itemId } });
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
      await createProductReview({ productId, rating: reviewRating, review: text });
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
    if (isExplicitlyOutOfStock(matched?.in_stock)) {
      notifyError("Out of stock", "This product is out of stock.");
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

  const currentRows =
    tab === "active" ? activeRows :
    tab === "completed" ? completedRows :
    tab === "returns" ? returnRows :
    cancelledRows;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="flex-row items-center px-3" style={{ paddingTop: Math.max(insets.top + 4, 12) }}>
        <Pressable className="h-8 w-8 items-center justify-center" onPress={() => goBackOr(router)} hitSlop={ICON_HIT_SLOP}>
          <BackIcon />
        </Pressable>
        <Text className="flex-1 text-center text-[25px] font-medium" style={{ color: colors.text }}>My Orders</Text>
        <View className="w-8" />
      </View>

      <View className="mt-4 px-4">
        <View className="flex-row">
          {[
            { key: "active", label: "Active" },
            { key: "completed", label: "Completed" },
            { key: "returns", label: "Returns" },
            { key: "cancelled", label: "Cancelled" },
          ].map((t) => {
            const isActive = tab === (t.key as typeof tab);
            return (
              <Pressable key={t.key} onPress={() => setTab(t.key as typeof tab)} className="flex-1 items-center pb-3">
                <Text className={`text-[17px] ${isActive ? "font-medium" : ""}`} style={{ color: colors.text }}>
                  {t.label}
                </Text>
                {isActive ? (
                  <View className="mt-3 h-[3px] w-full bg-primary" />
                ) : (
                  <View className="mt-3 h-[1px] w-full" style={{ backgroundColor: colors.border }} />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1 px-1"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); void loadOrders(false); }} />
        }
      >
        <View className="pt-3">
          {isLoading ? (
            <View className="px-1">
              <LoadingListSkeleton rows={4} />
            </View>
          ) : errorText ? (
            <View className="items-center py-10">
              <Text className="text-center text-[14px]" style={{ color: colors.textMuted }}>{errorText}</Text>
              <Pressable onPress={() => void loadOrders(true)} className="mt-4 rounded-full bg-primary px-5 py-2.5">
                <Text className="text-[13px]" style={{ color: colors.background }}>Retry</Text>
              </Pressable>
            </View>
          ) : null}

          {!isLoading && currentRows.length === 0 ? (
            <View className="items-center py-10">
              <Text className="text-[14px]" style={{ color: colors.textMuted }}>No {tab} orders yet.</Text>
            </View>
          ) : null}

          {!isLoading && tab === "active" &&
            activeRows.map((item) => (
              <OrderItemCard
                key={item.id}
                item={item}
                // primaryAction={{ label: "Track Order", onPress: handleTrackOrder }}
                primaryAction={null}
                onReorder={handleReorder}
                onViewDetails={handleViewOrderDetails}
                colors={colors}
              />
            ))}

          {!isLoading && tab === "completed" &&
            completedRows.map((item) => (
              <OrderItemCard
                key={item.id}
                item={item}
                primaryAction={{ label: "Leave Review", onPress: handleLeaveReview }}
                onReorder={handleReorder}
                onViewDetails={handleViewOrderDetails}
                colors={colors}
              />
            ))}

          {!isLoading && tab === "cancelled" &&
            cancelledRows.map((item) => (
              <OrderItemCard
                key={item.id}
                item={item}
                primaryAction={null}
                onReorder={handleReorder}
                onViewDetails={handleViewOrderDetails}
                colors={colors}
              />
            ))}
          {!isLoading && tab === "returns" &&
          returnRows.map((item) => (
            <OrderItemCard
              key={item.id}
              item={item}
              primaryAction={null}
              onReorder={handleReorder}
              onViewDetails={handleViewOrderDetails}
              colors={colors}
            />
          ))}
        </View>
      </ScrollView>

      <Modal transparent visible={reviewModalVisible} animationType="fade" onRequestClose={() => setReviewModalVisible(false)}>
        <View className="flex-1 items-center justify-center bg-black/35 px-5">
          <View className="w-full max-w-[340px] rounded-[14px] p-4" style={{ backgroundColor: colors.card }}>
            <Text className="text-[18px] font-medium" style={{ color: colors.text }}>Leave Review</Text>
            <Text className="mt-1 text-[13px]" style={{ color: colors.textMuted }}>{reviewTarget?.name ?? "Product"}</Text>

            <View className="mt-3 flex-row">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={`star-${star}`} active={star <= reviewRating} onPress={() => setReviewRating(star)} />
              ))}
            </View>

            <TextInput
              value={reviewText}
              onChangeText={setReviewText}
              placeholder="Write your review..."
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
              className="mt-3 min-h-[90px] rounded-[10px] border px-3 py-2 text-[14px]"
              style={{ borderColor: colors.border, color: colors.text }}
            />

            <View className="mt-4 flex-row justify-end gap-2">
              <Pressable onPress={() => setReviewModalVisible(false)} className="rounded-[8px] border px-4 py-2" style={{ borderColor: colors.border }}>
                <Text className="text-[14px]" style={{ color: colors.textMuted }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSubmitReview} disabled={isSubmittingReview} className="rounded-[8px] bg-primary px-4 py-2">
                {isSubmittingReview ? (
                  <ActivityIndicator color={colors.background} size="small" />
                ) : (
                  <Text className="text-[14px]" style={{ color: colors.background }}>Submit</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}