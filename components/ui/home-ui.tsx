import { Pressable, Text, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fontStyles } from "../../lib/ui/typography";
import { useAppTheme } from "../../lib/theme/theme-provider";

export function HomeTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors, mode } = useAppTheme();
  return (
    <View
      className="px-0 pt-0"
      style={{ paddingBottom: insets.bottom, backgroundColor: colors.background }}
    >
      <View
        className="flex-row items-center justify-between px-3 py-1.5"
        style={{ backgroundColor: mode === "dark" ? colors.card : "#FAF5EF" }}
      >
        {state.routes.map((route: any, index: number) => {
          const focused = state.index === index;
          const color = focused ? "#FF9F0A" : "#D4A04A";

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              hitSlop={14}
              className="min-h-[46px] min-w-[64px] items-center justify-center rounded-[10px] px-3 py-1.5"
            >
              <TabIcon routeName={route.name} color={color} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function SectionTitle({
  title,
  orange = true,
  viewAllLabel = "View All",
  onPressViewAll,
  hideViewAll = false,
}: {
  title: string;
  orange?: boolean;
  viewAllLabel?: string;
  onPressViewAll?: () => void;
  hideViewAll?: boolean;
}) {
  const { colors } = useAppTheme();
  return (
    <View className="mb-4 mt-7 flex-row items-center justify-between px-4">
      <Text
        className="text-[15px] font-semibold"
        style={[fontStyles.semibold, { color: orange ? colors.primary : colors.text }]}
      >
        {title}
      </Text>
      {hideViewAll ? null : (
        <Pressable className="flex-row items-center gap-1" onPress={onPressViewAll}>
          <Text className="text-xs font-medium" style={[fontStyles.medium, { color: colors.textMuted }]}>
            {viewAllLabel}
          </Text>
          <ChevronRightIcon />
        </Pressable>
      )}
    </View>
  );
}

export function LocationPinIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21C12 21 18 16.2 18 10.8C18 7.04447 15.3137 4 12 4C8.68629 4 6 7.04447 6 10.8C6 16.2 12 21 12 21Z"
        stroke="#FF9F0A"
        strokeWidth={1.8}
      />
      <Circle cx={12} cy={10} r={2.2} fill="#FF9F0A" />
    </Svg>
  );
}

export function BellIcon() {
  const { colors } = useAppTheme();
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 19C14 20.1046 13.1046 21 12 21C10.8954 21 10 20.1046 10 19M18 8C18 5.23858 15.3137 3 12 3C8.68629 3 6 5.23858 6 8V11.1056C6 11.8042 5.755 12.4808 5.30718 13.0172L4.17588 14.3754C3.56384 15.1109 4.08704 16.25 5.04482 16.25H18.9552C19.913 16.25 20.4362 15.1109 19.8241 14.3754L18.6928 13.0172C18.245 12.4808 18 11.8042 18 11.1056V8Z"
        stroke={colors.textMuted}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SearchIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx={11} cy={11} r={6} stroke="#FF9F0A" strokeWidth={1.8} />
      <Path
        d="M20 20L16.65 16.65"
        stroke="#FF9F0A"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function HeartOutlineIcon({
  color = "#FF9F0A",
  size = 18,
}: {
  color?: string;
  size?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12.62 20.8116C12.28 20.9316 11.72 20.9316 11.38 20.8116C8.48 19.8216 2 15.6916 2 8.69156C2 5.60156 4.49 3.10156 7.56 3.10156C9.38 3.10156 10.99 3.98156 12 5.34156C13.01 3.98156 14.63 3.10156 16.44 3.10156C19.51 3.10156 22 5.60156 22 8.69156C22 15.6916 15.52 19.8216 12.62 20.8116Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function HeartFilledIcon({
  color = "#FF9F0A",
  size = 18,
}: {
  color?: string;
  size?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12.62 20.8116C12.28 20.9316 11.72 20.9316 11.38 20.8116C8.48 19.8216 2 15.6916 2 8.69156C2 5.60156 4.49 3.10156 7.56 3.10156C9.38 3.10156 10.99 3.98156 12 5.34156C13.01 3.98156 14.63 3.10156 16.44 3.10156C19.51 3.10156 22 5.60156 22 8.69156C22 15.6916 15.52 19.8216 12.62 20.8116Z"
        fill={color}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ChevronRightIcon() {
  const { colors } = useAppTheme();
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 6L15 12L9 18"
        stroke={colors.textMuted}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CouponIcon({
  baseColor = "#FFB000",
  accentColor = "#F32013",
}: {
  baseColor?: string;
  accentColor?: string;
}) {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 7.5C4 6.11929 5.11929 5 6.5 5H15.5858C16.2488 5 16.8847 5.26339 17.3536 5.73223L19.2678 7.64645C19.7366 8.11529 20 8.7512 20 9.41421V17.5C20 18.8807 18.8807 20 17.5 20H6.5C5.11929 20 4 18.8807 4 17.5V7.5Z"
        fill={baseColor}
      />
      <Circle cx={8} cy={9} r={1.2} fill={accentColor} />
      <Path
        d="M9 15L15 9"
        stroke={accentColor}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Circle cx={15.5} cy={15.5} r={1.2} fill={accentColor} />
    </Svg>
  );
}

export function TabIcon({
  routeName,
  color,
}: {
  routeName: string;
  color: string;
}) {
  if (routeName === "index") {
    return (
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Path
          d="M4 10.6L12 4L20 10.6V20H14.4V14.2H9.6V20H4V10.6Z"
          fill={color}
        />
      </Svg>
    );
  }

  if (routeName === "categories") {
    return (
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Rect x={4} y={4} width={6} height={6} rx={1.5} stroke={color} strokeWidth={1.8} />
        <Rect x={14} y={4} width={6} height={6} rx={1.5} stroke={color} strokeWidth={1.8} />
        <Rect x={4} y={14} width={6} height={6} rx={1.5} stroke={color} strokeWidth={1.8} />
        <Rect x={14} y={14} width={6} height={6} rx={1.5} stroke={color} strokeWidth={1.8} />
      </Svg>
    );
  }

  if (routeName === "cart") {
    return (
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Path
          d="M5 6H7L9.4 14.4H18L20 8.2H8.5"
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx={10} cy={18} r={1.5} fill={color} />
        <Circle cx={17} cy={18} r={1.5} fill={color} />
      </Svg>
    );
  }

  if (routeName === "wishlist") {
    return <HeartOutlineIcon color={color} size={22} />;
  }

  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8.5} r={3.2} stroke={color} strokeWidth={1.8} />
      <Path
        d="M5 19C5.9 15.9 8.5 14.5 12 14.5C15.5 14.5 18.1 15.9 19 19"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.2} opacity={0.45} />
    </Svg>
  );
}

export function TrashIcon({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 6H5M9 11V17M15 11V17M4 6H20L18.2 19.6C18.1 20.8 17 21.7 15.8 21.7H8.2C7 21.7 5.9 20.8 5.8 19.6L4 6Z"
        stroke="#FF9B00"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function WalletIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 7H21V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V7Z" stroke="#2D2D2D" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 7V5C16 3.89543 15.1046 3 14 3H6C4.89543 3 4 3.89543 4 5V7" stroke="#2D2D2D" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function GlobeIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" stroke="#2D2D2D" strokeWidth={1.6} />
      <Path d="M2 12H22M12 2C14.5 6 14.5 18 12 22" stroke="#2D2D2D" strokeWidth={1.2} />
    </Svg>
  );
}

export function OrdersIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 7H21V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V7Z" stroke="#2D2D2D" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 3H17V7H7V3Z" stroke="#2D2D2D" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function HeadsetIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3C7.03 3 3 7.03 3 12V17C3 18.1046 3.89543 19 5 19H6C7.10457 19 8 18.1046 8 17V13C8 11.8954 7.10457 11 6 11H5" stroke="#2D2D2D" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M21 12V17C21 18.1046 20.1046 19 19 19H18C16.8954 19 16 18.1046 16 17V13C16 11.8954 16.8954 11 18 11H19" stroke="#2D2D2D" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function HelpIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 18H12.01" stroke="#2D2D2D" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8.53 9.11C9.11999 8.09 10.48 7.5 12 7.5C13.52 7.5 14.88 8.09 15.47 9.11C15.84 9.75 15.75 10.56 15.21 11.06C14.6 11.61 13.9 12.09 13.9 13.25" stroke="#2D2D2D" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function LogoutIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M16 17L21 12L16 7" stroke="#2D2D2D" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M21 12H9" stroke="#2D2D2D" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M13 5H6C4.89543 5 4 5.89543 4 7V17C4 18.1046 4.89543 19 6 19H13" stroke="#2D2D2D" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
