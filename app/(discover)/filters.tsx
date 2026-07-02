import { useMemo, useState, type ReactNode } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { goBackOr } from "../../lib/navigation/go-back-or";
import { BackIcon, BellDarkIcon, SearchGrayIcon } from "../../components/ui/general-ui";
import { useProductFilterStore, type ProductSort } from "../../store/product-filter-store";
import { useAppTheme } from "../../lib/theme/theme-provider";

const COLOR_OPTIONS = ["Blue", "Black", "White", "Gold", "Yellow", "Purple", "Cyan", "Violet", "Silver", "Ash", "Red", "Maroon"];
const REVIEW_OPTIONS = ["5 stars", "4 plus stars", "2 stars and below"];
const SORT_OPTIONS: { label: string; sort: ProductSort }[] = [
  { label: "Relevance", sort: "relevance" },
  { label: "Top Sales", sort: "top_sales" },
  { label: "Most Recent", sort: "most_recent" },
  { label: "Price: Low To High", sort: "price_asc" },
  { label: "Price: High To Low", sort: "price_desc" },
];
const RESOLUTION_OPTIONS = ["480 x 800", "720 x 1544", "1080 x 1920"];

function Section({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children?: ReactNode;
}) {
  const { colors } = useAppTheme();

  return (
    <View className="mt-3 overflow-hidden rounded-2xl border" style={{ borderColor: colors.border, backgroundColor: colors.card }}>
      <Pressable onPress={onToggle} className="flex-row items-center justify-between px-4 py-3">
        <Text className="text-[15px] font-semibold" style={{ color: colors.text }}>{title}</Text>
        <Text className="text-[16px] font-semibold" style={{ color: colors.textMuted }}>{expanded ? "^" : "v"}</Text>
      </Pressable>
      {expanded ? <View className="border-t px-4 pb-4 pt-2" style={{ borderColor: colors.border }}>{children}</View> : null}
    </View>
  );
}

function colorChipClass(label: string, selected: boolean) {
  if (!selected) return "";
  if (label === "Blue") return "bg-[#1D8FB7]";
  if (label === "Red") return "bg-[#F51313]";
  if (label === "Orange") return "bg-[#FF9500]";
  return "bg-primary";
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      className={`mr-2 mt-2 min-w-[78px] rounded-xl px-3 py-2 ${selected ? colorChipClass(label, selected) : ""}`}
      style={selected ? undefined : { backgroundColor: colors.elevated, borderColor: colors.border, borderWidth: 1 }}
    >
      <Text className="text-center text-[13px] font-medium" style={{ color: selected ? "#FFFFFF" : colors.text }}>{label}</Text>
    </Pressable>
  );
}

