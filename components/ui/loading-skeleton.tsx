import type { DimensionValue } from "react-native";
import { View } from "react-native";
import { useAppTheme } from "../../lib/theme/theme-provider";

export function LoadingSkeletonBlock({
  height = 16,
  width = "100%",
  className = "",
}: {
  height?: number;
  width?: DimensionValue;
  className?: string;
}) {
  const { colors } = useAppTheme();

  return (
    <View
      className={`overflow-hidden rounded-md ${className}`}
      style={{ backgroundColor: colors.elevated, height, width }}
    />
  );
}

export function LoadingListSkeleton({ rows = 3 }: { rows?: number }) {
  const { colors } = useAppTheme();

  return (
    <View className="gap-3 py-4">
      {Array.from({ length: rows }).map((_, index) => (
        <View
          key={`skeleton-row-${index}`}
          className="rounded-xl p-3"
          style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }}
        >
          <LoadingSkeletonBlock height={14} width="70%" />
          <LoadingSkeletonBlock height={12} width="40%" className="mt-2" />
          <LoadingSkeletonBlock height={12} width="50%" className="mt-2" />
        </View>
      ))}
    </View>
  );
}

export function HomeFeedSkeleton() {
  const { colors } = useAppTheme();

  return (
    <View className="px-4 pb-8">
      <LoadingSkeletonBlock height={170} className="mt-2 rounded-[10px]" />

      <View className="mt-8 flex-row items-center justify-between">
        <LoadingSkeletonBlock height={16} width={110} />
        <LoadingSkeletonBlock height={12} width={60} />
      </View>
      <View className="mt-4 flex-row gap-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <View key={`cat-skel-${index}`} className="items-center">
            <LoadingSkeletonBlock height={42} width={42} className="rounded-full" />
            <LoadingSkeletonBlock height={9} width={56} className="mt-2 rounded-sm" />
          </View>
        ))}
      </View>

      <View className="mt-8 px-4 py-4" style={{ backgroundColor: colors.card }}>
        <View className="flex-row items-center justify-between">
          <LoadingSkeletonBlock height={15} width={90} />
          <LoadingSkeletonBlock height={12} width={55} />
        </View>
      </View>

      <View className="mt-4 flex-row gap-3">
        {Array.from({ length: 2 }).map((_, index) => (
          <View
            key={`row-card-skel-${index}`}
            className="flex-1 overflow-hidden rounded-[6px]"
            style={{ backgroundColor: colors.card }}
          >
            <LoadingSkeletonBlock height={122} className="rounded-none" />
            <View className="px-2 pb-3 pt-3">
              <LoadingSkeletonBlock height={11} width="80%" />
              <LoadingSkeletonBlock height={11} width="55%" className="mt-2" />
            </View>
          </View>
        ))}
      </View>

      <View className="mt-8 flex-row items-center justify-between">
        <LoadingSkeletonBlock height={16} width={140} />
        <LoadingSkeletonBlock height={12} width={60} />
      </View>
      <View className="mt-4 flex-row gap-3">
        {Array.from({ length: 2 }).map((_, index) => (
          <View
            key={`bottom-card-skel-${index}`}
            className="flex-1 overflow-hidden rounded-[6px]"
            style={{ backgroundColor: colors.card }}
          >
            <LoadingSkeletonBlock height={122} className="rounded-none" />
            <View className="px-2 pb-3 pt-3">
              <LoadingSkeletonBlock height={11} width="80%" />
              <LoadingSkeletonBlock height={11} width="55%" className="mt-2" />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export function ProductGridSkeleton({ rows = 3 }: { rows?: number }) {
  const { colors } = useAppTheme();

  return (
    <View className="py-4">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <View key={`product-grid-skel-row-${rowIndex}`} className="mb-4 flex-row justify-between">
          {Array.from({ length: 2 }).map((__, colIndex) => (
            <View
              key={`product-grid-skel-${rowIndex}-${colIndex}`}
              className="w-[48%] overflow-hidden rounded-[8px]"
              style={{ backgroundColor: colors.card }}
            >
              <LoadingSkeletonBlock height={112} className="rounded-none" />
              <View className="px-2.5 pb-3 pt-3.5">
                <LoadingSkeletonBlock height={12} width="85%" />
                <LoadingSkeletonBlock height={12} width="65%" className="mt-2" />
                <LoadingSkeletonBlock height={13} width="45%" className="mt-2" />
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
