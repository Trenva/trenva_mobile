import type { DimensionValue } from "react-native";
import { View } from "react-native";

export function LoadingSkeletonBlock({
  height = 16,
  width = "100%",
  className = "",
}: {
  height?: number;
  width?: DimensionValue;
  className?: string;
}) {
  return <View className={`overflow-hidden rounded-md bg-[#ECECEC] ${className}`} style={{ height, width }} />;
}

export function LoadingListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <View className="gap-3 py-4">
      {Array.from({ length: rows }).map((_, index) => (
        <View key={`skeleton-row-${index}`} className="rounded-xl border border-[#EFEFEF] bg-white p-3">
          <LoadingSkeletonBlock height={14} width="70%" />
          <LoadingSkeletonBlock height={12} width="40%" className="mt-2" />
          <LoadingSkeletonBlock height={12} width="50%" className="mt-2" />
        </View>
      ))}
    </View>
  );
}
