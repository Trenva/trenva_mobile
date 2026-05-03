import { useMemo, useState, type ReactNode } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { BackIcon, BellDarkIcon, SearchGrayIcon } from "../../components/ui/general-ui";
import { useProductFilterStore, type ProductSort } from "../../store/product-filter-store";

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
      <Pressable onPress={onToggle} className="flex-row items-center justify-between rounded-[2px] border border-[#E8AE2B] bg-white px-3 py-2.5">
        <Text className="text-[14px] text-[#464646]">{title}</Text>
        <Text className="text-[14px] text-[#555555]">{expanded ? "▴" : "▾"}</Text>
      </Pressable>
      {expanded ? children : null}
    </View>
  );
}

function colorChipClass(label: string, selected: boolean) {
  if (!selected) return "bg-[#F2F0EE]";
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
  return (
    <Pressable onPress={onPress} className={`mr-2 mt-2 min-w-[78px] rounded-[8px] px-3 py-2 ${colorChipClass(label, selected)}`}>
      <Text className={`text-center text-[13px] ${selected ? "text-white" : "text-[#4D4D4D]"}`}>{label}</Text>
    </Pressable>
  );
}

export default function FiltersScreen() {
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
    <View className="flex-1 bg-[#F7F7F7]">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="px-5 pt-3">
          <View className="mb-2 flex-row items-center justify-between">
            <Pressable className="h-8 w-8 items-center justify-center" onPress={() => router.back()}>
              <BackIcon />
            </Pressable>
            <View className="flex-row items-center gap-4">
              <SearchGrayIcon />
              <BellDarkIcon />
            </View>
          </View>

          <Text className="mt-1 text-center text-[40px] font-medium text-[#2D2D2D]">Filter</Text>

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
            <View className="mt-4 rounded-[26px] border border-[#2D2D2D] bg-[#F7F7F7] p-4">
              <Text className="text-[28px] font-semibold text-[#2D2D2D]">Price (Custom)</Text>
              <TextInput
                value={customPriceInput}
                onChangeText={setCustomPriceInput}
                keyboardType="numeric"
                placeholder="Enter Price"
                placeholderTextColor="#6E6E6E"
                className="mt-3 rounded-[2px] border border-[#E8AE2B] bg-white px-3 py-2.5 text-[14px] text-[#2D2D2D]"
              />
              <Pressable onPress={applyAndBack} className="mt-4 w-[120px] rounded-[4px] bg-[#FF9F0A] py-2">
                <Text className="text-center text-[15px] font-semibold text-white">Set</Text>
              </Pressable>
            </View>
          </Section>

          <Section title="Sort by" expanded={expanded.sort} onToggle={() => setExpanded((prev) => ({ ...prev, sort: !prev.sort }))}>
            <View className="mt-2 rounded-[2px] bg-[#EEEEEE] px-2 py-1">
              {SORT_OPTIONS.map((item) => (
                <Pressable key={item.sort} onPress={() => setFilters({ sort: item.sort })} className="flex-row items-center justify-between py-1.5">
                  <Text className={`text-[16px] ${sort === item.sort ? "font-medium text-[#2C2C2C]" : "text-[#7B7B7B]"}`}>{item.label}</Text>
                  <Text className="text-[16px] text-[#2C2C2C]">{sort === item.sort ? "✓" : ""}</Text>
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
              className="mt-3 rounded-[2px] border border-[#E8AE2B] bg-white px-3 py-2.5 text-[14px] text-[#2D2D2D]"
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
              className="w-[48%] rounded-[4px] border border-[#C8C8C8] bg-white py-2"
            >
              <Text className="text-center text-[16px] text-[#8A8A8A]">
                Clear All{selectedCount > 0 ? ` (${selectedCount})` : ""}
              </Text>
            </Pressable>
            <Pressable onPress={applyAndBack} className="w-[48%] rounded-[4px] bg-[#FF9F0A] py-2">
              <Text className="text-center text-[16px] font-semibold text-white">Apply</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
