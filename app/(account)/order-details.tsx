import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { BackIcon } from "../../components/ui/general-ui";
import { ProductCardImage } from "../../components/ui/cached-image";
import { goBackOr } from "../../lib/navigation/go-back-or";
import * as ImageManipulator from "expo-image-manipulator";
import {
  addOrIncrementCartItemWithOptions,
  createProductReview,
  formatMoney,
  getOrderByOid,
  getOrderItemReturnDetails,
  getProductById,
  isExplicitlyOutOfStock,
  requestItemReturn,
  resolveProductCardImageUrl,
  type ApiOrder,
  type ApiOrderItemReturn,
} from "../../lib/api/shop";
import { notifyError, notifySuccess } from "../../lib/ui/notify";
import { useAppTheme } from "../../lib/theme/theme-provider";
import { Image } from "react-native";

type ApiKwikpikTrackingDataEntry = NonNullable<ApiOrder["kwikpik_tracking_data"]>[string];

const ICON_HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 } as const;

const RETURN_REASONS: Array<{ value: string; label: string }> = [
  { value: "defective", label: "Product Defective/Damaged" },
  { value: "wrong_item", label: "Wrong Item Received" },
  { value: "not_as_described", label: "Not as Described" },
  { value: "size_issue", label: "Size Issue" },
  { value: "quality_issue", label: "Quality Not Satisfactory" },
  { value: "changed_mind", label: "Changed Mind" },
  { value: "other", label: "Other" },
];

const REFUND_PREFERENCES: Array<{ value: "wallet" | "voucher"; label: string }> = [
  { value: "wallet", label: "Refund to Trenva Wallet" },
  { value: "voucher", label: "Store Credit / Voucher" },
];

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