export default function FiltersScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const contentMaxWidth = width >= 900 ? 980 : undefined;
  const { color, review, location, resolution, sort, maxPrice, setFilters, resetFilters } = useProductFilterStore();
  const [customPriceInput, setCustomPriceInput] = useState(typeof maxPrice === "number" ? String(maxPrice) : "");
  const [expanded, setExpanded] = useState({
    colour: true,
    reviews: true,
    price: true,
    sort: true,
    location: true,
    resolution: true,
  });

  const selectedCount = useMemo(() => {
    let count = 0;
    if (color) count += 1;
    if (review) count += 1;
    if (location) count += 1;
    if (resolution) count += 1;
    if (typeof maxPrice === "number") count += 1;
    if (sort !== "relevance") count += 1;
    return count;
  }, [color, location, maxPrice, resolution, review, sort]);

  function applyAndBack() {
    const parsedCustom = Number(customPriceInput);
    setFilters({
      maxPrice: Number.isFinite(parsedCustom) && customPriceInput.trim().length > 0 ? parsedCustom : null,
    });
    goBackOr(router);
  }

  return (
    <KeyboardAvoidingView className="flex-1" style={{ backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={{ paddingBottom: 32, flexGrow: 1 }}
      >
        <View
          className="px-4 pb-3"
          style={{ width: "100%", maxWidth: contentMaxWidth, alignSelf: "center", paddingTop: Math.max(insets.top + 4, 12), backgroundColor: colors.background }}
        >
          <View className="mb-2 flex-row items-center justify-between">
            <Pressable className="h-8 w-8 items-center justify-center" hitSlop={12} onPress={() => goBackOr(router)}>
              <BackIcon />
            </Pressable>
            <View className="flex-row items-center gap-4">
              <SearchGrayIcon />
              <Pressable onPress={() => router.push("/notifications")} hitSlop={12}>
                <BellDarkIcon />
              </Pressable>
            </View>
          </View>

          <View className="mt-2 rounded-2xl border px-4 py-4" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
            <Text className="text-[26px] font-bold" style={{ color: colors.text }}>Filters</Text>
            <Text className="mt-1 text-[13px]" style={{ color: colors.textMuted }}>
              Refine products by color, reviews, price, location and sorting.
            </Text>
          </View>

          <Section title="Colour" expanded={expanded.colour} onToggle={() => setExpanded((prev) => ({ ...prev, colour: !prev.colour }))}>
            <View className="flex-row flex-wrap">
              {COLOR_OPTIONS.map((item) => (
                <Chip key={item} label={item} selected={color === item} onPress={() => setFilters({ color: color === item ? "" : item })} />
              ))}
            </View>
          </Section>

          <Section title="Customer reviews" expanded={expanded.reviews} onToggle={() => setExpanded((prev) => ({ ...prev, reviews: !prev.reviews }))}>
            <View className="flex-row flex-wrap">
              {REVIEW_OPTIONS.map((item) => (
                <Chip key={item} label={item} selected={review === item} onPress={() => setFilters({ review: review === item ? "" : item })} />
              ))}
            </View>
          </Section>

          <Section title="Price (NGN)" expanded={expanded.price} onToggle={() => setExpanded((prev) => ({ ...prev, price: !prev.price }))}>
            <View className="flex-row flex-wrap">
              <Chip label="Low to High" selected={sort === "price_asc"} onPress={() => setFilters({ sort: "price_asc" })} />
              <Chip label="Custom" selected={customPriceInput.trim().length > 0} onPress={() => setFilters({ sort: "relevance" })} />
              <Chip label="High to Low" selected={sort === "price_desc"} onPress={() => setFilters({ sort: "price_desc" })} />
            </View>
            <View className="mt-4 rounded-2xl border p-4" style={{ borderColor: colors.border, backgroundColor: colors.background }}>
              <Text className="text-[18px] font-semibold" style={{ color: colors.text }}>Custom Max Price</Text>
              <TextInput
                value={customPriceInput}
                onChangeText={setCustomPriceInput}
                keyboardType="numeric"
                placeholder="Enter price"
                placeholderTextColor={colors.textMuted}
                className="mt-3 rounded-xl border px-3 py-3 text-[14px]"
                style={{ borderColor: colors.border, backgroundColor: colors.card, color: colors.text }}
              />
              <Pressable onPress={applyAndBack} className="mt-4 w-[120px] rounded-xl bg-primary py-2.5">
                <Text className="text-center text-[14px] font-semibold text-white">Set</Text>
              </Pressable>
            </View>
          </Section>

          <Section title="Sort by" expanded={expanded.sort} onToggle={() => setExpanded((prev) => ({ ...prev, sort: !prev.sort }))}>
            <View className="mt-2 rounded-xl px-2 py-1" style={{ backgroundColor: colors.background }}>
              {SORT_OPTIONS.map((item) => (
                <Pressable key={item.sort} onPress={() => setFilters({ sort: item.sort })} className="flex-row items-center justify-between py-1.5">
                  <Text className={`text-[16px] ${sort === item.sort ? "font-medium" : ""}`} style={{ color: sort === item.sort ? colors.text : colors.textMuted }}>{item.label}</Text>
                  <Text className="text-[16px]" style={{ color: colors.text }}>{sort === item.sort ? "✓" : ""}</Text>
                </Pressable>
              ))}
            </View>
          </Section>

          <Section title="Location (e.g Nigeria)" expanded={expanded.location} onToggle={() => setExpanded((prev) => ({ ...prev, location: !prev.location }))}>
            <TextInput
              value={location}
              onChangeText={(value) => setFilters({ location: value })}
              placeholder="Enter location"
              placeholderTextColor={colors.textMuted}
              className="mt-3 rounded-xl border px-3 py-3 text-[14px]"
              style={{ borderColor: colors.border, backgroundColor: colors.background, color: colors.text }}
            />
          </Section>

          <Section title="Resolution" expanded={expanded.resolution} onToggle={() => setExpanded((prev) => ({ ...prev, resolution: !prev.resolution }))}>
            <View className="flex-row flex-wrap">
              {RESOLUTION_OPTIONS.map((item) => (
                <Chip key={item} label={item} selected={resolution === item} onPress={() => setFilters({ resolution: resolution === item ? "" : item })} />
              ))}
            </View>
          </Section>

          <View className="mt-6 flex-row items-center justify-between gap-3">
            <Pressable
              onPress={() => {
                resetFilters();
                setCustomPriceInput("");
              }}
              className="flex-1 rounded-xl border py-3"
              style={{ borderColor: colors.border, backgroundColor: colors.card }}
            >
              <Text className="text-center text-[15px] font-medium" style={{ color: colors.textMuted }}>
                Clear All{selectedCount > 0 ? ` (${selectedCount})` : ""}
              </Text>
            </Pressable>
            <Pressable onPress={applyAndBack} className="flex-1 rounded-xl bg-primary py-3">
              <Text className="text-center text-[15px] font-semibold text-white">Apply Filters</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

