import { useMemo, useState, type ReactNode } from "react";
import { Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
const RESOLUTION_OPTIONS = ["480 × 800", "720 × 1544", "1080 × 1920"];

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
  return (
    <View className="mt-4">
      <Pressable onPress={onToggle} className="flex-row items-center justify-between rounded-[2px] border px-3 py-2.5" style={{ borderColor: "#E8AE2B", backgroundColor: "transparent" }}>
        <Text className="text-[14px]" style={{ color: "#B88924" }}>{title}</Text>
        <Text className="text-[14px]" style={{ color: "#B88924" }}>{expanded ? "▴" : "▾"}</Text>
      </Pressable>
      {expanded ? children : null}
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
      className={`mr-2 mt-2 min-w-[78px] rounded-[8px] px-3 py-2 ${selected ? colorChipClass(label, selected) : ""}`}
      style={selected ? undefined : { backgroundColor: colors.elevated }}
    >
      <Text className="text-center text-[13px]" style={{ color: selected ? "#FFFFFF" : colors.text }}>{label}</Text>
    </Pressable>
  );
}

export default function FiltersScreen() {
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
    router.back();
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[0]} contentContainerStyle={{ paddingBottom: 32 }}>
        <View
          className="px-5 pb-3"
          style={{ width: "100%", maxWidth: contentMaxWidth, alignSelf: "center", paddingTop: Math.max(insets.top + 4, 12), backgroundColor: colors.background }}
        >
          <View className="mb-2 flex-row items-center justify-between">
            <Pressable className="h-8 w-8 items-center justify-center" onPress={() => router.back()}>
              <BackIcon />
            </Pressable>
            <View className="flex-row items-center gap-4">
              <SearchGrayIcon />
              <BellDarkIcon />
            </View>
          </View>

          <Text className="mt-1 text-center text-[40px] font-medium" style={{ color: colors.text }}>Filter</Text>

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

          <Section title="Prize (NG)" expanded={expanded.price} onToggle={() => setExpanded((prev) => ({ ...prev, price: !prev.price }))}>
            <View className="flex-row flex-wrap">
              <Chip label="Low to High" selected={sort === "price_asc"} onPress={() => setFilters({ sort: "price_asc" })} />
              <Chip
                label="Custom"
                selected={customPriceInput.trim().length > 0}
                onPress={() => {
                  setFilters({ sort: "relevance" });
                }}
              />
              <Chip label="High to Low" selected={sort === "price_desc"} onPress={() => setFilters({ sort: "price_desc" })} />
            </View>
            <View className="mt-4 rounded-[26px] border p-4" style={{ borderColor: colors.border, backgroundColor: colors.card }}>
              <Text className="text-[24px] font-semibold" style={{ color: colors.text }}>Price (Custom)</Text>
              <TextInput
                value={customPriceInput}
                onChangeText={setCustomPriceInput}
                keyboardType="numeric"
                placeholder="Enter Price"
                placeholderTextColor="#6E6E6E"
                className="mt-3 rounded-[2px] border px-3 py-2.5 text-[14px]"
                style={{ borderColor: "#E8AE2B", backgroundColor: colors.background, color: colors.text }}
              />
              <Pressable onPress={applyAndBack} className="mt-4 w-[120px] rounded-[4px] bg-primary py-2">
                <Text className="text-center text-[15px] font-semibold text-white">Set</Text>
              </Pressable>
            </View>
          </Section>

          <Section title="Sort by" expanded={expanded.sort} onToggle={() => setExpanded((prev) => ({ ...prev, sort: !prev.sort }))}>
            <View className="mt-2 rounded-[2px] px-2 py-1" style={{ backgroundColor: colors.card }}>
              {SORT_OPTIONS.map((item) => (
                <Pressable key={item.sort} onPress={() => setFilters({ sort: item.sort })} className="flex-row items-center justify-between py-1.5">
                  <Text className={`text-[16px] ${sort === item.sort ? "font-medium" : ""}`} style={{ color: sort === item.sort ? colors.text : colors.textMuted }}>{item.label}</Text>
                  <Text className="text-[16px]" style={{ color: colors.text }}>{sort === item.sort ? "✓" : ""}</Text>
                </Pressable>
              ))}
            </View>
          </Section>

          <Section title="Location (E.g Nigeria)" expanded={expanded.location} onToggle={() => setExpanded((prev) => ({ ...prev, location: !prev.location }))}>
            <TextInput
              value={location}
              onChangeText={(value) => setFilters({ location: value })}
              placeholder="Enter location"
              placeholderTextColor="#6E6E6E"
              className="mt-3 rounded-[2px] border px-3 py-2.5 text-[14px]"
              style={{ borderColor: "#E8AE2B", backgroundColor: colors.background, color: colors.text }}
            />
          </Section>

          <Section title="Resolution" expanded={expanded.resolution} onToggle={() => setExpanded((prev) => ({ ...prev, resolution: !prev.resolution }))}>
            <View className="flex-row flex-wrap">
              {RESOLUTION_OPTIONS.map((item) => (
                <Chip key={item} label={item} selected={resolution === item} onPress={() => setFilters({ resolution: resolution === item ? "" : item })} />
              ))}
            </View>
          </Section>

          <View className="mt-6 flex-row items-center justify-between">
            <Pressable
              onPress={() => {
                resetFilters();
                setCustomPriceInput("");
              }}
              className="w-[48%] rounded-[4px] border py-2"
              style={{ borderColor: colors.border, backgroundColor: colors.card }}
            >
              <Text className="text-center text-[16px]" style={{ color: colors.textMuted }}>
                Clear All{selectedCount > 0 ? ` (${selectedCount})` : ""}
              </Text>
            </Pressable>
            <Pressable onPress={applyAndBack} className="w-[48%] rounded-[4px] bg-primary py-2">
              <Text className="text-center text-[16px] font-semibold text-white">Apply</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