function DetailRow({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();
  return (
    <View className="mb-2 flex-row items-start justify-between gap-3">
      <Text className="text-[13px]" style={{ color: colors.textMuted }}>{label}</Text>
      <Text className="max-w-[62%] text-right text-[13px]" style={{ color: colors.text }}>
        {value || "—"}
      </Text>
    </View>
  );
}

function ReturnStatusBadge({ status }: { status: string | null | undefined }) {
  const { colors } = useAppTheme();
  const normalized = (status ?? "").toLowerCase();
  let bg = colors.elevated;
  let fg = colors.textMuted;
  let label = "Unknown";

  if (normalized === "pending") {
    bg = "#FFF3CD"; fg = "#856404"; label = "⏳ Pending Review";
  } else if (normalized === "approved") {
    bg = "#D1ECF1"; fg = "#0C5460"; label = "✅ Approved";
  } else if (normalized === "refunded") {
    bg = "#D4EDDA"; fg = "#155724"; label = "💰 Refunded";
  } else if (normalized === "rejected") {
    bg = "#F8D7DA"; fg = "#721C24"; label = "❌ Rejected";
  }

  return (
    <View className="self-start rounded-full px-3 py-1.5" style={{ backgroundColor: bg }}>
      <Text className="text-[12px] font-semibold" style={{ color: fg }}>{label}</Text>
    </View>
  );
}

function ReturnRequestSummary({
  returnInfo,
  colors,
}: {
  returnInfo: ApiOrderItemReturn;
  colors: ReturnType<typeof useAppTheme>["colors"];
}) {
  const refundPreferenceLabel =
    REFUND_PREFERENCES.find((pref) => pref.value === returnInfo.refund_preference)?.label ??
    returnInfo.refund_preference ??
    "N/A";

  return (
    <View className="mt-3 rounded-[14px] border p-3.5" style={{ borderColor: colors.border, backgroundColor: colors.background }}>
      <View className="flex-row items-center justify-between">
        <Text className="text-[14px] font-semibold" style={{ color: colors.text }}>Return Request</Text>
        <ReturnStatusBadge status={returnInfo.return_status} />
      </View>

      <View className="mt-3">
        <DetailRow label="Reason" value={returnInfo.return_reason_display ?? "N/A"} />
        {returnInfo.return_reason ? (
          <DetailRow label="Your Note" value={returnInfo.return_reason ?? "N/A"} />
        ) : null}
        <View className="mt-2">
          <DetailRow label="Refund Preference" value={refundPreferenceLabel} />
        </View>

        {returnInfo.is_refund_processed ? (
          <>
            <DetailRow
              label="Refund Amount"
              value={returnInfo.refund_amount ? formatMoney(returnInfo.refund_amount) : "N/A"}
            />
            <DetailRow
              label="Refund Date"
              value={returnInfo.refund_date ? new Date(returnInfo.refund_date).toLocaleDateString() : "N/A"}
            />
          </>
        ) : null}

        {returnInfo.return_status === "rejected" && returnInfo.admin_notes ? (
          <View className="mt-2 rounded-[10px] p-3" style={{ backgroundColor: "#F8D7DA" }}>
            <Text className="text-[12px] font-medium" style={{ color: "#721C24" }}>Admin Note</Text>
            <Text className="mt-1 text-[13px]" style={{ color: "#721C24" }}>{returnInfo.admin_notes}</Text>
          </View>
        ) : null}
      </View>

      {returnInfo.return_images?.length ? (
        <View className="mt-3">
          <Text className="text-[13px]" style={{ color: colors.textMuted }}>Submitted Photos</Text>
          <View className="mt-2 flex-row flex-wrap gap-2">
            {returnInfo.return_images.map((img) => {
              const resolvedUrl = img.image ?? resolveProductCardImageUrl(img.image_url);
              return (
                <View key={img.id} className="h-[64px] w-[64px] overflow-hidden rounded-[8px]" style={{ backgroundColor: colors.elevated }}>
                  {resolvedUrl ? <ProductCardImage uri={resolvedUrl} className="h-[100%] w-[100%]" contentFit="cover" /> : null}
                </View>
              );
            })}
          </View>
        </View>
      ) : null}

      {returnInfo.return_status === "pending" ? (
        <Text className="mt-3 text-[12px]" style={{ color: colors.textMuted }}>
          We're reviewing your request. You'll be notified once there's an update.
        </Text>
      ) : null}
    </View>
  );
}

export default function OrderDetailsScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { oid, itemId } = useLocalSearchParams<{ oid?: string; itemId?: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [returnInfo, setReturnInfo] = useState<ApiOrderItemReturn | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const [returnModalVisible, setReturnModalVisible] = useState(false);
  const [returnReasonCategory, setReturnReasonCategory] = useState<string | null>(null);
  const [returnDescription, setReturnDescription] = useState("");
  const [refundPreference, setRefundPreference] = useState<"wallet" | "voucher">("wallet");
  const [returnImages, setReturnImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  async function loadOrder() {
    if (!oid) {
      setOrder(null);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }
    try {
      const data = await getOrderByOid(oid);
      setOrder(data);
    } catch {
      setOrder(null);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  async function loadReturnInfo() {
    if (!itemId) {
      setReturnInfo(null);
      return;
    }
    try {
      const data = await getOrderItemReturnDetails(itemId);
      setReturnInfo(data);
    } catch {
      setReturnInfo(null);
    }
  }

  useEffect(() => {
    void loadOrder();
    void loadReturnInfo();
  }, [oid, itemId]);

  const orderDate = useMemo(
    () => (order?.order_date ? new Date(order.order_date).toLocaleString() : ""),
    [order?.order_date],
  );

  const targetItem = useMemo(() => {
    const items = order?.items ?? [];
    if (!items.length) return null;
    if (itemId) {
      const match = items.find((item) => String(item.id) === String(itemId));
      if (match) return match;
    }
    return items[0];
  }, [order, itemId]);

  const isCompleted = ["delivered", "completed"].some((status) =>
    String(order?.product_status ?? "").toLowerCase().includes(status),
  );
  const targetImageUrl = targetItem ? resolveProductCardImageUrl(targetItem.image) : null;

  const kwikpikTrackingEntries = useMemo(() => {
    if (!order?.kwikpik_tracking_data) return [] as Array<[string, ApiKwikpikTrackingDataEntry]>;
    return Object.entries(order.kwikpik_tracking_data) as Array<[string, ApiKwikpikTrackingDataEntry]>;
  }, [order]);

  function getKwikpikStatusLabel(status?: string | null) {
    const value = String(status ?? "").toUpperCase();
    switch (value) {
      case "PENDING": return "⏳ Pending";
      case "PICKED_UP": return "📦 Picked Up";
      case "IN_TRANSIT": return "🚚 In Transit";
      case "OUT_FOR_DELIVERY": return "🚛 Out for Delivery";
      case "DELIVERED": return "✅ Delivered";
      default: return status ?? "Pending";
    }
  }

  function getKwikpikStatusColor(status?: string | null) {
    const value = String(status ?? "").toUpperCase();
    switch (value) {
      case "PENDING": return "#856404";
      case "PICKED_UP":
      case "IN_TRANSIT":
      case "OUT_FOR_DELIVERY": return "#004085";
      case "DELIVERED": return "#155724";
      default: return colors.textMuted;
    }
  }

  const hasKwikpikTracking =
    Boolean(order?.kwikpik_tracking_data && Object.keys(order.kwikpik_tracking_data).length) ||
    Boolean(order?.kwikpik_tracking_id);

  async function handleReorder() {
    if (!targetItem) return;
    const productId = targetItem.product_ref;
    if (productId === undefined || productId === null) {
      notifyError("Re-order failed", "Product could not be matched.");
      return;
    }

    setIsReordering(true);
    try {
      const product = await getProductById(productId);
      if (isExplicitlyOutOfStock(product?.in_stock)) {
        notifyError("Out of stock", "This product is out of stock.");
        return;
      }

      await addOrIncrementCartItemWithOptions({
        productId: Number(productId),
        qty: targetItem.qty ?? 1,
        productColor: targetItem.product_color ?? "Default",
        productSize: targetItem.product_size ?? "Default",
      });
      notifySuccess("Added to cart", `${targetItem.product_name ?? targetItem.item ?? "Item"} added back to cart.`);
      router.push("/(tabs)/cart");
    } catch {
      notifyError("Re-order failed", "Unable to add this item to cart.");
    } finally {
      setIsReordering(false);
    }
  }

  async function handleSubmitReview() {
    if (!targetItem) return;
    const text = reviewText.trim();
    if (!text) {
      notifyError("Review required", "Please type a short review message.");
      return;
    }
    const productId = targetItem.product_ref;
    if (productId === undefined || productId === null) {
      notifyError("Review failed", "Product could not be matched for review.");
      return;
    }

    setIsSubmittingReview(true);
    try {
      await createProductReview({ productId: Number(productId), rating: reviewRating, review: text });
      notifySuccess("Review submitted", "Thanks for your feedback.");
      setReviewModalVisible(false);
      setReviewText("");
      setReviewRating(5);
    } catch {
      notifyError("Review failed", "Unable to submit review right now.");
    } finally {
      setIsSubmittingReview(false);
    }
  }

  function openReturnModal() {
    setReturnReasonCategory(null);
    setReturnDescription("");
    setRefundPreference("wallet");
    setReturnImages([]);
    setReturnModalVisible(true);
  }

  async function handlePickReturnImage() {
    if (returnImages.length >= 5) {
      notifyError("Limit reached", "You can upload up to 5 images.");
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      notifyError("Permission needed", "Please allow photo library access to upload return images.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], // updated from the deprecated ImagePicker.MediaTypeOptions.Images
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: 5 - returnImages.length,
    });
    if (result.canceled) return;

    const resized = await Promise.all(
      result.assets.map(async (asset) => {
        const manipulated = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 800 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
        );
        return { ...asset, uri: manipulated.uri, mimeType: "image/jpeg" };
      }),
    );

    setReturnImages((prev) => [...prev, ...resized].slice(0, 5));
  }

  function handleRemoveReturnImage(index: number) {
    setReturnImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmitReturn() {
    if (!itemId) return;
    if (!returnReasonCategory) {
      notifyError("Reason required", "Please select a reason for the return.");
      return;
    }
    if (returnImages.length < 2) {
      notifyError("Images required", "Please upload at least 2 images of the product.");
      return;
    }

    setIsSubmittingReturn(true);
    try {
      const result = await requestItemReturn(itemId, {
        returnReasonCategory,
        returnReason: returnDescription.trim() || undefined,
        refundPreference,
        images: returnImages.map((asset, idx) => ({
          uri: asset.uri,
          name: asset.fileName ?? `return_${idx}.jpg`,
          type: asset.mimeType ?? "image/jpeg",
        })),
      });

      if (result.success !== false) {
        notifySuccess("Return requested", result.message || "We'll review your request shortly.");
        setReturnModalVisible(false);
        void loadReturnInfo();
      } else {
        notifyError("Return failed", result.error || "Unable to submit return request.");
      }
    } catch (error: any) {
      console.log("RETURN ERROR:", error?.response?.data ?? error?.message ?? error);
      notifyError("Return failed", "Unable to submit return request right now.");
    } finally {
      setIsSubmittingReturn(false);
    }
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => { setIsRefreshing(true); void loadOrder(); void loadReturnInfo(); }}
          />
        }
      >
        <View className="flex-row items-center px-3 pb-3" style={{ paddingTop: Math.max(insets.top + 4, 12) }}>
          <Pressable className="h-8 w-8 items-center justify-center" onPress={() => goBackOr(router)} hitSlop={ICON_HIT_SLOP}>
            <BackIcon />
          </Pressable>
          <Text className="flex-1 text-center text-[24px] font-medium" style={{ color: colors.text }}>Order Details</Text>
          <View className="w-8" />
        </View>

        {isLoading ? (
          <View className="pt-12">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : !order || !targetItem ? (
          <View className="px-5 py-10">
            <Text className="text-center text-[14px]" style={{ color: colors.textMuted }}>
              Order item not found.
            </Text>
          </View>
        ) : (
          <View className="px-4 pb-8">
            <View
              className="overflow-hidden rounded-xl border p-3"
              style={{ borderColor: colors.border, backgroundColor: colors.card }}
            >
              <View className="flex-row items-center">
                <View className="h-[74px] w-[88px] overflow-hidden rounded-md" style={{ backgroundColor: colors.elevated }}>
                  {targetImageUrl ? <ProductCardImage uri={targetImageUrl} className="h-full w-full" /> : null}
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-[14px]" style={{ color: colors.text }}>
                    {targetItem.product_name ?? targetItem.item ?? "Product"}
                  </Text>
                  <Text className="mt-1 text-[12px]" style={{ color: colors.textMuted }}>
                    Qty: {targetItem.qty ?? 1}
                  </Text>
                  <Text className="mt-1 text-[12px]" style={{ color: colors.textMuted }}>
                    Color: {targetItem.product_color ?? "Default"} • Size: {targetItem.product_size ?? "Default"}
                  </Text>
                  <Text className="mt-1 text-[15px] font-medium" style={{ color: colors.text }}>
                    {formatMoney(targetItem.total ?? targetItem.price)}
                  </Text>
                  <Text className="mt-1 text-[12px]" style={{ color: colors.textMuted }}>
                    {targetItem.vendor_name ? `Sold by ${targetItem.vendor_name}` : "Sold by N/A"}
                  </Text>
                </View>
              </View>

              <View className="mt-4 flex-row gap-2">
                <Pressable
                  onPress={handleReorder}
                  disabled={isReordering}
                  className="flex-1 items-center rounded-full bg-primary py-3"
                >
                  {isReordering ? (
                    <ActivityIndicator color={colors.background} size="small" />
                  ) : (
                    <Text className="text-[14px] font-medium" style={{ color: colors.background }}>Re-order</Text>
                  )}
                </Pressable>

                {isCompleted ? (
                  <Pressable
                    onPress={() => setReviewModalVisible(true)}
                    className="flex-1 items-center rounded-full border py-3"
                    style={{ borderColor: colors.primary }}
                  >
                    <Text className="text-[14px] font-medium text-primary">Leave a Review</Text>
                  </Pressable>
                ) : null}
              </View>

              {/* Return section */}
              {returnInfo?.can_return ? (
                <Pressable
                  onPress={openReturnModal}
                  className="mt-2.5 items-center rounded-full border py-3"
                  style={{ borderColor: colors.textMuted }}
                >
                  <Text className="text-[14px] font-medium" style={{ color: colors.textMuted }}>
                    📦 Request Return
                  </Text>
                </Pressable>
              ) : returnInfo?.already_returned ? (
                <ReturnRequestSummary returnInfo={returnInfo} colors={colors} />
              ) : null}
            </View>

            <View className="mt-5 rounded-xl border p-4" style={{ borderColor: colors.border, backgroundColor: colors.card }}>
              <DetailRow label="Order Number" value={order.oid ?? ""} />
              <DetailRow label="Status" value={String(order.product_status ?? "Placed")} />
              <DetailRow label="Payment Method" value={String(order.payment_method ?? "N/A")} />
              <DetailRow label="Paid" value={order.paid_status ? "Yes" : "No"} />
              <DetailRow label="Coupon Used" value={order.coupon_used ? "Yes" : "No"} />
              <DetailRow label="Order Date" value={orderDate} />
              <DetailRow label="Kwikpik Tracking ID" value={order.kwikpik_tracking_id ?? "Not available"} />
              <DetailRow label="Delivery Address" value={String(order.address ?? "N/A")} />
              <DetailRow label="Delivery Method" value={String(order.delivery_method ?? "N/A")} />
            </View>

            {hasKwikpikTracking ? (
              <View className="mt-5 rounded-xl border p-4" style={{ borderColor: colors.border, backgroundColor: colors.card }}>
                <Text className="text-[16px] font-semibold" style={{ color: colors.text }}>Kwikpik Delivery Tracking</Text>
                {kwikpikTrackingEntries.length > 0 ? (
                  kwikpikTrackingEntries.map(([vendorId, trackingInfo]) => (
                    <View key={vendorId} className="mt-4 rounded-2xl border p-3" style={{ borderColor: colors.border, backgroundColor: colors.background }}>
                      <View className="mt-1 flex-row items-center justify-between">
                        <Text className="text-[13px]" style={{ color: colors.textMuted }}>Tracking ID</Text>
                        <Text className="text-[13px] font-semibold" style={{ color: colors.text }}>
                          {trackingInfo?.tracking_id ?? "Pending"}
                        </Text>
                      </View>
                      {trackingInfo?.tracking_id ? (
                        <Pressable
                          onPress={() => Linking.openURL(`https://kwikpik.io/live-tracking?q=${trackingInfo.tracking_id}`)}
                          className="mt-2 rounded-full bg-primary px-3 py-2"
                        >
                          <Text className="text-[13px] font-medium text-white">Track on Kwikpik</Text>
                        </Pressable>
                      ) : null}
                      <View className="mt-3 flex-row items-center justify-between">
                        <Text className="text-[13px]" style={{ color: colors.textMuted }}>Status</Text>
                        <Text className="text-[13px] font-semibold" style={{ color: getKwikpikStatusColor(trackingInfo?.live_status ?? trackingInfo?.status) }}>
                          {getKwikpikStatusLabel(trackingInfo?.live_status ?? trackingInfo?.status)}
                        </Text>
                      </View>
                      {trackingInfo?.rider_name ? (
                        <View className="mt-3 flex-row items-center justify-between">
                          <Text className="text-[13px]" style={{ color: colors.textMuted }}>Rider</Text>
                          <Text className="text-[13px] font-semibold" style={{ color: colors.text }}>
                            {trackingInfo.rider_name}
                          </Text>
                        </View>
                      ) : null}
                      {trackingInfo?.rider_phone ? (
                        <Pressable
                          onPress={() => Linking.openURL(`tel:${trackingInfo.rider_phone}`)}
                          className="mt-2 rounded-full border px-3 py-2"
                          style={{ borderColor: colors.primary }}
                        >
                          <Text className="text-[13px] font-medium" style={{ color: colors.primary }}>
                            Call Rider
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>
                  ))
                ) : (
                  <View className="mt-4 rounded-2xl border p-3" style={{ borderColor: colors.border, backgroundColor: colors.background }}>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-[13px]" style={{ color: colors.textMuted }}>Tracking ID</Text>
                      <Text className="text-[13px] font-semibold" style={{ color: colors.text }}>
                        {order.kwikpik_tracking_id ?? "Pending"}
                      </Text>
                    </View>
                    {order.kwikpik_tracking_id ? (
                      <Pressable
                        onPress={() => Linking.openURL(`https://kwikpik.io/live-tracking?q=${order.kwikpik_tracking_id}`)}
                        className="mt-2 rounded-full bg-primary px-3 py-2"
                      >
                        <Text className="text-[13px] font-medium text-white">Track on Kwikpik</Text>
                      </Pressable>
                    ) : null}
                  </View>
                )}
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>

      {/* Review modal */}
      <Modal transparent visible={reviewModalVisible} animationType="fade" onRequestClose={() => setReviewModalVisible(false)}>
        <View className="flex-1 items-center justify-center bg-black/35 px-5">
          <View className="w-full max-w-[340px] rounded-[14px] p-4" style={{ backgroundColor: colors.card }}>
            <Text className="text-[18px] font-medium" style={{ color: colors.text }}>Leave Review</Text>
            <Text className="mt-1 text-[13px]" style={{ color: colors.textMuted }}>
              {targetItem?.product_name ?? targetItem?.item ?? "Product"}
            </Text>

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

      {/* Return request modal */}
      <Modal transparent visible={returnModalVisible} animationType="slide" onRequestClose={() => setReturnModalVisible(false)}>
        <View className="flex-1 justify-end bg-black/35">
          <View className="max-h-[85%] rounded-t-[20px] p-4" style={{ backgroundColor: colors.card }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="text-[18px] font-semibold" style={{ color: colors.text }}>Request Return</Text>
              <Text className="mt-1 text-[13px]" style={{ color: colors.textMuted }}>
                {targetItem?.product_name ?? targetItem?.item ?? "Product"}
              </Text>

              <Text className="mt-4 text-[13px] font-medium" style={{ color: colors.text }}>Reason</Text>
              <View className="mt-2 flex-row flex-wrap gap-2">
                {RETURN_REASONS.map((reason) => {
                  const active = returnReasonCategory === reason.value;
                  return (
                    <Pressable
                      key={reason.value}
                      onPress={() => setReturnReasonCategory(reason.value)}
                      className="rounded-full border px-3 py-2"
                      style={{ borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary : "transparent" }}
                    >
                      <Text className="text-[12.5px]" style={{ color: active ? colors.background : colors.text }}>
                        {reason.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text className="mt-4 text-[13px] font-medium" style={{ color: colors.text }}>Description (optional)</Text>
              <TextInput
                value={returnDescription}
                onChangeText={setReturnDescription}
                placeholder="Add more detail about the issue..."
                placeholderTextColor={colors.textMuted}
                multiline
                textAlignVertical="top"
                className="mt-2 min-h-[70px] rounded-[10px] border px-3 py-2 text-[14px]"
                style={{ borderColor: colors.border, color: colors.text }}
              />

              <Text className="mt-4 text-[13px] font-medium" style={{ color: colors.text }}>Refund Preference</Text>
              <View className="mt-2 gap-2">
                {REFUND_PREFERENCES.map((pref) => {
                  const active = refundPreference === pref.value;
                  return (
                    <Pressable
                      key={pref.value}
                      onPress={() => setRefundPreference(pref.value)}
                      className="flex-row items-center rounded-[10px] border px-3 py-2.5"
                      style={{ borderColor: active ? colors.primary : colors.border }}
                    >
                      <View
                        className="mr-2.5 h-4.5 w-4.5 items-center justify-center rounded-full border-2"
                        style={{ borderColor: active ? colors.primary : colors.border }}
                      >
                        {active ? <View className="h-2.5 w-2.5 rounded-full bg-primary" /> : null}
                      </View>
                      <Text className="text-[13.5px]" style={{ color: colors.text }}>{pref.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text className="mt-4 text-[13px] font-medium" style={{ color: colors.text }}>
                Photos (min 2, max 5)
              </Text>
              <View className="mt-2 flex-row flex-wrap gap-2">
                {returnImages.map((asset, index) => (
                  <View key={asset.assetId ?? asset.uri} className="relative h-[76px] w-[76px] overflow-hidden rounded-[10px]" style={{ backgroundColor: colors.elevated }}>
                    <ProductCardImage uri={asset.uri} className="h-full w-full" />
                    <Pressable
                      onPress={() => handleRemoveReturnImage(index)}
                      className="absolute right-1 top-1 h-5 w-5 items-center justify-center rounded-full"
                      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
                    >
                      <Text className="text-[11px] text-white">✕</Text>
                    </Pressable>
                  </View>
                ))}
                {returnImages.length < 5 ? (
                  <Pressable
                    onPress={handlePickReturnImage}
                    className="h-[76px] w-[76px] items-center justify-center rounded-[10px] border"
                    style={{ borderColor: colors.border }}
                  >
                    <Text className="text-[22px]" style={{ color: colors.textMuted }}>+</Text>
                  </Pressable>
                ) : null}
              </View>

              <View className="mt-6 flex-row justify-end gap-2 pb-2">
                <Pressable onPress={() => setReturnModalVisible(false)} className="rounded-[8px] border px-4 py-2.5" style={{ borderColor: colors.border }}>
                  <Text className="text-[14px]" style={{ color: colors.textMuted }}>Cancel</Text>
                </Pressable>
                <Pressable onPress={handleSubmitReturn} disabled={isSubmittingReturn} className="rounded-[8px] bg-primary px-5 py-2.5">
                  {isSubmittingReturn ? (
                    <ActivityIndicator color={colors.background} size="small" />
                  ) : (
                    <Text className="text-[14px]" style={{ color: colors.background }}>Submit Return</Text>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}