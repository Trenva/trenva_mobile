import { Pressable, Text, View, TextInput } from "react-native";
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";

export function CategorySearchBar({ compact = false }: { compact?: boolean }) {
  return (
    <View className="mb-6 flex-row items-center rounded-[14px] border border-primary bg-white px-3">
    <SearchOrangeIcon />
    <TextInput
      placeholder="Search"
      placeholderTextColor="#98A2B3"
      className="flex-1 px-3 py-3 text-[15px] text-[#2B2B2B]"
    />
  </View>
  );
}

export function FilterIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 16 16" fill="none">
      <Path
        d="M7.33333 14V10H8.66667V11.3333H14V12.6667H8.66667V14H7.33333ZM2 12.6667V11.3333H6V12.6667H2ZM4.66667 10V8.66667H2V7.33333H4.66667V6H6V10H4.66667ZM7.33333 8.66667V7.33333H14V8.66667H7.33333ZM10 6V2H11.3333V3.33333H14V4.66667H11.3333V6H10ZM2 4.66667V3.33333H8.66667V4.66667H2Z"
        fill="#2F2F2F"
      />
    </Svg>
  );
}

export function BackDarkIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12H19M5 12L9 16M5 12L9 8"
        stroke="#2D2D2D"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ChevronGrayIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 6L15 12L9 18"
        stroke="#7E7E7E"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SearchOrangeIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
        stroke="#FF9F0A"
        strokeWidth={1.8}
      />
      <Path
        d="M21 21L16.65 16.65"
        stroke="#FF9F0A"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function CategoryArtwork({ size = 60 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <Defs>
        <LinearGradient id="bg" x1="6" y1="6" x2="53" y2="53" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#1A73E8" />
          <Stop offset="0.65" stopColor="#0D5BC9" />
          <Stop offset="1" stopColor="#48C3FF" />
        </LinearGradient>
        <LinearGradient id="ribbon" x1="20" y1="12" x2="46" y2="46" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#FF84E8" />
          <Stop offset="1" stopColor="#FF4DA6" />
        </LinearGradient>
      </Defs>
      <Rect x="1.5" y="1.5" width="57" height="57" rx="10" fill="url(#bg)" />
      <Path d="M9 46L17 16L22 44L27 13L34 41L39 20L45 44" fill="#7BE3FF" opacity="0.95" />
      <Path
        d="M12 40C18 32 23 22 29 17C34 13 40 15 47 11C42 21 37 27 32 32C29 35 27 38 25 43C22 50 18 50 12 40Z"
        fill="url(#ribbon)"
      />
      <Path d="M31 17C36 19 41 22 45 28L34 39C30 35 27 30 26 25L31 17Z" fill="#FFD4F1" opacity="0.85" />
    </Svg>
  );
}

export function CategoryTile({
  label,
  onPress,
}: {
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="mb-7 w-[31%] items-center">
      <CategoryArtwork />
      <Text className="mt-2 text-center text-[11px] font-medium leading-[16px] text-primary">
        {label}
      </Text>
    </Pressable>
  );
}

export function SubcategorySection({
  title,
  items,
}: {
  title: string;
  items: { label: string; emoji: string }[];
}) {
  return (
    <View className="mb-9">
      <View className="mb-5 flex-row items-center justify-between">
        <Text className="text-[18px] font-medium text-[#303030]">{title}</Text>
        <Text className="text-xs font-medium text-[#4B4B4B] underline">View All</Text>
      </View>

      <View className="flex-row flex-wrap justify-between">
        {items.map((item) => (
          <View key={item.label} className="mb-7 w-[30%] items-center">
            <View className="h-12 w-12 items-center justify-center rounded-[10px] bg-[#F5F5F5]">
              <Text className="text-[28px]">{item.emoji}</Text>
            </View>
            <Text className="mt-2 text-center text-[12px] leading-[19px] text-[#333333]">
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function AllProductsCard({ title }: { title: string }) {
  return (
    <Pressable className="mb-8 mt-6 flex-row items-center justify-between rounded-xl border border-[#E8E8E8] bg-white px-4 py-3.5">
      <Text className="text-[16px] font-semibold text-[#303030]">{title}</Text>
      <ChevronGrayIcon />
    </Pressable>
  );
}
