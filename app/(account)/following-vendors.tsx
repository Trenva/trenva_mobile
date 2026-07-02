import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackIcon } from "../../components/ui/general-ui";
import { CachedImage } from "../../components/ui/cached-image";
import { goBackOr } from "../../lib/navigation/go-back-or";
import { getVendorByVid, getVendors, resolveMediaUrl, type ApiVendor } from "../../lib/api/shop";
import { useAppTheme } from "../../lib/theme/theme-provider";

const ICON_HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 } as const;

export default function FollowingVendorsScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [vendors, setVendors] = useState<ApiVendor[]>([]);

  async function loadVendors(showLoader = true) {
    try {
      if (showLoader) setIsLoading(true);
      const all = await getVendors();
      const withImages = await Promise.all(
        all.map(async (vendor) => {
          if (vendor.image) return vendor;
          if (!vendor.is_following || !vendor.vid) return vendor;
          try {
            const details = await getVendorByVid(vendor.vid);
            return { ...vendor, image: details.image ?? vendor.image ?? null };
          } catch {
            return vendor;
          }
        }),
      );
      setVendors(withImages);
    } catch {
      setVendors([]);
    } finally {
      if (showLoader) setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    void loadVendors(true);
  }, []);

  const followedVendors = useMemo(
    () => vendors.filter((vendor) => Boolean(vendor.is_following)),
    [vendors],
  );

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              void loadVendors(false);
            }}
          />
        }
      >
        <View className="flex-row items-center px-3 pb-3" style={{ paddingTop: Math.max(insets.top + 4, 12), backgroundColor: colors.background }}>
          <Pressable className="h-8 w-8 items-center justify-center" onPress={() => goBackOr(router)} hitSlop={ICON_HIT_SLOP}>
            <BackIcon />
          </Pressable>
          <Text className="flex-1 text-center text-[24px] font-medium" style={{ color: colors.text }}>Followed Vendors</Text>
          <View className="w-8" />
        </View>

        <View className="px-4 pb-8">
          {isLoading ? (
            <View className="pt-10">
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : followedVendors.length === 0 ? (
            <View className="pt-10">
              <Text className="text-center text-[15px]" style={{ color: colors.textMuted }}>
                You are not following any vendors yet.
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {followedVendors.map((vendor) => {
                const title =
                  vendor.business_name?.trim() ||
                  vendor.store_name?.trim() ||
                  vendor.name?.trim() ||
                  "Vendor";
                const vendorImageUri = resolveMediaUrl(
                  vendor.image ??
                    ((vendor as unknown as { profile_image?: string | null }).profile_image ?? null) ??
                    ((vendor as unknown as { logo?: string | null }).logo ?? null),
                );
                const vendorInitial = (title.trim().charAt(0) || "V").toUpperCase();
                return (
                  <Pressable
                    key={vendor.vid}
                    onPress={() => router.push({ pathname: "/vendor/[slug]", params: { slug: vendor.vid } })}
                    className="flex-row items-center rounded-xl border p-3"
                    style={{ borderColor: colors.border, backgroundColor: colors.card }}
                  >
                    <View
                      style={[styles.vendorAvatarWrap, { backgroundColor: colors.elevated, borderColor: colors.border }]}
                    >
                      {vendorImageUri ? (
                        <CachedImage uri={vendorImageUri} style={styles.vendorAvatarImage} />
                      ) : (
                        <View style={[styles.vendorAvatarFallback, { backgroundColor: colors.elevated }]}>
                          <Text className="text-[18px] font-semibold" style={{ color: colors.primary }}>
                            {vendorInitial}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View className="ml-3 flex-1">
                      <Text numberOfLines={1} className="text-[15px] font-medium" style={{ color: colors.text }}>
                        {title}
                      </Text>
                      <Text numberOfLines={1} className="mt-1 text-[12px]" style={{ color: colors.textMuted }}>
                        {vendor.address || vendor.category || "Vendor"}
                      </Text>
                    </View>
                    <Text className="text-[12px]" style={{ color: colors.primary }}>View</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  vendorAvatarWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    overflow: "hidden",
  },
  vendorAvatarImage: {
    width: "100%",
    height: "100%",
  },
  vendorAvatarFallback: {
    width: "100%",
    height: "100%",
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },
});
